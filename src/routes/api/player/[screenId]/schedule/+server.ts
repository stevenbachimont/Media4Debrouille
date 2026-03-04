import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

/** Retourne la playlist active pour cet écran selon le planning (timezone du site). */
export const GET: RequestHandler = async (event) => {
	const authResult = await requirePlayerAuth(event);
	if (authResult instanceof Response) return authResult;
	const screenId = authResult;
	try {
		console.log('[API schedule] screenId authentifié:', screenId);

		const screen = await prisma.screen.findUnique({
			where: { id: screenId },
			include: { site: true }
		});
		if (!screen) {
			console.log('[API schedule] écran non trouvé:', screenId);
			return json({ error: 'Écran non trouvé' }, { status: 404 });
		}
		console.log('[API schedule] écran trouvé:', screen.name, 'siteId:', screen.siteId, 'groupId:', screen.groupId);

		const now = new Date();
		const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

		// Heure et jour actuels dans le fuseau du site (pour startTime/endTime et daysOfWeek)
		const tz = screen.site?.timezone ?? 'Europe/Paris';
		const currentTimeStr = new Date().toLocaleTimeString('en-GB', {
			timeZone: tz,
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const currentDayStr = new Date().toLocaleString('en-US', { timeZone: tz, weekday: 'long' });
		const currentDayOfWeek = dayNames.indexOf(currentDayStr);

		const where = {
			OR: [
				{ targetType: 'SCREEN' as const, targetId: screenId },
				...(screen.groupId ? [{ targetType: 'GROUP' as const, targetId: screen.groupId }] : [])
			],
			startDate: { lte: endOfTodayUTC },
			endDate: { gte: startOfTodayUTC }
		};

		const schedules = await prisma.schedule.findMany({
			where,
			include: { playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } },
			orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }]
		});

		// Ne garder que les plannings actifs à cette heure et ce jour (timezone du site)
		const activeSchedules = schedules.filter((s) => {
			let days: number[] = [];
			try {
				days = JSON.parse(s.daysOfWeek || '[]');
			} catch {
				days = [0, 1, 2, 3, 4, 5, 6];
			}
			if (!days.includes(currentDayOfWeek)) return false;
			const startTime = (s.startTime || '00:00').trim();
			const endTime = (s.endTime || '23:59').trim();
			// Actif si currentTime >= startTime ET currentTime <= endTime (arrêt à endTime passée)
			if (currentTimeStr < startTime || currentTimeStr > endTime) return false;
			return true;
		});

		const origin = event.url.origin;
		let activeSchedule = activeSchedules[0];
		if (activeSchedule?.playlist) {
			const playlist = activeSchedule.playlist;
			// URL du média : cdnUrl ou url, ou pour les uploads locaux s3Key → /uploads/s3Key
			const rawUrl = (m: { cdnUrl?: string | null; url?: string | null; s3Key?: string | null }) => {
				const u = (m.cdnUrl && m.cdnUrl.trim()) || (m.url && m.url.trim());
				if (u) return u;
				const key = m.s3Key && m.s3Key.trim();
				return key ? `/uploads/${key}` : '';
			};
			const items = playlist.items
				.filter((i) => i.media && rawUrl(i.media))
				.map((i) => {
					const url = rawUrl(i.media!);
					const cdnUrl = url.startsWith('/') ? `${origin}${url}` : url;
					return {
						mediaId: i.mediaId,
						order: i.order,
						duration: i.duration ?? playlist.defaultDuration,
						type: i.media!.type,
						cdnUrl,
						name: i.media!.name
					};
				});
			return json({
				playlistId: playlist.id,
				version: playlist.version,
				defaultDuration: playlist.defaultDuration,
				transition: playlist.transition,
				items
			});
		}

		return json({
			playlistId: null,
			version: 0,
			defaultDuration: 10,
			transition: 'FADE',
			items: [] as { mediaId: string; order: number; duration: number; type: string; cdnUrl: string; name: string }[]
		});
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('[API schedule] erreur:', err);
		const message = err instanceof Error ? err.message : String(err);
		return json({ error: message }, { status: 500 });
	}
};

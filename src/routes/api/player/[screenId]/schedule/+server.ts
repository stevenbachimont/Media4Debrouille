import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

/** Retourne la playlist active pour cet écran selon le planning (timezone du site). */
export const GET: RequestHandler = async (event) => {
	const screenId = await requirePlayerAuth(event);
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
	const dayOfWeek = now.getUTCDay(); // 0 = dimanche
	const timezone = screen.site?.timezone || 'Europe/Paris';

	// Début et fin du jour en UTC pour les comparaisons (date de fin = journée entière incluse)
	const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

	const where = {
		OR: [
			{ targetType: 'SCREEN' as const, targetId: screenId },
			...(screen.groupId ? [{ targetType: 'GROUP' as const, targetId: screen.groupId }] : [])
		],
		startDate: { lte: endOfTodayUTC },
		endDate: { gte: startOfTodayUTC }
	};
	console.log('[API schedule] requête schedules, where:', JSON.stringify(where, null, 2));

	const schedules = await prisma.schedule.findMany({
		where,
		include: { playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } },
		orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }]
	});

	console.log('[API schedule] plannings trouvés:', schedules.length, schedules.map((s) => ({ id: s.id, name: s.name, targetType: s.targetType, targetId: s.targetId, playlistId: s.playlistId, itemsCount: s.playlist?.items?.length })));

	// Prendre le premier schedule actif (filtre jour/heure optionnel plus tard avec date-fns-tz)
	let activeSchedule = schedules[0];
	if (activeSchedule?.playlist) {
		const playlist = activeSchedule.playlist;
		const rawUrl = (m: { cdnUrl?: string | null; url?: string | null }) =>
			(m.cdnUrl && m.cdnUrl.trim()) || (m.url && m.url.trim()) || '';
		const itemsBeforeFilter = playlist.items.length;
		const items = playlist.items
			.filter((i) => i.media && rawUrl(i.media))
			.map((i) => ({
				mediaId: i.mediaId,
				order: i.order,
				duration: i.duration ?? playlist.defaultDuration,
				type: i.media!.type,
				cdnUrl: rawUrl(i.media!),
				name: i.media!.name
			}));
		console.log('[API schedule] playlist', playlist.id, 'items avant filtre:', itemsBeforeFilter, 'après (avec URL):', items.length, items.map((i) => ({ name: i.name, type: i.type, url: i.cdnUrl?.slice(0, 60) })));
		return json({
			playlistId: playlist.id,
			version: playlist.version,
			defaultDuration: playlist.defaultDuration,
			transition: playlist.transition,
			items
		});
	}

	console.log('[API schedule] aucun planning actif ou playlist vide → items: []');
	return json({
		playlistId: null,
		version: 0,
		defaultDuration: 10,
		transition: 'FADE',
		items: [] as { mediaId: string; order: number; duration: number; type: string; cdnUrl: string; name: string }[]
	});
};

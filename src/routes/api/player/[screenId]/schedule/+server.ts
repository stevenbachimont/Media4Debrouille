import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

/** Retourne la playlist active pour cet écran selon le planning (timezone du site). */
export const GET: RequestHandler = async (event) => {
	const screenId = await requirePlayerAuth(event);

	const screen = await prisma.screen.findUnique({
		where: { id: screenId },
		include: { site: true }
	});
	if (!screen) return json({ error: 'Écran non trouvé' }, { status: 404 });

	const now = new Date();
	const dayOfWeek = now.getUTCDay(); // 0 = dimanche
	const timezone = screen.site?.timezone || 'Europe/Paris';

	// Plages horaires en HH:MM sont en heure locale du site — on compare en UTC en convertissant
	// Pour simplifier Phase 1 : on compare en UTC (startTime/endTime stockés en local, conversion à la lecture)
	const schedules = await prisma.schedule.findMany({
		where: {
			OR: [{ targetType: 'SCREEN', targetId: screenId }, { targetType: 'GROUP', targetId: screen.groupId ?? '' }],
			startDate: { lte: now },
			endDate: { gte: now }
		},
		include: { playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } },
		orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }]
	});

	// Filtrer par jour et créneau horaire (approximation : on prend le premier schedule actif)
	// Pour une logique précise timezone il faudrait date-fns-tz
	let activeSchedule = schedules[0];
	if (activeSchedule?.playlist) {
		const playlist = activeSchedule.playlist;
		const items = playlist.items
			.filter((i) => i.media && (i.media.cdnUrl || i.media.url))
			.map((i) => ({
				mediaId: i.mediaId,
				order: i.order,
				duration: i.duration ?? playlist.defaultDuration,
				type: i.media!.type,
				cdnUrl: i.media!.cdnUrl || i.media!.url,
				name: i.media!.name
			}));
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
};

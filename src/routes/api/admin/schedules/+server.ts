import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const schedules = await prisma.schedule.findMany({
		orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
		include: { playlist: true }
	});
	return json(schedules);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAdmin(event);
	const body = await event.request.json().catch(() => ({}));
	const {
		name,
		targetType,
		targetId,
		playlistId,
		priority,
		startDate,
		endDate,
		startTime,
		endTime,
		daysOfWeek,
		isRecurring,
		isInterruption
	} = body as Record<string, unknown>;

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Le nom est requis' }, { status: 400 });
	}
	if (targetType !== 'SCREEN' && targetType !== 'GROUP') {
		return json({ error: 'targetType doit être SCREEN ou GROUP' }, { status: 400 });
	}
	if (!targetId || typeof targetId !== 'string' || !targetId.trim()) {
		return json({ error: 'targetId est requis' }, { status: 400 });
	}
	if (!playlistId || typeof playlistId !== 'string' || !playlistId.trim()) {
		return json({ error: 'playlistId est requis' }, { status: 400 });
	}

	const playlist = await prisma.playlist.findUnique({ where: { id: (playlistId as string).trim() } });
	if (!playlist) return json({ error: 'Playlist non trouvée' }, { status: 400 });

	const prio = typeof priority === 'number' && priority >= 1 && priority <= 100 ? priority : 50;
	const start = startDate ? new Date(startDate as string) : new Date();
	let end = endDate ? new Date(endDate as string) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
	// Inclure la journée entière pour la date de fin : 23:59:59.999
	end.setUTCHours(23, 59, 59, 999);
	const st = typeof startTime === 'string' && /^\d{2}:\d{2}$/.test(startTime) ? startTime : '00:00';
	const et = typeof endTime === 'string' && /^\d{2}:\d{2}$/.test(endTime) ? endTime : '23:59';
	const days = Array.isArray(daysOfWeek)
		? daysOfWeek.filter((d) => typeof d === 'number' && d >= 0 && d <= 6)
		: [0, 1, 2, 3, 4, 5, 6];
	const daysJson = JSON.stringify(days.length ? days : [0, 1, 2, 3, 4, 5, 6]);

	const schedule = await prisma.schedule.create({
		data: {
			name: name.trim(),
			targetType: targetType as 'SCREEN' | 'GROUP',
			targetId: targetId.trim(),
			playlistId: playlist.id,
			priority: prio,
			startDate: start,
			endDate: end,
			startTime: st,
			endTime: et,
			daysOfWeek: daysJson,
			isRecurring: typeof isRecurring === 'boolean' ? isRecurring : true,
			isInterruption: typeof isInterruption === 'boolean' ? isInterruption : false,
			createdById: user.id
		},
		include: { playlist: true }
	});
	return json(schedule);
};

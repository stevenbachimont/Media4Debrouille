import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const schedule = await prisma.schedule.findUnique({
		where: { id },
		include: { playlist: true }
	});
	if (!schedule) return json({ error: 'Planning non trouvé' }, { status: 404 });
	return json(schedule);
};

export const PUT: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
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

	const existing = await prisma.schedule.findUnique({ where: { id } });
	if (!existing) return json({ error: 'Planning non trouvé' }, { status: 404 });

	const updates: Parameters<typeof prisma.schedule.update>[0]['data'] = {};
	if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : existing.name;
	if (targetType === 'SCREEN' || targetType === 'GROUP') updates.targetType = targetType;
	if (targetId !== undefined && typeof targetId === 'string') updates.targetId = targetId.trim();
	if (playlistId !== undefined && typeof playlistId === 'string') {
		const pl = await prisma.playlist.findUnique({ where: { id: playlistId.trim() } });
		if (pl) updates.playlistId = pl.id;
	}
	if (typeof priority === 'number' && priority >= 1 && priority <= 100) updates.priority = priority;
	if (startDate !== undefined) updates.startDate = new Date(startDate as string);
	if (endDate !== undefined) {
		const end = new Date(endDate as string);
		end.setUTCHours(23, 59, 59, 999);
		updates.endDate = end;
	}
	if (typeof startTime === 'string' && /^\d{2}:\d{2}$/.test(startTime)) updates.startTime = startTime;
	if (typeof endTime === 'string' && /^\d{2}:\d{2}$/.test(endTime)) updates.endTime = endTime;
	if (Array.isArray(daysOfWeek)) {
		const days = daysOfWeek.filter((d) => typeof d === 'number' && d >= 0 && d <= 6);
		updates.daysOfWeek = JSON.stringify(days.length ? days : [0, 1, 2, 3, 4, 5, 6]);
	}
	if (typeof isRecurring === 'boolean') updates.isRecurring = isRecurring;
	if (typeof isInterruption === 'boolean') updates.isInterruption = isInterruption;

	const schedule = await prisma.schedule.update({
		where: { id },
		data: updates,
		include: { playlist: true }
	});
	return json(schedule);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	await prisma.schedule.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

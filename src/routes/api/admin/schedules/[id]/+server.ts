import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const schedule = await prisma.schedule.findUnique({
		where: { id },
		include: {
			playlist: {
				include: {
					items: { include: { media: true }, orderBy: { order: 'asc' } }
				}
			}
		}
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
		priority,
		startDate,
		endDate,
		startTime,
		endTime,
		daysOfWeek,
		isRecurring,
		isInterruption,
		items
	} = body as Record<string, unknown>;

	const existing = await prisma.schedule.findUnique({
		where: { id },
		include: { playlist: true }
	});
	if (!existing) return json({ error: 'Planning non trouvé' }, { status: 404 });

	const updates: Parameters<typeof prisma.schedule.update>[0]['data'] = {};
	if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : existing.name;
	if (targetType === 'SCREEN' || targetType === 'GROUP') updates.targetType = targetType;
	if (targetId !== undefined && typeof targetId === 'string') updates.targetId = targetId.trim();
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

	await prisma.$transaction(async (tx) => {
		await tx.schedule.update({
			where: { id },
			data: updates
		});
		if (Array.isArray(items) && existing.playlistId) {
			await tx.playlistItem.deleteMany({ where: { playlistId: existing.playlistId } });
			for (let i = 0; i < items.length; i++) {
				const it = items[i] as { mediaId?: string; duration?: number };
				if (it?.mediaId) {
					await tx.playlistItem.create({
						data: {
							playlistId: existing.playlistId,
							mediaId: it.mediaId,
							zoneId: 'main',
							order: i,
							duration: typeof it.duration === 'number' && it.duration > 0 ? it.duration : null
						}
					});
				}
			}
			await tx.playlist.update({
				where: { id: existing.playlistId },
				data: { version: (existing.playlist?.version ?? 1) + 1 }
			});
		}
	});

	const schedule = await prisma.schedule.findUnique({
		where: { id },
		include: {
			playlist: {
				include: {
					items: { include: { media: true }, orderBy: { order: 'asc' } }
				}
			}
		}
	});
	return json(schedule!);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	await prisma.schedule.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

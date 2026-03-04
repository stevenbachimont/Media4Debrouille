import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const schedules = await prisma.schedule.findMany({
		orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
		include: {
			playlist: {
				select: { id: true, name: true, _count: { select: { items: true } } }
			}
		}
	});
	return json(schedules);
};

export const POST: RequestHandler = async (event) => {
	try {
		const user = requireAdmin(event);
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
			items,
			defaultDuration
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

		const prio = typeof priority === 'number' && priority >= 1 && priority <= 100 ? priority : 50;
		const start = startDate ? new Date(startDate as string) : new Date();
		let end = endDate ? new Date(endDate as string) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
		end.setUTCHours(23, 59, 59, 999);
		const st = typeof startTime === 'string' && /^\d{2}:\d{2}$/.test(startTime) ? startTime : '00:00';
		const et = typeof endTime === 'string' && /^\d{2}:\d{2}$/.test(endTime) ? endTime : '23:59';
		const days = Array.isArray(daysOfWeek)
			? daysOfWeek.filter((d) => typeof d === 'number' && d >= 0 && d <= 6)
			: [0, 1, 2, 3, 4, 5, 6];
		const daysJson = JSON.stringify(days.length ? days : [0, 1, 2, 3, 4, 5, 6]);
		const defDuration = typeof defaultDuration === 'number' && defaultDuration > 0 ? defaultDuration : 10;

		const schedule = await prisma.$transaction(async (tx) => {
			const playlist = await tx.playlist.create({
				data: {
					name: (name as string).trim(),
					description: null,
					defaultDuration: defDuration,
					transition: 'FADE',
					createdById: user.id
				}
			});

			if (Array.isArray(items)) {
				for (let i = 0; i < items.length; i++) {
					const it = items[i] as { mediaId?: string; duration?: number };
					if (it?.mediaId) {
						await tx.playlistItem.create({
							data: {
								playlistId: playlist.id,
								mediaId: it.mediaId,
								zoneId: 'main',
								order: i,
								duration: typeof it.duration === 'number' && it.duration > 0 ? it.duration : null
							}
						});
					}
				}
			}

			return tx.schedule.create({
				data: {
					name: (name as string).trim(),
					targetType: targetType as 'SCREEN' | 'GROUP',
					targetId: (targetId as string).trim(),
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
				include: {
					playlist: {
						include: {
							items: { include: { media: true }, orderBy: { order: 'asc' } }
						}
					}
				}
			});
		});
		return json(schedule);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && typeof (err as { status: number }).status === 'number') {
			throw err;
		}
		console.error('[API POST /schedules]', err);
		const message = err instanceof Error ? err.message : String(err);
		return json({ error: message }, { status: 500 });
	}
};

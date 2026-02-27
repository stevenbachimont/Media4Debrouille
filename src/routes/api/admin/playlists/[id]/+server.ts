import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const playlist = await prisma.playlist.findUnique({
		where: { id },
		include: {
			template: true,
			items: { include: { media: true }, orderBy: { order: 'asc' } }
		}
	});
	if (!playlist) return json({ error: 'Playlist non trouvée' }, { status: 404 });
	return json(playlist);
};

export const PUT: RequestHandler = async (event) => {
	const user = requireAdmin(event);
	const { id } = event.params;
	const body = await event.request.json().catch(() => ({}));
	const { name, description, defaultDuration, transition, items } = body as Record<string, unknown>;

	const existing = await prisma.playlist.findUnique({ where: { id }, include: { items: true } });
	if (!existing) return json({ error: 'Playlist non trouvée' }, { status: 404 });

	const updates: { name?: string; description?: string | null; defaultDuration?: number; transition?: string; version?: number } = {};
	if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : existing.name;
	if (description !== undefined) updates.description = typeof description === 'string' ? description.trim() || null : null;
	if (typeof defaultDuration === 'number' && defaultDuration > 0) updates.defaultDuration = defaultDuration;
	if (transition === 'SLIDE' || transition === 'NONE') updates.transition = transition;
	updates.version = existing.version + 1;

	await prisma.$transaction(async (tx) => {
		await tx.playlist.update({
			where: { id },
			data: updates
		});
		if (Array.isArray(items)) {
			await tx.playlistItem.deleteMany({ where: { playlistId: id } });
			const zoneId = 'main'; // Phase 1: une seule zone
			for (let i = 0; i < items.length; i++) {
				const it = items[i] as { mediaId?: string; duration?: number };
				if (it?.mediaId) {
					await tx.playlistItem.create({
						data: {
							playlistId: id,
							mediaId: it.mediaId,
							zoneId,
							order: i,
							duration: typeof it.duration === 'number' && it.duration > 0 ? it.duration : null
						}
					});
				}
			}
		}
	});

	const playlist = await prisma.playlist.findUnique({
		where: { id },
		include: { template: true, items: { include: { media: true }, orderBy: { order: 'asc' } } }
	});
	return json(playlist!);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	await prisma.playlist.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

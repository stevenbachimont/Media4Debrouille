import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	await requirePlayerAuth(event);
	const { screenId, id: playlistId } = event.params;

	const playlist = await prisma.playlist.findFirst({
		where: { id: playlistId },
		include: { items: { include: { media: true }, orderBy: { order: 'asc' } } }
	});
	if (!playlist) return json({ error: 'Playlist non trouvée' }, { status: 404 });

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
		id: playlist.id,
		version: playlist.version,
		defaultDuration: playlist.defaultDuration,
		transition: playlist.transition,
		items
	});
};

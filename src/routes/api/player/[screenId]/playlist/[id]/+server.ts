import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	const authResult = await requirePlayerAuth(event);
	if (authResult instanceof Response) return authResult;
	const { id: playlistId } = event.params;

	const playlist = await prisma.playlist.findFirst({
		where: { id: playlistId },
		include: { items: { include: { media: true }, orderBy: { order: 'asc' } } }
	});
	if (!playlist) return json({ error: 'Playlist non trouvée' }, { status: 404 });

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
			return {
				mediaId: i.mediaId,
				order: i.order,
				duration: i.duration ?? playlist.defaultDuration,
				type: i.media!.type,
				cdnUrl: url.startsWith('/') ? `${event.url.origin}${url}` : url,
				name: i.media!.name
			};
		});

	return json({
		id: playlist.id,
		version: playlist.version,
		defaultDuration: playlist.defaultDuration,
		transition: playlist.transition,
		items
	});
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const playlists = await prisma.playlist.findMany({
		orderBy: { name: 'asc' },
		include: { template: true, _count: { select: { items: true } } }
	});
	return json(playlists);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAdmin(event);
	const body = await event.request.json().catch(() => ({}));
	const { name, description, templateId, defaultDuration, transition } = body as Record<string, unknown>;

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Le nom est requis' }, { status: 400 });
	}
	// Plus de template : playlist = liste ordonnée de médias
	const duration = typeof defaultDuration === 'number' && defaultDuration > 0 ? defaultDuration : 10;
	const trans = transition === 'SLIDE' || transition === 'NONE' ? transition : 'FADE';

	const playlist = await prisma.playlist.create({
		data: {
			name: name.trim(),
			description: typeof description === 'string' ? description.trim() || null : null,
			defaultDuration: duration,
			transition: trans,
			createdById: user.id
		},
		include: { template: true }
	});
	return json(playlist);
};

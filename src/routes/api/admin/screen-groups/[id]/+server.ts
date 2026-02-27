import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	const group = await prisma.screenGroup.findUnique({
		where: { id },
		include: { site: true, _count: { select: { screens: true } } }
	});
	if (!group) return json({ error: 'Groupe non trouvé' }, { status: 404 });
	return json(group);
};

export const PUT: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	const body = await event.request.json();
	const { name, description } = body as Record<string, string>;
	const group = await prisma.screenGroup.update({
		where: { id },
		data: {
			...(name !== undefined && { name: name?.trim() ?? '' }),
			...(description !== undefined && { description: description?.trim() || null })
		}
	});
	return json(group);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	await prisma.screenGroup.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

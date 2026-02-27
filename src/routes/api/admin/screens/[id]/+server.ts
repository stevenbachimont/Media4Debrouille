import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdminOnly } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdminOnly(event);
	const id = event.params.id;
	const screen = await prisma.screen.findUnique({
		where: { id },
		include: { site: true, group: true }
	});
	if (!screen) return json({ error: 'Écran non trouvé' }, { status: 404 });
	return json(screen);
};

export const PUT: RequestHandler = async (event) => {
	requireAdminOnly(event);
	const id = event.params.id;
	const body = await event.request.json();
	const { name, description, groupId } = body as Record<string, string>;
	const screen = await prisma.screen.update({
		where: { id },
		data: {
			...(name !== undefined && { name: name?.trim() ?? '' }),
			...(description !== undefined && { description: description?.trim() ?? null }),
			...(groupId !== undefined && { groupId: groupId?.trim() || null })
		},
		include: { site: true, group: true }
	});
	return json(screen);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdminOnly(event);
	const id = event.params.id;
	await prisma.screen.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

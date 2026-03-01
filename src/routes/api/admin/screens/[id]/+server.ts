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
	const { name, description, groupId, playerJWTBlacklisted } = body as Record<string, unknown>;
	const screen = await prisma.screen.update({
		where: { id },
		data: {
			...(name !== undefined && { name: (name as string)?.trim() ?? '' }),
			...(description !== undefined && { description: (description as string)?.trim() ?? null }),
			...(groupId !== undefined && { groupId: (groupId as string)?.trim() || null }),
			...(typeof playerJWTBlacklisted === 'boolean' && { playerJWTBlacklisted })
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

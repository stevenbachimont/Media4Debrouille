import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdminOnly } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const siteId = event.url.searchParams.get('siteId');
	const groupId = event.url.searchParams.get('groupId');
	const screens = await prisma.screen.findMany({
		where: {
			...(siteId && { siteId }),
			...(groupId && { groupId })
		},
		orderBy: { name: 'asc' },
		include: { site: true, group: true }
	});
	return json(screens);
};

export const POST: RequestHandler = async (event) => {
	requireAdminOnly(event);
	const body = await event.request.json();
	const { siteId, groupId, name, description } = body as Record<string, string>;
	if (!siteId || !name?.trim()) {
		return json({ error: 'siteId et name sont requis' }, { status: 400 });
	}
	const screen = await prisma.screen.create({
		data: {
			siteId,
			groupId: groupId?.trim() || null,
			name: name.trim(),
			description: description?.trim() ?? null
		},
		include: { site: true, group: true }
	});
	return json(screen);
};

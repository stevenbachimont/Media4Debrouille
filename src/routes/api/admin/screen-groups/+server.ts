import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const siteId = event.url.searchParams.get('siteId');
	const groups = siteId
		? await prisma.screenGroup.findMany({ where: { siteId }, orderBy: { name: 'asc' } })
		: await prisma.screenGroup.findMany({ orderBy: { name: 'asc' }, include: { site: true } });
	return json(groups);
};

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);
	const body = await event.request.json();
	const { siteId, name, description } = body as Record<string, string>;
	if (!siteId || !name?.trim()) {
		return json({ error: 'siteId et name sont requis' }, { status: 400 });
	}
	const group = await prisma.screenGroup.create({
		data: {
			siteId,
			name: name.trim(),
			description: description?.trim() ?? null
		}
	});
	return json(group);
};

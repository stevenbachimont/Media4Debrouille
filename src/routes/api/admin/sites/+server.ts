import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const sites = await prisma.site.findMany({
		orderBy: { name: 'asc' },
		include: {
			_count: { select: { screens: true, screenGroups: true } }
		}
	});
	return json(sites);
};

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);
	const body = await event.request.json();
	const { name, city, address, timezone, contactName, contactEmail } = body as Record<string, string>;
	if (!name?.trim()) {
		return json({ error: 'Le nom est requis' }, { status: 400 });
	}
	const site = await prisma.site.create({
		data: {
			name: name.trim(),
			city: city?.trim() ?? null,
			address: address?.trim() ?? null,
			timezone: timezone?.trim() || 'Europe/Paris',
			contactName: contactName?.trim() ?? null,
			contactEmail: contactEmail?.trim() ?? null
		}
	});
	return json(site);
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	const site = await prisma.site.findUnique({
		where: { id },
		include: {
			screenGroups: true,
			screens: { include: { group: true } }
		}
	});
	if (!site) return json({ error: 'Site non trouvé' }, { status: 404 });
	return json(site);
};

export const PUT: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	const body = await event.request.json();
	const { name, city, address, timezone, contactName, contactEmail } = body as Record<string, string>;
	const site = await prisma.site.update({
		where: { id },
		data: {
			...(name !== undefined && { name: name?.trim() ?? '' }),
			...(city !== undefined && { city: city?.trim() || null }),
			...(address !== undefined && { address: address?.trim() || null }),
			...(timezone !== undefined && { timezone: timezone?.trim() || 'Europe/Paris' }),
			...(contactName !== undefined && { contactName: contactName?.trim() || null }),
			...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null })
		}
	});
	return json(site);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const id = event.params.id;
	await prisma.site.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

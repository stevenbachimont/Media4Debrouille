import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const template = await prisma.template.findUnique({
		where: { id }
	});
	if (!template) return json({ error: 'Template non trouvé' }, { status: 404 });
	return json(template);
};

export const PUT: RequestHandler = async (event) => {
	const user = requireAdmin(event);
	const { id } = event.params;
	const body = await event.request.json().catch(() => ({}));
	const { name, description, zonesJson } = body as Record<string, unknown>;

	const existing = await prisma.template.findUnique({ where: { id } });
	if (!existing) return json({ error: 'Template non trouvé' }, { status: 404 });

	const updates: { name?: string; description?: string | null; zonesJson?: string } = {};
	if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : existing.name;
	if (description !== undefined) updates.description = typeof description === 'string' ? description.trim() || null : existing.description;
	if (zonesJson !== undefined && typeof zonesJson === 'string' && zonesJson.trim()) updates.zonesJson = zonesJson.trim();

	const template = await prisma.template.update({
		where: { id },
		data: updates
	});
	return json(template);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	await prisma.template.delete({ where: { id } });
	return new Response(null, { status: 204 });
};

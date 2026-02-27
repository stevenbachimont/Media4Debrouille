import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

const DEFAULT_ZONES_JSON = JSON.stringify([
	{
		id: 'main',
		name: 'Contenu',
		type: 'CONTENT',
		x: 0,
		y: 0,
		width: 100,
		height: 100,
		zIndex: 0,
		backgroundColor: '#000000',
		padding: 0,
		styleJson: {}
	}
]);

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const templates = await prisma.template.findMany({
		orderBy: { name: 'asc' }
	});
	return json(templates);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAdmin(event);
	const body = await event.request.json().catch(() => ({}));
	const { name, description, zonesJson } = body as Record<string, unknown>;

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Le nom est requis' }, { status: 400 });
	}

	const template = await prisma.template.create({
		data: {
			name: name.trim(),
			description: typeof description === 'string' ? description.trim() || null : null,
			zonesJson: typeof zonesJson === 'string' && zonesJson.trim() ? zonesJson.trim() : DEFAULT_ZONES_JSON,
			createdById: user.id
		}
	});
	return json(template);
};

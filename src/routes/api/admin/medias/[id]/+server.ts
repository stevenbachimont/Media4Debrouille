import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const media = await prisma.media.findUnique({
		where: { id }
	});
	if (!media) return json({ error: 'Média non trouvé' }, { status: 404 });
	return json(media);
};

export const PUT: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const body = await event.request.json().catch(() => ({}));
	const {
		name,
		type,
		url,
		cdnUrl,
		duration,
		tags,
		validFrom,
		validUntil
	} = body as Record<string, unknown>;

	const existing = await prisma.media.findUnique({ where: { id } });
	if (!existing) return json({ error: 'Média non trouvé' }, { status: 404 });

	const updates: Record<string, unknown> = {};
	if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : existing.name;
	if (type !== undefined) {
		const allowedTypes = ['IMAGE', 'VIDEO', 'HTML', 'PDF', 'WEBPAGE', 'RSS', 'DATASET'];
		if (allowedTypes.includes(type as string)) updates.type = type;
	}
	if (url !== undefined) updates.url = typeof url === 'string' ? url.trim() || null : existing.url;
	if (cdnUrl !== undefined) updates.cdnUrl = typeof cdnUrl === 'string' ? cdnUrl.trim() || null : existing.cdnUrl;
	if (duration !== undefined) updates.duration = typeof duration === 'number' && duration > 0 ? duration : null;
	if (tags !== undefined) updates.tags = typeof tags === 'string' ? tags : null;
	if (validFrom !== undefined) updates.validFrom = validFrom ? new Date(validFrom as string) : null;
	if (validUntil !== undefined) updates.validUntil = validUntil ? new Date(validUntil as string) : null;

	const media = await prisma.media.update({
		where: { id },
		data: updates as Parameters<typeof prisma.media.update>[0]['data']
	});
	return json(media);
};

export const DELETE: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	await prisma.media.delete({ where: { id } }).catch(() => null);
	return new Response(null, { status: 204 });
};

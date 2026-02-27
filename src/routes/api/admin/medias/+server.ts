import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const medias = await prisma.media.findMany({
		orderBy: { createdAt: 'desc' }
	});
	return json(medias);
};

export const POST: RequestHandler = async (event) => {
	const user = requireAdmin(event);
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

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Le nom est requis' }, { status: 400 });
	}
	const typeVal = type as string;
	const allowedTypes = ['IMAGE', 'VIDEO', 'HTML', 'PDF', 'WEBPAGE', 'RSS', 'DATASET'];
	if (!typeVal || !allowedTypes.includes(typeVal)) {
		return json({ error: 'Type invalide (IMAGE, VIDEO, HTML, PDF, WEBPAGE, RSS, DATASET)' }, { status: 400 });
	}

	const urlStr = (url ?? cdnUrl ?? '') as string;
	const cdnUrlStr = (cdnUrl ?? url ?? '') as string;
	// Au moins une URL pour les types qui en ont besoin
	if (['WEBPAGE', 'RSS', 'HTML'].includes(typeVal) && !urlStr.trim() && !cdnUrlStr.trim()) {
		return json({ error: "L'URL est requise pour ce type de média" }, { status: 400 });
	}

	const media = await prisma.media.create({
		data: {
			name: name.trim(),
			type: typeVal as 'IMAGE' | 'VIDEO' | 'HTML' | 'PDF' | 'WEBPAGE' | 'RSS' | 'DATASET',
			url: urlStr?.trim() || null,
			cdnUrl: cdnUrlStr?.trim() || urlStr?.trim() || null,
			duration: typeof duration === 'number' && duration > 0 ? duration : null,
			tags: typeof tags === 'string' ? tags : null,
			validFrom: validFrom ? new Date(validFrom as string) : null,
			validUntil: validUntil ? new Date(validUntil as string) : null,
			createdById: user.id
		}
	});
	return json(media);
};

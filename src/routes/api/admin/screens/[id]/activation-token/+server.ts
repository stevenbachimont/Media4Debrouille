import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdminOnly } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';
import { randomUUID } from 'node:crypto';

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export const POST: RequestHandler = async (event) => {
	requireAdminOnly(event);
	const id = event.params.id;
	const screen = await prisma.screen.findUnique({ where: { id } });
	if (!screen) return json({ error: 'Écran non trouvé' }, { status: 404 });

	const token = randomUUID();
	const expiresAt = new Date(Date.now() + TTL_MS);

	await prisma.screen.update({
		where: { id },
		data: {
			activationToken: token,
			activationTokenExpiresAt: expiresAt
		}
	});

	const origin = event.url.origin;
	const activationUrl = `${origin}/player/activate?token=${token}`;

	return json({
		token,
		expiresAt: expiresAt.toISOString(),
		activationUrl
	});
};

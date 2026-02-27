import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db';
import { signPlayerJWT } from '$lib/server/player-jwt';

export const POST: RequestHandler = async (event) => {
	let body: { token?: string };
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Body JSON invalide' }, { status: 400 });
	}
	const token = body.token?.trim();
	if (!token) return json({ error: 'token requis' }, { status: 400 });

	const screen = await prisma.screen.findFirst({
		where: {
			activationToken: token,
			activationTokenExpiresAt: { gt: new Date() }
		}
	});

	if (!screen) {
		return json({ error: 'Token invalide ou expiré' }, { status: 400 });
	}

	const jwt = await signPlayerJWT(screen.id);

	await prisma.screen.update({
		where: { id: screen.id },
		data: {
			activationToken: null,
			activationTokenExpiresAt: null
		}
	});

	return json({ jwt, screenId: screen.id });
};

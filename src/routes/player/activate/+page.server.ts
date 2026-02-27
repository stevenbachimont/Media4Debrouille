import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { signPlayerJWT } from '$lib/server/player-jwt';

export const load: PageServerLoad = async (event) => {
	const token = event.url.searchParams.get('token')?.trim();
	if (!token) return { success: false as const, error: 'Token manquant' };

	const screen = await prisma.screen.findFirst({
		where: {
			activationToken: token,
			activationTokenExpiresAt: { gt: new Date() }
		}
	});

	if (!screen) {
		return { success: false as const, error: 'Token invalide ou expiré' };
	}

	const jwt = await signPlayerJWT(screen.id);

	await prisma.screen.update({
		where: { id: screen.id },
		data: {
			activationToken: null,
			activationTokenExpiresAt: null
		}
	});

	return { success: true as const, jwt, screenId: screen.id };
};

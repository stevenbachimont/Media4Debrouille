import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { prisma } from '$lib/server/db';

const TTL_MS = 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user || event.locals.user.role !== 'ADMIN') {
		throw redirect(302, '/admin/login');
	}
	const id = event.params.id;
	const screen = await prisma.screen.findUnique({ where: { id } });
	if (!screen) return { screen: null, activationUrl: null, qrDataUrl: null };

	// Générer un nouveau token à chaque affichage (ou réutiliser si valide > 1h)
	const now = Date.now();
	const reuseToken =
		screen.activationToken &&
		screen.activationTokenExpiresAt &&
		screen.activationTokenExpiresAt.getTime() - now > 60 * 60 * 1000;

	let token: string;
	if (reuseToken && screen.activationToken && screen.activationTokenExpiresAt) {
		token = screen.activationToken;
	} else {
		token = randomUUID();
		await prisma.screen.update({
			where: { id },
			data: {
				activationToken: token,
				activationTokenExpiresAt: new Date(now + TTL_MS)
			}
		});
	}

	const origin = event.url.origin;
	const activationUrl = `${origin}/player/activate?token=${token}`;
	const qrDataUrl = await QRCode.toDataURL(activationUrl, { margin: 2 });

	return { screen, activationUrl, qrDataUrl };
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { consumeReloadRequested } from '$lib/server/reload-request-store';

/** Le player poll cette route pour savoir s’il doit recharger (commande RELOAD envoyée sans Socket.io). */
export const GET: RequestHandler = async (event) => {
	const screenId = await requirePlayerAuth(event);
	const reload = consumeReloadRequested(screenId);
	return json({ reload });
};

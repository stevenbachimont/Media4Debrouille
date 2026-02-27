import type { RequestEvent } from '@sveltejs/kit';
import { verifyPlayerJWT } from '$lib/server/player-jwt';

export async function requirePlayerAuth(event: RequestEvent): Promise<string> {
	const auth = event.request.headers.get('Authorization');
	const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
	if (!token) {
		throw new Response(JSON.stringify({ error: 'Token manquant' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	let screenId: string;
	try {
		const payload = await verifyPlayerJWT(token);
		screenId = payload.sub;
	} catch {
		throw new Response(JSON.stringify({ error: 'Token invalide' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const paramScreenId = event.params.screenId;
	if (paramScreenId && paramScreenId !== screenId) {
		throw new Response(JSON.stringify({ error: 'Accès refusé à cet écran' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return screenId;
}

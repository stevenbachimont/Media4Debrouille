import type { RequestEvent } from '@sveltejs/kit';
import { verifyPlayerJWT } from '$lib/server/player-jwt';
import { prisma } from '$lib/server/db';

/** Retourne le screenId ou une Response d’erreur (401/403/503). Ne pas throw Response en API route (SvelteKit le convertit en Error "{}"). */
export async function requirePlayerAuth(event: RequestEvent): Promise<string | Response> {
	const auth = event.request.headers.get('Authorization');
	const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
	if (!token) {
		return new Response(JSON.stringify({ error: 'Token manquant' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	let screenId: string;
	try {
		const payload = await verifyPlayerJWT(token);
		screenId = payload.sub;
	} catch (e) {
		console.error('[requirePlayerAuth] JWT verify error:', e);
		return new Response(JSON.stringify({ error: 'Token invalide' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const pathname = event.url.pathname;
	const match = /^\/api\/player\/([^/]+)/.exec(pathname);
	const paramScreenId = match ? match[1] : event.params?.screenId;
	if (paramScreenId && paramScreenId !== screenId) {
		return new Response(JSON.stringify({ error: 'Accès refusé à cet écran' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	let screen: { playerJWTBlacklisted: boolean } | null;
	try {
		screen = await prisma.screen.findUnique({
			where: { id: screenId },
			select: { playerJWTBlacklisted: true }
		});
	} catch (e) {
		console.error('[requirePlayerAuth] prisma error:', e);
		return new Response(
			JSON.stringify({
				error: 'Erreur base de données',
				detail: e instanceof Error ? e.message : String(e)
			}),
			{ status: 503, headers: { 'Content-Type': 'application/json' } }
		);
	}
	if (!screen || screen.playerJWTBlacklisted) {
		return new Response(JSON.stringify({ error: 'Token révoqué ou écran inexistant' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return screenId;
}

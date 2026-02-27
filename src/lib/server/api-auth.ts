import type { RequestEvent } from '@sveltejs/kit';

export function requireAdmin(event: RequestEvent): NonNullable<App.Locals['user']> {
	const user = event.locals.user;
	if (!user) {
		throw new Response(JSON.stringify({ error: 'Non authentifié' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
		throw new Response(JSON.stringify({ error: 'Droits insuffisants' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return user;
}

/** Réservé aux ADMIN (écrans, commandes, users). */
export function requireAdminOnly(event: RequestEvent): NonNullable<App.Locals['user']> {
	const user = event.locals.user;
	if (!user) {
		throw new Response(JSON.stringify({ error: 'Non authentifié' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	if (user.role !== 'ADMIN') {
		throw new Response(JSON.stringify({ error: 'Réservé aux administrateurs' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return user;
}

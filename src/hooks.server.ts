import { lucia } from '$lib/server/auth';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	try {
		const { session, user } = await lucia.validateSession(sessionId);
		if (session?.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		event.locals.user = user;
		event.locals.session = session;
	} catch (e) {
		console.error('[auth] validateSession error:', e);
		event.locals.user = null;
		event.locals.session = null;
	}
	return resolve(event);
};

export const handleError: HandleServerError = async ({ error }) => {
	console.error('[SvelteKit server error]', error);
	if (error && typeof error === 'object' && 'stack' in error) console.error((error as Error).stack);
	const message = error instanceof Error ? error.message : String(error ?? 'Erreur serveur');
	// Si le message est "{}", l’erreur vient peut‑être d’un objet stringifié : renvoyer plus d’infos
	if (message === '{}' && error && typeof error === 'object') {
		const detail = Object.keys(error).length ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : (error as Error).stack ?? String(error);
		console.error('[handleError] detail:', detail);
		return { message: 'Erreur serveur (voir console)', detail };
	}
	return { message };
};

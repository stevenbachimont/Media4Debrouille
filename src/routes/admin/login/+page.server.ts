import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { lucia } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/auth';
import { prisma } from '$lib/server/db';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { message: 'Email et mot de passe requis.' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return fail(400, { message: 'Email ou mot de passe incorrect.' });
		}

		const valid = await verifyPassword(user.passwordHash, password);
		if (!valid) {
			return fail(400, { message: 'Email ou mot de passe incorrect.' });
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/admin');
	}
};

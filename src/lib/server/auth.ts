import { Lucia, Scrypt } from 'lucia';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';
import { prisma } from './db';

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev,
			sameSite: 'lax',
			path: '/'
		}
	},
	getUserAttributes: (attributes) => ({
		email: attributes.email,
		role: attributes.role
	})
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: {
			email: string;
			role: 'ADMIN' | 'EDITOR' | 'VIEWER';
		};
	}
}

export type AuthUser = {
	id: string;
	email: string;
	role: 'ADMIN' | 'EDITOR' | 'VIEWER';
};

const scrypt = new Scrypt();

export async function hashPassword(password: string): Promise<string> {
	return scrypt.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return scrypt.verify(hash, password);
}

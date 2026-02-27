import { SignJWT, jwtVerify } from 'jose';

const PLAYER_JWT_SECRET = process.env.PLAYER_JWT_SECRET || 'dev-secret-change-in-prod-min-32-chars';

export async function signPlayerJWT(screenId: string): Promise<string> {
	const key = new TextEncoder().encode(PLAYER_JWT_SECRET);
	return new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(screenId)
		.setIssuedAt()
		.sign(key);
}

export async function verifyPlayerJWT(token: string): Promise<{ sub: string }> {
	const key = new TextEncoder().encode(PLAYER_JWT_SECRET);
	const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
	if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Invalid JWT');
	return { sub: payload.sub };
}

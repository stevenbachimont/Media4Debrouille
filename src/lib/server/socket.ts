import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { jwtVerify } from 'jose';

const PLAYER_JWT_SECRET = process.env.PLAYER_JWT_SECRET || 'dev-secret-change-in-prod-min-32-chars';

async function verifyPlayerJWT(token: string): Promise<{ sub: string }> {
	const key = new TextEncoder().encode(PLAYER_JWT_SECRET);
	const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
	if (!payload.sub || typeof payload.sub !== 'string') throw new Error('Invalid JWT');
	return { sub: payload.sub };
}

let io: Server | null = null;

export function createSocketServer(httpServer: HttpServer): Server {
	io = new Server(httpServer, {
		path: '/socket.io',
		cors: { origin: true }
	});

	io.use(async (socket, next) => {
		const token = socket.handshake.auth?.token;
		if (!token) return next(new Error('Unauthorized'));
		try {
			const payload = await verifyPlayerJWT(token);
			socket.data.screenId = payload.sub;
			socket.join(`screen:${payload.sub}`);
			next();
		} catch {
			next(new Error('Unauthorized'));
		}
	});

	return io;
}

export function getIO(): Server | null {
	return io;
}

import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { verifyPlayerJWT } from './player-jwt';
import { prisma } from './db';
import { setLastScreenshot } from './screenshot-store';

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

	io.on('connection', (socket) => {
		const screenId = socket.data.screenId as string;

		socket.on('screen:heartbeat', async (data: Record<string, unknown>) => {
			try {
				await prisma.screenHeartbeat.create({
					data: {
						screenId,
						currentPlaylistId: (data.currentPlaylistId as string) ?? null,
						currentMediaName: (data.currentMediaName as string) ?? null,
						uptime: typeof data.uptime === 'number' ? data.uptime : null,
						memoryUsageMb: typeof data.memoryUsageMb === 'number' ? data.memoryUsageMb : null,
						resolution: (data.resolution as string) ?? null,
						browserVersion: (data.browserVersion as string) ?? null,
						connectionType: (data.connectionType as string) ?? null,
						isVisible: typeof data.isVisible === 'boolean' ? data.isVisible : null,
						errorMessage: (data.errorMessage as string) ?? null
					}
				});
				await prisma.screen.update({
					where: { id: screenId },
					data: {
						lastSeen: new Date(),
						status: 'ONLINE',
						uptime: typeof data.uptime === 'number' ? data.uptime : undefined,
						currentPlaylistId: (data.currentPlaylistId as string) ?? undefined,
						currentMediaName: (data.currentMediaName as string) ?? undefined,
						resolution: (data.resolution as string) ?? undefined,
						playerVersion: (data.browserVersion as string) ?? undefined
					}
				});
				io?.to('admin').emit('admin:screen_status', {
					screenId,
					status: 'ONLINE',
					lastSeen: new Date(),
					...data
				});
			} catch (_e) {
				// ignore
			}
		});

		socket.on('screen:screenshot_response', async (data: { commandId?: string; imageBase64?: string; width?: number; height?: number }) => {
			if (data.imageBase64 && typeof data.width === 'number' && typeof data.height === 'number') {
				setLastScreenshot(screenId, data.imageBase64, data.width, data.height);
			}
			// TODO Phase 3: upload S3, save ScreenScreenshot, emit admin:screenshot_ready
			io?.to('admin').emit('admin:screenshot_ready', { screenId, ...data });
		});

		socket.on('screen:command_ack', (data: { commandId: string; status: string }) => {
			io?.to('admin').emit('admin:command_ack', { screenId, ...data });
		});
	});

	return io;
}

export function getIO(): Server | null {
	return io;
}

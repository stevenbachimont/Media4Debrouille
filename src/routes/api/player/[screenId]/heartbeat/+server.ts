import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requirePlayerAuth } from '$lib/server/player-auth';
import { prisma } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
	const screenId = await requirePlayerAuth(event);

	let body: Record<string, unknown>;
	try {
		body = await event.request.json();
	} catch {
		return json({ error: 'Body JSON invalide' }, { status: 400 });
	}

	const uptime = typeof body.uptime === 'number' ? body.uptime : undefined;
	const memoryUsageMb = typeof body.memoryUsageMb === 'number' ? body.memoryUsageMb : undefined;
	const currentPlaylistId = typeof body.currentPlaylistId === 'string' ? body.currentPlaylistId : undefined;
	const currentMediaName = typeof body.currentMediaName === 'string' ? body.currentMediaName : undefined;
	const resolution = typeof body.resolution === 'string' ? body.resolution : undefined;
	const browserVersion = typeof body.browserVersion === 'string' ? body.browserVersion : undefined;
	const connectionType = typeof body.connectionType === 'string' ? body.connectionType : undefined;
	const isVisible = typeof body.isVisible === 'boolean' ? body.isVisible : undefined;
	const errorMessage = typeof body.errorMessage === 'string' ? body.errorMessage : undefined;

	await prisma.screenHeartbeat.create({
		data: {
			screenId,
			currentPlaylistId: currentPlaylistId ?? null,
			currentMediaName: currentMediaName ?? null,
			uptime: uptime ?? null,
			memoryUsageMb: memoryUsageMb ?? null,
			resolution: resolution ?? null,
			browserVersion: browserVersion ?? null,
			connectionType: connectionType ?? null,
			isVisible: isVisible ?? null,
			errorMessage: errorMessage ?? null
		}
	});

	await prisma.screen.update({
		where: { id: screenId },
		data: {
			lastSeen: new Date(),
			status: 'ONLINE',
			uptime: uptime ?? undefined,
			currentPlaylistId: currentPlaylistId ?? undefined,
			currentMediaName: currentMediaName ?? undefined,
			resolution: resolution ?? undefined,
			playerVersion: browserVersion ?? undefined
		}
	});

	return new Response(null, { status: 204 });
};

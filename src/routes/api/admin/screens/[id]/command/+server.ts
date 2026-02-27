import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdminOnly } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';
import { getIO } from '$lib/server/socket';
import { setReloadRequested } from '$lib/server/reload-request-store';

const COMMANDS: Record<string, { event: string; payload?: (body: Record<string, unknown>) => unknown }> = {
	SCREENSHOT: {
		event: 'player:screenshot',
		payload: (body) => ({ commandId: body.commandId ?? null })
	},
	PLAYLIST_RELOAD: { event: 'playlist:reload', payload: () => ({}) },
	RELOAD: { event: 'player:refresh', payload: () => ({}) },
	CACHE_CLEAR: { event: 'cache:clear', payload: () => ({}) },
	RESTART_BROWSER: { event: 'player:restart_browser', payload: (b) => ({ commandId: b.commandId ?? null }) },
	REBOOT: { event: 'player:reboot', payload: (b) => ({ commandId: b.commandId ?? null }) }
};

export const POST: RequestHandler = async (event) => {
	const user = requireAdminOnly(event);
	const screenId = event.params.id;
	const body = await event.request.json().catch(() => ({}));
	const { command } = body as { command?: string };

	const allowed = Object.keys(COMMANDS);
	if (!command || !allowed.includes(command)) {
		return json(
			{ error: `Commande invalide. Valeurs : ${allowed.join(', ')}` },
			{ status: 400 }
		);
	}

	const screen = await prisma.screen.findUnique({ where: { id: screenId } });
	if (!screen) return json({ error: 'Écran non trouvé' }, { status: 404 });

	const commandId = command === 'SCREENSHOT' || command === 'RESTART_BROWSER' || command === 'REBOOT'
		? crypto.randomUUID()
		: null;

	await prisma.screenCommand.create({
		data: {
			screenId,
			command: command as 'SCREENSHOT' | 'RELOAD' | 'PLAYLIST_RELOAD' | 'CACHE_CLEAR' | 'RESTART_BROWSER' | 'REBOOT',
			payloadJson: commandId ? JSON.stringify({ commandId }) : null,
			sentById: user.id
		}
	});

	const def = COMMANDS[command];
	const payload = def.payload ? def.payload({ ...body, commandId }) : {};
	const io = getIO();
	if (io) {
		io.to(`screen:${screenId}`).emit(def.event, payload);
	}
	// Fallback sans Socket.io (ex. en dev) : le player poll reload-check
	if (command === 'RELOAD') {
		setReloadRequested(screenId);
	}

	return json({ ok: true, commandId: commandId ?? undefined });
};

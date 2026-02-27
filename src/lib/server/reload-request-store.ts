/**
 * Store en mémoire : demande de rechargement par screenId.
 * Utilisé quand l'admin envoie RELOAD sans Socket.io (ex. en dev).
 * Le player poll GET /api/player/[screenId]/reload-check et recharge si demandé.
 */
const reloadRequestedAt = new Map<string, number>();

export function setReloadRequested(screenId: string): void {
	reloadRequestedAt.set(screenId, Date.now());
}

export function consumeReloadRequested(screenId: string): boolean {
	const had = reloadRequestedAt.has(screenId);
	reloadRequestedAt.delete(screenId);
	return had;
}

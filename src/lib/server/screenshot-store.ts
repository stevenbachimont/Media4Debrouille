/**
 * Store en mémoire des dernières captures d'écran par screenId.
 * Utilisé par le socket (screen:screenshot_response) et par GET /api/admin/screens/[id]/last-screenshot.
 */
export type StoredScreenshot = {
	imageBase64: string;
	width: number;
	height: number;
	at: Date;
};

const store = new Map<string, StoredScreenshot>();

export function setLastScreenshot(
	screenId: string,
	imageBase64: string,
	width: number,
	height: number
): void {
	store.set(screenId, { imageBase64, width, height, at: new Date() });
}

export function getLastScreenshot(screenId: string): StoredScreenshot | null {
	return store.get(screenId) ?? null;
}

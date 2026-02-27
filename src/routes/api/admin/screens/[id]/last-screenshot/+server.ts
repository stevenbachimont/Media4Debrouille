import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { getLastScreenshot } from '$lib/server/screenshot-store';

export const GET: RequestHandler = async (event) => {
	requireAdmin(event);
	const screenId = event.params.id;
	const shot = getLastScreenshot(screenId);
	if (!shot) return json({ error: 'Aucune capture récente' }, { status: 404 });
	return json({
		imageBase64: shot.imageBase64,
		width: shot.width,
		height: shot.height,
		at: shot.at.toISOString()
	});
};

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [playlistsRes, templatesRes] = await Promise.all([
		fetch('/api/admin/playlists'),
		fetch('/api/admin/templates')
	]);
	const playlists = playlistsRes.ok ? await playlistsRes.json() : [];
	const templates = templatesRes.ok ? await templatesRes.json() : [];
	return { playlists, templates };
};

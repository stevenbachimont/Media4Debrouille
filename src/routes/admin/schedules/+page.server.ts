import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [schedulesRes, playlistsRes, sitesRes, groupsRes, screensRes] = await Promise.all([
		fetch('/api/admin/schedules'),
		fetch('/api/admin/playlists'),
		fetch('/api/admin/sites'),
		fetch('/api/admin/screen-groups'),
		fetch('/api/admin/screens')
	]);
	const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
	const playlists = playlistsRes.ok ? await playlistsRes.json() : [];
	const sites = sitesRes.ok ? await sitesRes.json() : [];
	const groups = groupsRes.ok ? await groupsRes.json() : [];
	const screens = screensRes.ok ? await screensRes.json() : [];
	return { schedules, playlists, sites, groups, screens };
};

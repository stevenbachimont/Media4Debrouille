import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const [schedulesRes, sitesRes, groupsRes, screensRes] = await Promise.all([
			fetch('/api/admin/schedules'),
			fetch('/api/admin/sites'),
			fetch('/api/admin/screen-groups'),
			fetch('/api/admin/screens')
		]);
		const schedules = schedulesRes.ok ? await schedulesRes.json() : [];
		const sites = sitesRes.ok ? await sitesRes.json() : [];
		const groups = groupsRes.ok ? await groupsRes.json() : [];
		const screens = screensRes.ok ? await screensRes.json() : [];
		return { schedules: Array.isArray(schedules) ? schedules : [], sites, groups, screens };
	} catch (e) {
		console.error('[schedules load]', e);
		return { schedules: [], sites: [], groups: [], screens: [] };
	}
};

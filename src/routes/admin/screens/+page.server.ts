import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [screensRes, sitesRes] = await Promise.all([
		fetch('/api/admin/screens'),
		fetch('/api/admin/sites')
	]);
	const screens = screensRes.ok ? await screensRes.json() : [];
	const sites = sitesRes.ok ? await sitesRes.json() : [];
	return { screens, sites };
};

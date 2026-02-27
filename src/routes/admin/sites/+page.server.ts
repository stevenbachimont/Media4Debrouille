import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/admin/sites');
	if (!res.ok) return { sites: [] };
	const sites = await res.json();
	return { sites };
};

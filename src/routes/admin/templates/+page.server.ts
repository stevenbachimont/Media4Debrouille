import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/admin/templates');
	const templates = res.ok ? await res.json() : [];
	return { templates };
};

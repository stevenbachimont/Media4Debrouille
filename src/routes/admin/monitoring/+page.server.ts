import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch('/api/admin/screens');
	const screens = res.ok ? await res.json() : [];
	return { screens };
};

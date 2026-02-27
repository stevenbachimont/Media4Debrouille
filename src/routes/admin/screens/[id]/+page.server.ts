import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/screens/${params.id}`);
	if (!res.ok) return { screen: null };
	const screen = await res.json();
	return { screen };
};

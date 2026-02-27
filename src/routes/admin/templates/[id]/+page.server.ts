import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/templates/${params.id}`);
	if (!res.ok) return { template: null };
	const template = await res.json();
	return { template };
};

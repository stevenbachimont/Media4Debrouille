import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/schedules/${params.id}`);
	if (!res.ok) return { schedule: null };
	const schedule = await res.json();
	return { schedule };
};

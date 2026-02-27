import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/medias/${params.id}`);
	if (!res.ok) return { media: null };
	const media = await res.json();
	return { media };
};

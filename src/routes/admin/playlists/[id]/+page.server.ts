import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/playlists/${params.id}`);
	if (!res.ok) return { playlist: null };
	const playlist = await res.json();
	return { playlist };
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Redirection : les playlists sont gérées dans le planning */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/schedules');
};

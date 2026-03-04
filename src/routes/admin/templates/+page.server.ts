import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Redirection : plus de templates, les playlists sont des listes de médias */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/playlists');
};

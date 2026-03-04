import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Plus de templates : redirection vers playlists */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/playlists');
};

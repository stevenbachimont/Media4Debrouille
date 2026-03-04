import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Redirection : créer un planning (avec médias) à la place */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/schedules/new');
};

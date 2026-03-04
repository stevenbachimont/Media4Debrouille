import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Redirection : modifier un planning pour changer les médias */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/schedules');
};

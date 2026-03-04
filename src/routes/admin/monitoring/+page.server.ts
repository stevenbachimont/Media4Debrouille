import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Redirection : Monitoring fusionné avec Écrans */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/screens');
};

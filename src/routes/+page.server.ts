import { redirect } from '@sveltejs/kit';
import type { Load } from './$types';

export const load: Load = async ({ url }) => {
	if (url.pathname === '/') throw redirect(302, '/admin');
	return {};
};

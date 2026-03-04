import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** Plus de templates : redirection vers nouvelle playlist */
export const load: PageServerLoad = async () => {
	throw redirect(302, '/admin/playlists/new');
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim();
		if (!name) return fail(400, { message: 'Le nom est requis' });
		const res = await fetch('/api/admin/templates', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, description: description || null })
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		const template = await res.json();
		throw redirect(302, `/admin/templates/${template.id}`);
	}
};

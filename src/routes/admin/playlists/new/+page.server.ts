import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [templatesRes] = await Promise.all([fetch('/api/admin/templates')]);
	const templates = templatesRes.ok ? await templatesRes.json() : [];
	return { templates };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const templateId = (formData.get('templateId') as string)?.trim();
		const defaultDuration = parseInt((formData.get('defaultDuration') as string) || '10', 10);
		if (!name) return fail(400, { message: 'Le nom est requis' });
		if (!templateId) return fail(400, { message: 'Le template est requis' });
		const res = await fetch('/api/admin/playlists', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				templateId,
				defaultDuration: defaultDuration > 0 ? defaultDuration : 10,
				transition: 'FADE'
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		const playlist = await res.json();
		throw redirect(302, `/admin/playlists/${playlist.id}`);
	}
};

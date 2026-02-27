import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/medias/${params.id}`);
	if (!res.ok) return { media: null };
	const media = await res.json();
	return { media };
};

export const actions: Actions = {
	default: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const type = (formData.get('type') as string)?.trim();
		const url = (formData.get('url') as string)?.trim();
		const durationStr = (formData.get('duration') as string)?.trim();

		if (!name) return fail(400, { message: 'Le nom est requis' });

		const duration = durationStr ? parseInt(durationStr, 10) : undefined;
		const body = {
			name,
			type: type || 'IMAGE',
			url: url || undefined,
			cdnUrl: url || undefined,
			duration: duration && duration > 0 ? duration : undefined
		};

		const res = await fetch(`/api/admin/medias/${params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		throw redirect(302, `/admin/medias/${params.id}`);
	}
};

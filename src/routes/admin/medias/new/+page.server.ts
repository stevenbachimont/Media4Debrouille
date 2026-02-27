import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const type = (formData.get('type') as string)?.trim() || 'IMAGE';
		const url = (formData.get('url') as string)?.trim();
		const durationStr = (formData.get('duration') as string)?.trim();

		if (!name) return fail(400, { message: 'Le nom est requis' });

		const duration = durationStr ? parseInt(durationStr, 10) : undefined;
		const body: Record<string, unknown> = {
			name,
			type: type || 'IMAGE',
			url: url || undefined,
			cdnUrl: url || undefined,
			duration: duration && duration > 0 ? duration : undefined
		};

		const res = await fetch('/api/admin/medias', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur lors de la création' });
		}
		const media = await res.json();
		throw redirect(302, `/admin/medias/${media.id}`);
	}
};

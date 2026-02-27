import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/sites/${params.id}`);
	if (!res.ok) return { site: null };
	const site = await res.json();
	return { site };
};

export const actions: Actions = {
	default: async ({ request, params, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const city = (formData.get('city') as string)?.trim();
		const address = (formData.get('address') as string)?.trim();
		const timezone = (formData.get('timezone') as string)?.trim() || 'Europe/Paris';
		const contactName = (formData.get('contactName') as string)?.trim();
		const contactEmail = (formData.get('contactEmail') as string)?.trim();

		if (!name) return fail(400, { message: 'Le nom est requis' });

		const res = await fetch(`/api/admin/sites/${params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				city: city || null,
				address: address || null,
				timezone,
				contactName: contactName || null,
				contactEmail: contactEmail || null
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		throw redirect(302, `/admin/sites/${params.id}`);
	}
};

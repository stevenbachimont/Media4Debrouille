import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, fetch }) => {
	const res = await fetch(`/api/admin/screens/${params.id}`);
	if (!res.ok) return { screen: null, sites: [], groups: [] };
	const screen = await res.json();
	const [sitesRes, groupsRes] = await Promise.all([
		fetch('/api/admin/sites'),
		fetch(`/api/admin/screen-groups?siteId=${screen.siteId}`)
	]);
	const sites = sitesRes.ok ? await sitesRes.json() : [];
	const groups = groupsRes.ok ? await groupsRes.json() : [];
	return { screen, sites, groups };
};

export const actions: Actions = {
	default: async ({ request, params, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim();
		const groupId = (formData.get('groupId') as string)?.trim() || null;

		if (!name) return fail(400, { message: 'Le nom est requis' });

		const res = await fetch(`/api/admin/screens/${params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, description, groupId })
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		throw redirect(302, `/admin/screens/${params.id}`);
	}
};

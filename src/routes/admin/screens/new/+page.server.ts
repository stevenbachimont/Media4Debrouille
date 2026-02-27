import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const siteId = url.searchParams.get('siteId') ?? '';
	const [sitesRes, groupsRes] = await Promise.all([
		fetch('/api/admin/sites'),
		fetch(`/api/admin/screen-groups?siteId=${siteId}`)
	]);
	const sites = sitesRes.ok ? await sitesRes.json() : [];
	const groups = groupsRes.ok ? await groupsRes.json() : [];
	return { sites, groups, defaultSiteId: siteId };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const siteId = (formData.get('siteId') as string)?.trim();
		const groupId = (formData.get('groupId') as string)?.trim() || undefined;
		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim();

		if (!siteId || !name) return fail(400, { message: 'Site et nom sont requis' });

		const res = await fetch('/api/admin/screens', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				siteId,
				groupId: groupId || null,
				name,
				description: description || null
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		const screen = await res.json();
		throw redirect(302, `/admin/screens/${screen.id}`);
	}
};

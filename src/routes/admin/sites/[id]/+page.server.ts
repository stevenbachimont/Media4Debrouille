import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/admin/sites/${params.id}`);
	if (!res.ok) return { site: null };
	const site = await res.json();
	return { site };
};

export const actions: Actions = {
	addGroup: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const siteId = (formData.get('siteId') as string) || params.id;
		const name = (formData.get('name') as string)?.trim();
		if (!name) return {};
		await fetch('/api/admin/screen-groups', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ siteId, name })
		});
		return {};
	}
};

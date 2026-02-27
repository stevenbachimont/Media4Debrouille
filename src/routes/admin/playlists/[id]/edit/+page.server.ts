import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const [playlistRes, templatesRes, mediasRes] = await Promise.all([
		fetch(`/api/admin/playlists/${params.id}`),
		fetch('/api/admin/templates'),
		fetch('/api/admin/medias')
	]);
	const playlist = playlistRes.ok ? await playlistRes.json() : null;
	const templates = templatesRes.ok ? await templatesRes.json() : [];
	const medias = mediasRes.ok ? await mediasRes.json() : [];
	return { playlist, templates, medias };
};

export const actions: Actions = {
	default: async ({ request, fetch, params }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const defaultDuration = parseInt((formData.get('defaultDuration') as string) || '10', 10);
		const transition = (formData.get('transition') as string) || 'FADE';
		const itemsJson = formData.get('items') as string;
		let items: { mediaId: string; duration?: number }[] = [];
		try {
			if (itemsJson) items = JSON.parse(itemsJson);
		} catch (_) {}
		const res = await fetch(`/api/admin/playlists/${params.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: name || undefined,
				defaultDuration: defaultDuration > 0 ? defaultDuration : undefined,
				transition: transition === 'SLIDE' || transition === 'NONE' ? transition : undefined,
				items: items.filter((i) => i?.mediaId)
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		throw redirect(302, `/admin/playlists/${params.id}`);
	}
};

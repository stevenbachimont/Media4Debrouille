import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [playlistsRes, sitesRes, groupsRes, screensRes] = await Promise.all([
		fetch('/api/admin/playlists'),
		fetch('/api/admin/sites'),
		fetch('/api/admin/screen-groups'),
		fetch('/api/admin/screens')
	]);
	const playlists = playlistsRes.ok ? await playlistsRes.json() : [];
	const sites = sitesRes.ok ? await sitesRes.json() : [];
	const groups = groupsRes.ok ? await groupsRes.json() : [];
	const screens = screensRes.ok ? await screensRes.json() : [];
	return { playlists, sites, groups, screens };
};

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const targetType = (formData.get('targetType') as string) || 'SCREEN';
		const targetId = (formData.get('targetId') as string)?.trim();
		const playlistId = (formData.get('playlistId') as string)?.trim();
		const priority = parseInt((formData.get('priority') as string) || '50', 10);
		const startDate = (formData.get('startDate') as string) || new Date().toISOString().slice(0, 10);
		const endDate = (formData.get('endDate') as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		const startTime = (formData.get('startTime') as string) || '00:00';
		const endTime = (formData.get('endTime') as string) || '23:59';
		const daysStr = (formData.get('daysOfWeek') as string) || '0,1,2,3,4,5,6';
		const daysOfWeek = daysStr.split(',').map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6);

		if (!name) return fail(400, { message: 'Le nom est requis' });
		if (!targetId) return fail(400, { message: 'Choisir un écran ou un groupe' });
		if (!playlistId) return fail(400, { message: 'La playlist est requise' });

		const res = await fetch('/api/admin/schedules', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name,
				targetType: targetType === 'GROUP' ? 'GROUP' : 'SCREEN',
				targetId,
				playlistId,
				priority: priority >= 1 && priority <= 100 ? priority : 50,
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
				startTime,
				endTime,
				daysOfWeek: daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
				isRecurring: true,
				isInterruption: false
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return fail(res.status, { message: err.error || 'Erreur' });
		}
		const schedule = await res.json();
		throw redirect(302, `/admin/schedules/${schedule.id}`);
	}
};

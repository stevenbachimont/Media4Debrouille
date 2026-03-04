import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const [sitesRes, groupsRes, screensRes, mediasRes] = await Promise.all([
			fetch('/api/admin/sites'),
			fetch('/api/admin/screen-groups'),
			fetch('/api/admin/screens'),
			fetch('/api/admin/medias')
		]);
		const sites = sitesRes.ok ? await sitesRes.json() : [];
		const groups = groupsRes.ok ? await groupsRes.json() : [];
		const screens = screensRes.ok ? await screensRes.json() : [];
		const medias = mediasRes.ok ? await mediasRes.json() : [];
		return { sites, groups, screens, medias };
	} catch (e) {
		console.error('[schedules/new load]', e);
		return { sites: [], groups: [], screens: [], medias: [] };
	}
};

export const actions: Actions = {
	default: async (event) => {
		console.log('[schedules/new] Action appelée');
		const user = requireAdmin(event);
		console.log('[schedules/new] Utilisateur authentifié:', user?.id, user?.email);
		const { request } = event;
		let name = '';
		let targetType = 'SCREEN';
		let targetId = '';
		let priority = 50;
		let defaultDuration = 10;
		let startDate = new Date().toISOString().slice(0, 10);
		let endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		let startTime = '00:00';
		let endTime = '23:59';
		let daysStr = '0,1,2,3,4,5,6';
		let items: { mediaId: string; duration: number }[] = [];

		try {
			const formData = await request.formData();
			name = (formData.get('name') as string)?.trim() ?? '';
			targetType = (formData.get('targetType') as string) || 'SCREEN';
			targetId = (formData.get('targetId') as string)?.trim() ?? '';
			priority = parseInt((formData.get('priority') as string) || '50', 10) || 50;
			defaultDuration = parseInt((formData.get('defaultDuration') as string) || '10', 10) || 10;
			startDate = (formData.get('startDate') as string) || new Date().toISOString().slice(0, 10);
			endDate = (formData.get('endDate') as string) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
			startTime = (formData.get('startTime') as string) || '00:00';
			endTime = (formData.get('endTime') as string) || '23:59';
			daysStr = (formData.get('daysOfWeek') as string) || '0,1,2,3,4,5,6';
			const itemsStr = formData.get('items') as string;
			if (itemsStr) {
				try {
					items = JSON.parse(decodeURIComponent(itemsStr)) as { mediaId: string; duration: number }[];
				} catch (parseErr) {
					console.log('[schedules/new] Parse items échoué:', itemsStr?.slice(0, 100), parseErr);
				}
				if (!Array.isArray(items)) items = [];
			}
			console.log('[schedules/new] FormData parsé:', { name, targetType, targetId, priority, defaultDuration, startDate, endDate, itemsCount: items.length });
		} catch (e) {
			console.error('[schedules/new action] formData', e);
			return fail(400, { message: 'Données du formulaire invalides', values: { name: '', targetType: 'SCREEN', targetId: '', priority: 50, defaultDuration: 10, startDate: '', endDate: '', startTime: '00:00', endTime: '23:59', daysOfWeek: '0,1,2,3,4,5,6', items: [] } });
		}

		const daysOfWeek = daysStr.split(',').map((d) => parseInt(d.trim(), 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 6);
		const values = { name, targetType, targetId, priority, defaultDuration, startDate, endDate, startTime, endTime, daysOfWeek: daysStr, items };

		if (!name) {
			console.log('[schedules/new] Validation KO: nom manquant');
			return fail(400, { message: 'Le nom est requis', values });
		}
		if (!targetId) {
			console.log('[schedules/new] Validation KO: targetId manquant');
			return fail(400, { message: 'Choisir un écran ou un groupe', values });
		}

		console.log('[schedules/new] Validation OK, création en BDD...');
		try {
			const start = new Date(startDate);
			const end = new Date(endDate);
			end.setUTCHours(23, 59, 59, 999);
			const st = /^\d{2}:\d{2}$/.test(startTime) ? startTime : '00:00';
			const et = /^\d{2}:\d{2}$/.test(endTime) ? endTime : '23:59';
			const daysJson = JSON.stringify(daysOfWeek.length ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6]);
			const defDuration = defaultDuration > 0 ? defaultDuration : 10;
			const prio = priority >= 1 && priority <= 100 ? priority : 50;

			const schedule = await prisma.$transaction(async (tx) => {
				console.log('[schedules/new] Création playlist...');
				const playlist = await tx.playlist.create({
					data: {
						name,
						description: null,
						defaultDuration: defDuration,
						transition: 'FADE',
						createdById: user.id
					}
				});
				console.log('[schedules/new] Playlist créée:', playlist.id);

				for (let i = 0; i < items.length; i++) {
					const it = items[i];
					if (it?.mediaId) {
						await tx.playlistItem.create({
							data: {
								playlistId: playlist.id,
								mediaId: it.mediaId,
								zoneId: 'main',
								order: i,
								duration: typeof it.duration === 'number' && it.duration > 0 ? it.duration : null
							}
						});
					}
				}
				if (items.length) console.log('[schedules/new] PlaylistItems créés:', items.length);

				console.log('[schedules/new] Création schedule...');
				return tx.schedule.create({
					data: {
						name,
						targetType: targetType === 'GROUP' ? 'GROUP' : 'SCREEN',
						targetId,
						playlistId: playlist.id,
						priority: prio,
						startDate: start,
						endDate: end,
						startTime: st,
						endTime: et,
						daysOfWeek: daysJson,
						isRecurring: true,
						isInterruption: false,
						createdById: user.id
					}
				});
			});

			console.log('[schedules/new] Succès, redirect vers:', schedule.id);
			throw redirect(302, `/admin/schedules/${schedule.id}`);
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status >= 300 && (e as { status: number }).status < 400) {
				console.log('[schedules/new] Redirect (3xx), rethrow');
				throw e;
			}
			console.error('[schedules/new action] Erreur:', e);
			const message = e instanceof Error ? e.message : String(e);
			return fail(500, { message: `Erreur serveur : ${message}`, values });
		}
	}
};

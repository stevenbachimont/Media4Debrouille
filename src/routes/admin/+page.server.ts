import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';

const FIVE_MIN_MS = 5 * 60 * 1000;

export const load: PageServerLoad = async () => {
	const [sites, screens, schedules, recentCommands, stats, groups] = await Promise.all([
		prisma.site.findMany({
			orderBy: { name: 'asc' },
			include: {
				_count: { select: { screens: true, screenGroups: true } },
				screens: { select: { id: true, name: true, status: true, lastSeen: true } }
			}
		}),
		prisma.screen.findMany({
			orderBy: { name: 'asc' },
			include: { site: true, group: true }
		}),
		prisma.schedule.findMany({
			orderBy: { priority: 'desc' },
			include: { playlist: { select: { id: true, name: true, _count: { select: { items: true } } } } }
		}),
		prisma.screenCommand.findMany({
			orderBy: { sentAt: 'desc' },
			take: 25,
			include: {
				screen: { select: { id: true, name: true } },
				sentBy: { select: { email: true } }
			}
		}),
		Promise.all([
			prisma.site.count(),
			prisma.screen.count(),
			prisma.screen.count({ where: { status: 'ONLINE' } }),
			prisma.screen.count({ where: { lastSeen: { gte: new Date(Date.now() - FIVE_MIN_MS) } } }),
			prisma.playlist.count(),
			prisma.schedule.count(),
			prisma.media.count()
		]).then(([sitesCount, screensCount, onlineCount, seenRecentlyCount, playlistsCount, schedulesCount, mediasCount]) => ({
			sites: sitesCount,
			screens: screensCount,
			online: onlineCount,
			seenRecently: seenRecentlyCount,
			playlists: playlistsCount,
			schedules: schedulesCount,
			medias: mediasCount
		})),
		prisma.screenGroup.findMany({
			orderBy: { name: 'asc' },
			select: { id: true, name: true }
		})
	]);

	return {
		sites,
		screens,
		schedules,
		recentCommands,
		stats,
		groups
	};
};

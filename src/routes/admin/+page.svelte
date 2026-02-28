<script lang="ts">
	let { data } = $props();

	const FIVE_MIN_MS = 5 * 60 * 1000;

	function isOffline(screen: { lastSeen?: string | Date | null }) {
		if (!screen?.lastSeen) return true;
		return Date.now() - new Date(screen.lastSeen).getTime() > FIVE_MIN_MS;
	}

	function statusLabel(screen: { status?: string | null; lastSeen?: string | Date | null }) {
		if (isOffline(screen)) return { label: 'Hors ligne', class: 'bg-red-100 text-red-800' };
		const s = screen.status ?? 'OFFLINE';
		if (s === 'ONLINE') return { label: 'En ligne', class: 'bg-emerald-100 text-emerald-800' };
		if (s === 'WARNING') return { label: 'Attention', class: 'bg-amber-100 text-amber-800' };
		return { label: s, class: 'bg-slate-100 text-slate-600' };
	}

	function commandLabel(cmd: string) {
		const map: Record<string, string> = {
			SCREENSHOT: 'Capture',
			RELOAD: 'Rafraîchir',
			PLAYLIST_RELOAD: 'Recharger playlist',
			CACHE_CLEAR: 'Vider cache',
			RESTART_BROWSER: 'Redémarrer navigateur',
			REBOOT: 'Redémarrer'
		};
		return map[cmd] ?? cmd;
	}

	function formatDate(d: string | Date) {
		return new Date(d).toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function daysLabel(daysOfWeek: string) {
		try {
			const d = JSON.parse(daysOfWeek || '[]') as number[];
			if (!d.length || d.length === 7) return 'Tous les jours';
			const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
			return d.map((i) => names[i]).join(', ');
		} catch {
			return '—';
		}
	}

	function targetLabel(s: { targetType: string; targetId: string }) {
		if (s.targetType === 'SCREEN') {
			const screen = data.screens?.find((x: { id: string }) => x.id === s.targetId);
			return screen?.name ?? s.targetId;
		}
		const group = data.groups?.find((g: { id: string }) => g.id === s.targetId);
		return group ? `Groupe: ${group.name}` : s.targetId;
	}
</script>

<svelte:head>
	<title>Console — Digital Signage</title>
</svelte:head>

<div class="space-y-8">
	<!-- En-tête -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
			{#if data.user}
				<p class="mt-1 text-sm text-slate-500">
					Connecté en tant que <strong>{data.user.email}</strong> · {data.user.role}
				</p>
			{/if}
		</div>
	</div>

	<!-- Cartes stats -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		<a href="/admin/sites" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
			<div class="text-2xl font-bold text-slate-900">{data.stats?.sites ?? 0}</div>
			<div class="text-sm text-slate-500">Sites</div>
		</a>
		<a href="/admin/screens" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
			<div class="text-2xl font-bold text-slate-900">{data.stats?.screens ?? 0}</div>
			<div class="text-sm text-slate-500">Écrans</div>
		</a>
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="text-2xl font-bold text-emerald-600">{data.stats?.seenRecently ?? 0}</div>
			<div class="text-sm text-slate-500">En ligne (5 min)</div>
		</div>
		<a href="/admin/playlists" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
			<div class="text-2xl font-bold text-slate-900">{data.stats?.playlists ?? 0}</div>
			<div class="text-sm text-slate-500">Playlists</div>
		</a>
		<a href="/admin/schedules" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
			<div class="text-2xl font-bold text-slate-900">{data.stats?.schedules ?? 0}</div>
			<div class="text-sm text-slate-500">Plannings</div>
		</a>
		<a href="/admin/medias" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
			<div class="text-2xl font-bold text-slate-900">{data.stats?.medias ?? 0}</div>
			<div class="text-sm text-slate-500">Médias</div>
		</a>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Sites & écrans par site -->
		<section class="rounded-xl border border-slate-200 bg-white shadow-sm">
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<h2 class="font-semibold text-slate-900">Sites et écrans</h2>
				<a href="/admin/sites" class="text-sm text-slate-500 hover:text-slate-900">Voir tout</a>
			</div>
			<div class="max-h-[320px] overflow-y-auto">
				{#if data.sites?.length === 0}
					<p class="p-4 text-center text-slate-500">Aucun site.</p>
				{:else}
					<ul class="divide-y divide-slate-100">
						{#each data.sites ?? [] as site}
							<li class="px-4 py-3">
								<a href="/admin/sites/{site.id}" class="font-medium text-slate-900 hover:underline">{site.name}</a>
								<span class="ml-2 text-slate-500">({site._count?.screens ?? 0} écran(s))</span>
								{#if site.screens?.length}
									<ul class="mt-2 space-y-1 pl-3 text-sm">
										{#each site.screens as screen}
											{@const badge = statusLabel(screen)}
											<li>
												<a href="/admin/screens/{screen.id}" class="text-slate-600 hover:underline">{screen.name}</a>
												<span class="ml-2 inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium {badge.class}">{badge.label}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>

		<!-- Aperçu plannings -->
		<section class="rounded-xl border border-slate-200 bg-white shadow-sm">
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<h2 class="font-semibold text-slate-900">Plannings</h2>
				<a href="/admin/schedules" class="text-sm text-slate-500 hover:text-slate-900">Voir tout</a>
			</div>
			<div class="max-h-[320px] overflow-y-auto">
				{#if data.schedules?.length === 0}
					<p class="p-4 text-center text-slate-500">Aucun planning.</p>
				{:else}
					<table class="min-w-full text-sm">
						<thead class="bg-slate-50 text-left text-xs uppercase text-slate-500">
							<tr>
								<th class="px-4 py-2">Nom</th>
								<th class="px-4 py-2">Cible</th>
								<th class="px-4 py-2">Playlist</th>
								<th class="px-4 py-2">Créneau</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each (data.schedules ?? []).slice(0, 10) as s}
								<tr class="hover:bg-slate-50">
									<td class="px-4 py-2">
										<a href="/admin/schedules/{s.id}" class="font-medium text-slate-900 hover:underline">{s.name}</a>
									</td>
									<td class="px-4 py-2 text-slate-600">{targetLabel(s)}</td>
									<td class="px-4 py-2 text-slate-600">{s.playlist?.name ?? '—'} ({s.playlist?._count?.items ?? 0} médias)</td>
									<td class="px-4 py-2 text-slate-600">{s.startTime}–{s.endTime} · {daysLabel(s.daysOfWeek)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</section>
	</div>

	<!-- Écrans (tableau compact) -->
	<section class="rounded-xl border border-slate-200 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
			<h2 class="font-semibold text-slate-900">Écrans</h2>
			<a href="/admin/screens" class="text-sm text-slate-500 hover:text-slate-900">Voir tout</a>
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200">
				<thead class="bg-slate-50">
					<tr>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Site</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Groupe</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Statut</th>
						<th class="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">Playlist / Média</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if data.screens?.length === 0}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-slate-500">Aucun écran.</td>
						</tr>
					{:else}
						{#each (data.screens ?? []).slice(0, 15) as screen}
							{@const badge = statusLabel(screen)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-2">
									<a href="/admin/screens/{screen.id}" class="font-medium text-slate-900 hover:underline">{screen.name}</a>
								</td>
								<td class="px-4 py-2 text-slate-600">{screen.site?.name ?? '—'}</td>
								<td class="px-4 py-2 text-slate-600">{screen.group?.name ?? '—'}</td>
								<td class="px-4 py-2">
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {badge.class}">{badge.label}</span>
								</td>
								<td class="max-w-[200px] truncate px-4 py-2 text-slate-600" title={screen.currentPlaylistId ?? ''}>
									{screen.currentPlaylistId ?? '—'}
									{#if screen.currentMediaName}
										<span class="block truncate text-xs text-slate-400">→ {screen.currentMediaName}</span>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</section>

	<!-- Logs / Dernières commandes -->
	<section class="rounded-xl border border-slate-200 bg-white shadow-sm">
		<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
			<h2 class="font-semibold text-slate-900">Dernières commandes</h2>
			<span class="text-sm text-slate-500">Logs des actions envoyées aux écrans</span>
		</div>
		<div class="max-h-[280px] overflow-y-auto">
			{#if data.recentCommands?.length === 0}
				<p class="p-4 text-center text-slate-500">Aucune commande récente.</p>
			{:else}
				<ul class="divide-y divide-slate-100">
					{#each data.recentCommands ?? [] as cmd}
						<li class="flex flex-wrap items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50">
							<span class="font-medium text-slate-700">{commandLabel(cmd.command)}</span>
							<span class="text-slate-500">→</span>
							<a href="/admin/screens/{cmd.screen.id}" class="text-slate-600 hover:underline">{cmd.screen.name}</a>
							<span class="text-slate-400">{formatDate(cmd.sentAt)}</span>
							{#if cmd.sentBy?.email}
								<span class="text-slate-400">par {cmd.sentBy.email}</span>
							{/if}
							<span class="inline-flex rounded px-1.5 py-0.5 text-xs {cmd.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : cmd.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'}">{cmd.status}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</div>

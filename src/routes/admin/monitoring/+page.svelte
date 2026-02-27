<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let screens = $state<typeof data.screens>(data.screens ?? []);
	let statusMap = $state<Record<string, { status: string; lastSeen?: string; currentPlaylistId?: string; currentMediaName?: string; uptime?: number }>>({});
	let screenshotModal = $state<{ screenId: string; screenName: string; imageDataUrl: string } | null>(null);
	let pollingTimer: ReturnType<typeof setInterval> | null = null;

	const FIVE_MIN_MS = 5 * 60 * 1000;

	function isOffline(screen: { lastSeen?: string | null }) {
		if (!screen.lastSeen) return true;
		return Date.now() - new Date(screen.lastSeen).getTime() > FIVE_MIN_MS;
	}

	function statusBadge(screen: { id: string; status?: string | null; lastSeen?: string | null }) {
		const offline = isOffline(screen);
		const status = statusMap[screen.id]?.status ?? screen.status ?? 'OFFLINE';
		if (offline) return { label: 'Hors ligne', class: 'bg-red-100 text-red-800' };
		if (status === 'ONLINE') return { label: 'En ligne', class: 'bg-green-100 text-green-800' };
		if (status === 'WARNING') return { label: 'Attention', class: 'bg-amber-100 text-amber-800' };
		return { label: status || '—', class: 'bg-slate-100 text-slate-600' };
	}

	async function sendCommand(screenId: string, command: string) {
		try {
			const res = await fetch(`/api/admin/screens/${screenId}/command`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ command })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				alert(err.error || 'Erreur');
				return;
			}
			if (command === 'SCREENSHOT') {
				// Poll last-screenshot for a few seconds
				for (let i = 0; i < 10; i++) {
					await new Promise((r) => setTimeout(r, 1000));
					const shotRes = await fetch(`/api/admin/screens/${screenId}/last-screenshot`);
					if (shotRes.ok) {
						const shot = await shotRes.json();
						if (shot.imageBase64) {
							screenshotModal = {
								screenId,
								screenName: screens.find((s: { id: string; name?: string }) => s.id === screenId)?.name ?? screenId,
								imageDataUrl: `data:image/jpeg;base64,${shot.imageBase64}`
							};
							return;
						}
					}
				}
				alert('Capture non reçue (le player est peut-être déconnecté ou le serveur Socket n’est pas actif).');
			} else {
				invalidateAll();
			}
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Erreur');
		}
	}

	$effect(() => {
		const list = data.screens ?? [];
		screens = list;
		statusMap = Object.fromEntries(
			list.map((s: { id: string; status?: string; lastSeen?: string; currentPlaylistId?: string; currentMediaName?: string; uptime?: number }) => [
				s.id,
				{
					status: s.status ?? 'OFFLINE',
					lastSeen: s.lastSeen,
					currentPlaylistId: s.currentPlaylistId,
					currentMediaName: s.currentMediaName,
					uptime: s.uptime ?? undefined
				}
			])
		);
	});

	$effect(() => {
		// Poll every 10s
		pollingTimer = setInterval(async () => {
			try {
				const res = await fetch('/api/admin/screens');
				if (res.ok) {
					const list = await res.json();
					screens = list;
					statusMap = Object.fromEntries(
						list.map((s: { id: string; status?: string; lastSeen?: string; currentPlaylistId?: string; currentMediaName?: string; uptime?: number }) => [
							s.id,
							{
								status: s.status ?? 'OFFLINE',
								lastSeen: s.lastSeen,
								currentPlaylistId: s.currentPlaylistId,
								currentMediaName: s.currentMediaName,
								uptime: s.uptime ?? undefined
							}
						])
					);
				}
			} catch (_) {}
		}, 10_000);
		return () => {
			if (pollingTimer) clearInterval(pollingTimer);
		};
	});

	function formatLastSeen(lastSeen: string | undefined | null) {
		if (!lastSeen) return '—';
		const d = new Date(lastSeen);
		const diff = Math.floor((Date.now() - d.getTime()) / 1000);
		if (diff < 60) return `Il y a ${diff}s`;
		if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
		return d.toLocaleString('fr-FR');
	}

	function formatUptime(sec: number | undefined | null) {
		if (sec == null) return '—';
		if (sec < 60) return `${sec}s`;
		if (sec < 3600) return `${Math.floor(sec / 60)} min`;
		return `${Math.floor(sec / 3600)} h`;
	}
</script>

<svelte:head>
	<title>Monitoring — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Monitoring</h1>
	<p class="text-sm text-slate-500">Statut des écrans (rafraîchi toutes les 10 s)</p>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Site</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Statut</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Playlist</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Média</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Uptime</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Dernière vue</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if screens.length === 0}
				<tr>
					<td colspan="8" class="px-4 py-8 text-center text-slate-500">Aucun écran.</td>
				</tr>
			{:else}
				{#each screens as screen}
					{@const badge = statusBadge(screen)}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/screens/{screen.id}" class="hover:underline">{screen.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{screen.site?.name ?? '—'}</td>
						<td class="px-4 py-3">
							<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {badge.class}">
								{badge.label}
							</span>
						</td>
						<td class="max-w-[120px] truncate px-4 py-3 text-slate-600" title={statusMap[screen.id]?.currentPlaylistId ?? screen.currentPlaylistId ?? ''}>
							{statusMap[screen.id]?.currentPlaylistId ?? screen.currentPlaylistId ?? '—'}
						</td>
						<td class="max-w-[120px] truncate px-4 py-3 text-slate-600" title={statusMap[screen.id]?.currentMediaName ?? screen.currentMediaName ?? ''}>
							{statusMap[screen.id]?.currentMediaName ?? screen.currentMediaName ?? '—'}
						</td>
						<td class="px-4 py-3 text-slate-600">
							{formatUptime(statusMap[screen.id]?.uptime ?? screen.uptime)}
						</td>
						<td class="px-4 py-3 text-slate-600">
							{formatLastSeen(statusMap[screen.id]?.lastSeen ?? screen.lastSeen)}
						</td>
						<td class="px-4 py-3 text-right">
							<button
								type="button"
								title="Capture d’écran"
								onclick={() => sendCommand(screen.id, 'SCREENSHOT')}
								class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
							>
								📸
							</button>
							<button
								type="button"
								title="Recharger la playlist"
								onclick={() => sendCommand(screen.id, 'PLAYLIST_RELOAD')}
								class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
							>
								🔄
							</button>
							<button
								type="button"
								title="Rafraîchir le navigateur"
								onclick={() => sendCommand(screen.id, 'RELOAD')}
								class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
							>
								🔁
							</button>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if screenshotModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Capture d’écran"
		onclick={() => (screenshotModal = null)}
		onkeydown={(e) => e.key === 'Escape' && (screenshotModal = null)}
	>
		<div
			class="max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white p-4 shadow-xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 class="text-lg font-semibold text-slate-900">{screenshotModal.screenName}</h2>
			<img
				src={screenshotModal.imageDataUrl}
				alt="Capture"
				class="mt-2 max-h-[70vh] border border-slate-200"
			/>
			<div class="mt-4 flex justify-end">
				<button
					type="button"
					onclick={() => (screenshotModal = null)}
					class="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
				>
					Fermer
				</button>
			</div>
		</div>
	</div>
{/if}

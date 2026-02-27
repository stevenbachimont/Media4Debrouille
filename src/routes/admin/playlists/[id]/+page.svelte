<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function deletePlaylist() {
		if (!data.playlist || !confirm(`Supprimer la playlist « ${data.playlist.name} » ?`)) return;
		const res = await fetch(`/api/admin/playlists/${data.playlist.id}`, { method: 'DELETE' });
		if (res.ok) goto('/admin/playlists');
		else alert((await res.json().catch(() => ({}))).error || 'Erreur lors de la suppression');
	}
</script>

<svelte:head>
	<title>{data.playlist?.name ?? 'Playlist'} — Console</title>
</svelte:head>

{#if !data.playlist}
	<p class="text-slate-600">Playlist non trouvée.</p>
	<a href="/admin/playlists" class="text-slate-600 underline">Retour aux playlists</a>
{:else}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-slate-900">{data.playlist.name}</h1>
		<div class="flex gap-2">
			<a href="/admin/playlists/{data.playlist.id}/edit" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Modifier</a>
			<button
				type="button"
				onclick={deletePlaylist}
				class="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
			>
				Supprimer
			</button>
			<a href="/admin/playlists" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Retour</a>
		</div>
	</div>
	<dl class="mt-6 grid gap-3 sm:grid-cols-2">
		<div>
			<dt class="text-sm font-medium text-slate-500">Template</dt>
			<dd class="mt-1 text-slate-800">{data.playlist.template?.name ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Durée par défaut</dt>
			<dd class="mt-1 text-slate-800">{data.playlist.defaultDuration}s</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Transition</dt>
			<dd class="mt-1 text-slate-800">{data.playlist.transition ?? 'FADE'}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Version</dt>
			<dd class="mt-1 text-slate-800">{data.playlist.version ?? 1}</dd>
		</div>
	</dl>
	<div class="mt-6">
		<h2 class="text-sm font-medium text-slate-700">Médias ({data.playlist.items?.length ?? 0})</h2>
		{#if data.playlist.items?.length}
			<ol class="mt-2 list-decimal space-y-1 pl-5">
				{#each data.playlist.items as item}
					<li class="text-slate-700">
						{item.media?.name ?? item.mediaId}
						{#if item.duration}({item.duration}s){/if}
					</li>
				{/each}
			</ol>
		{:else}
			<p class="mt-2 text-slate-500">Aucun média. Modifiez la playlist pour en ajouter.</p>
		{/if}
	</div>
{/if}

<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Playlists — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Playlists</h1>
	<a
		href="/admin/playlists/new"
		class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>Nouvelle playlist</a
	>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Template</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Médias</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if data.playlists.length === 0}
				<tr>
					<td colspan="4" class="px-4 py-8 text-center text-slate-500">
						Aucune playlist. <a href="/admin/playlists/new" class="text-slate-700 underline">En créer une</a>.
					</td>
				</tr>
			{:else}
				{#each data.playlists as p}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/playlists/{p.id}" class="hover:underline">{p.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{p.template?.name ?? '—'}</td>
						<td class="px-4 py-3 text-slate-600">{p._count?.items ?? 0}</td>
						<td class="px-4 py-3 text-right">
							<a href="/admin/playlists/{p.id}" class="text-sm text-slate-600 hover:text-slate-900">Voir</a>
							<span class="mx-2 text-slate-300">|</span>
							<a href="/admin/playlists/{p.id}/edit" class="text-sm text-slate-600 hover:text-slate-900">Modifier</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

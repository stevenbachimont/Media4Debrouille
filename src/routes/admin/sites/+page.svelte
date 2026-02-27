<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Sites — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Sites</h1>
	<a
		href="/admin/sites/new"
		class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>Nouveau site</a
	>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Ville</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Écrans</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if data.sites.length === 0}
				<tr>
					<td colspan="4" class="px-4 py-8 text-center text-slate-500">Aucun site. Créez-en un.</td>
				</tr>
			{:else}
				{#each data.sites as site}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/sites/{site.id}" class="hover:underline">{site.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{site.city ?? '—'}</td>
						<td class="px-4 py-3 text-slate-600">{site._count?.screens ?? 0}</td>
						<td class="px-4 py-3 text-right">
							<a
								href="/admin/sites/{site.id}/edit"
								class="text-sm text-slate-600 hover:text-slate-900"
								>Modifier</a
							>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

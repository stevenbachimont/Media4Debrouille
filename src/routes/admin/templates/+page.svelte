<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Templates — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Templates</h1>
	<a
		href="/admin/templates/new"
		class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>Nouveau template</a
	>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Description</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if data.templates.length === 0}
				<tr>
					<td colspan="3" class="px-4 py-8 text-center text-slate-500">
						Aucun template. <a href="/admin/templates/new" class="text-slate-700 underline">En créer un</a>.
					</td>
				</tr>
			{:else}
				{#each data.templates as t}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/templates/{t.id}" class="hover:underline">{t.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{t.description ?? '—'}</td>
						<td class="px-4 py-3 text-right">
							<a href="/admin/templates/{t.id}" class="text-sm text-slate-600 hover:text-slate-900">Voir</a>
							<span class="mx-2 text-slate-300">|</span>
							<a href="/admin/templates/{t.id}/edit" class="text-sm text-slate-600 hover:text-slate-900">Modifier</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

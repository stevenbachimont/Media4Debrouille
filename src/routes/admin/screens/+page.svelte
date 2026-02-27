<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Écrans — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Écrans</h1>
	<a
		href="/admin/screens/new"
		class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>Nouvel écran</a
	>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Site</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Groupe</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Statut</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if data.screens.length === 0}
				<tr>
					<td colspan="5" class="px-4 py-8 text-center text-slate-500">Aucun écran. Créez-en un depuis un site ou ici.</td>
				</tr>
			{:else}
				{#each data.screens as screen}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/screens/{screen.id}" class="hover:underline">{screen.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{screen.site?.name ?? '—'}</td>
						<td class="px-4 py-3 text-slate-600">{screen.group?.name ?? '—'}</td>
						<td class="px-4 py-3">
							<span
								class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium
								{screen.status === 'ONLINE'
									? 'bg-green-100 text-green-800'
									: screen.status === 'WARNING'
										? 'bg-amber-100 text-amber-800'
										: 'bg-slate-100 text-slate-600'}"
							>
								{screen.status ?? 'OFFLINE'}
							</span>
						</td>
						<td class="px-4 py-3 text-right">
							<a
								href="/admin/screens/{screen.id}/activate"
								class="text-sm text-slate-600 hover:text-slate-900"
								>Activer</a
							>
							<span class="mx-2 text-slate-300">|</span>
							<a
								href="/admin/screens/{screen.id}/edit"
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

<p class="mt-4">
	<a href="/admin/sites" class="text-slate-600 underline">Voir les sites</a>
</p>

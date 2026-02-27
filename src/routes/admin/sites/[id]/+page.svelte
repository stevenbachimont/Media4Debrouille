<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.site?.name ?? 'Site'} — Console</title>
</svelte:head>

{#if !data.site}
	<p class="text-slate-600">Site non trouvé.</p>
	<a href="/admin/sites" class="text-slate-600 underline">Retour aux sites</a>
{:else}
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-slate-900">{data.site.name}</h1>
			{#if data.site.city}
				<p class="text-slate-600">{data.site.city}</p>
			{/if}
		</div>
		<a
			href="/admin/sites/{data.site.id}/edit"
			class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
			>Modifier</a
		>
	</div>

	<div class="mt-8">
		<h2 class="text-lg font-medium text-slate-900">Groupes d'écrans</h2>
		<p class="mt-1 text-sm text-slate-500">
			Les groupes permettent de regrouper des écrans (ex. "Rez-de-chaussée").
		</p>
		<ul class="mt-3 space-y-2">
			{#each data.site.screenGroups || [] as group}
				<li class="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2">
					<span class="font-medium text-slate-900">{group.name}</span>
					{#if group.description}
						<span class="text-sm text-slate-500">{group.description}</span>
					{/if}
				</li>
			{:else}
				<li class="text-slate-500">Aucun groupe.</li>
			{/each}
		</ul>
		<form method="POST" action="?/addGroup" class="mt-3 flex gap-2">
			<input type="hidden" name="siteId" value={data.site.id} />
			<input
				type="text"
				name="name"
				placeholder="Nom du groupe"
				required
				class="rounded border border-slate-300 px-3 py-1.5 text-sm"
			/>
			<button
				type="submit"
				class="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
			>
				Ajouter un groupe
			</button>
		</form>
	</div>

	<div class="mt-8">
		<h2 class="text-lg font-medium text-slate-900">Écrans</h2>
		<ul class="mt-3 space-y-2">
			{#each data.site.screens || [] as screen}
				<li class="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2">
					<a href="/admin/screens/{screen.id}" class="font-medium text-slate-900 hover:underline"
						>{screen.name}</a
					>
					<span class="text-sm text-slate-500">{screen.group?.name ?? '—'}</span>
				</li>
			{:else}
				<li class="text-slate-500">Aucun écran.</li>
			{/each}
		</ul>
		<a
			href="/admin/screens/new?siteId={data.site.id}"
			class="mt-3 inline-block text-sm text-slate-600 underline hover:text-slate-900"
			>Ajouter un écran</a
		>
	</div>

	<p class="mt-8">
		<a href="/admin/sites" class="text-slate-600 underline">← Retour aux sites</a>
	</p>
{/if}

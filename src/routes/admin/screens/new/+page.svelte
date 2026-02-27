<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Nouvel écran — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Nouvel écran</h1>
<form method="POST" class="mt-6 space-y-4">
	{#if data.form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{data.form.message}</p>
	{/if}
	<div>
		<label for="siteId" class="block text-sm font-medium text-slate-700">Site *</label>
		<select
			id="siteId"
			name="siteId"
			required
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		>
			<option value="">Choisir un site</option>
			{#each data.sites as site}
				<option value={site.id} selected={data.defaultSiteId === site.id}>{site.name}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="groupId" class="block text-sm font-medium text-slate-700">Groupe (optionnel)</label>
		<select id="groupId" name="groupId" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
			<option value="">Aucun</option>
			{#each data.groups as group}
				<option value={group.id}>{group.name}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		/>
	</div>
	<div>
		<label for="description" class="block text-sm font-medium text-slate-700">Description</label>
		<input
			id="description"
			name="description"
			type="text"
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		/>
	</div>
	<div class="flex gap-3 pt-2">
		<button
			type="submit"
			class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			Créer
		</button>
		<a href="/admin/screens" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
			>Annuler</a
		>
	</div>
</form>

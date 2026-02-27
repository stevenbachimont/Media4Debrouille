<script lang="ts">
	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);
</script>

<svelte:head>
	<title>Nouvelle playlist — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Nouvelle playlist</h1>
<form method="POST" class="mt-6 max-w-xl space-y-4">
	{#if form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
	{/if}
	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input id="name" name="name" type="text" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div>
		<label for="templateId" class="block text-sm font-medium text-slate-700">Template *</label>
		<select id="templateId" name="templateId" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
			<option value="">Choisir un template</option>
			{#each data.templates as t}
				<option value={t.id}>{t.name}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="defaultDuration" class="block text-sm font-medium text-slate-700">Durée par défaut (s)</label>
		<input id="defaultDuration" name="defaultDuration" type="number" min="1" value="10" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div class="flex gap-3 pt-2">
		<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Créer</button>
		<a href="/admin/playlists" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
	</div>
</form>

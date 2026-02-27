<script lang="ts">
	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);
</script>

<svelte:head>
	<title>Modifier {data.template?.name} — Console</title>
</svelte:head>

{#if !data.template}
	<p class="text-slate-600">Template non trouvé.</p>
	<a href="/admin/templates" class="text-slate-600 underline">Retour aux templates</a>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier le template</h1>
	<form method="POST" class="mt-6 max-w-xl space-y-4">
		{#if form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<div>
			<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
			<input id="name" name="name" type="text" required value={data.template.name} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div>
			<label for="description" class="block text-sm font-medium text-slate-700">Description</label>
			<input id="description" name="description" type="text" value={data.template.description ?? ''} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div class="flex gap-3 pt-2">
			<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Enregistrer</button>
			<a href="/admin/templates/{data.template.id}" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
		</div>
	</form>
{/if}

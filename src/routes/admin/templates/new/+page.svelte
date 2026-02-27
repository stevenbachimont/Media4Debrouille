<script lang="ts">
	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);
</script>

<svelte:head>
	<title>Nouveau template — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Nouveau template</h1>
<p class="mt-2 text-slate-600">Un template définit des zones d’affichage (par défaut : une zone « Contenu » plein écran).</p>

<form method="POST" class="mt-6 max-w-xl space-y-4">
	{#if form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
	{/if}
	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input id="name" name="name" type="text" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div>
		<label for="description" class="block text-sm font-medium text-slate-700">Description</label>
		<input id="description" name="description" type="text" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div class="flex gap-3 pt-2">
		<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Créer</button>
		<a href="/admin/templates" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
	</div>
</form>

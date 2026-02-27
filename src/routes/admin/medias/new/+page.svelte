<script lang="ts">
	let { data } = $props();
	// form est renvoyé par l'action en cas d'erreur (fail)
	const form = $derived((data as { form?: { message?: string } }).form);

	const types = [
		{ value: 'IMAGE', label: 'Image' },
		{ value: 'VIDEO', label: 'Vidéo' },
		{ value: 'WEBPAGE', label: 'Page web (iframe)' },
		{ value: 'HTML', label: 'HTML' },
		{ value: 'PDF', label: 'PDF' },
		{ value: 'RSS', label: 'RSS' },
		{ value: 'DATASET', label: 'Dataset' }
	];
</script>

<svelte:head>
	<title>Nouveau média — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Ajouter un média</h1>
<p class="mt-2 text-slate-600">
	Indiquez un nom, un type et l’URL du contenu (image, vidéo ou page web). Sans upload S3 pour l’instant, utilisez des liens publics.
</p>

<form method="POST" class="mt-6 max-w-xl space-y-4">
	{#if form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
	{/if}

	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			placeholder="Ex: Bannière accueil"
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		/>
	</div>

	<div>
		<label for="type" class="block text-sm font-medium text-slate-700">Type</label>
		<select id="type" name="type" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
			{#each types as t}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</div>

	<div>
		<label for="url" class="block text-sm font-medium text-slate-700">URL du contenu</label>
		<input
			id="url"
			name="url"
			type="url"
			placeholder="https://exemple.com/image.jpg ou https://exemple.com/page"
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		/>
		<p class="mt-1 text-xs text-slate-500">
			Pour Image/Vidéo : lien direct vers le fichier. Pour Page web : URL à afficher dans l’iframe.
		</p>
	</div>

	<div>
		<label for="duration" class="block text-sm font-medium text-slate-700">Durée (secondes, optionnel)</label>
		<input
			id="duration"
			name="duration"
			type="number"
			min="1"
			placeholder="10"
			class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
		/>
		<p class="mt-1 text-xs text-slate-500">Utilisée dans les playlists si non définie par item.</p>
	</div>

	<div class="flex gap-3 pt-2">
		<button
			type="submit"
			class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>
			Créer le média
		</button>
		<a href="/admin/medias" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
			Annuler
		</a>
	</div>
</form>

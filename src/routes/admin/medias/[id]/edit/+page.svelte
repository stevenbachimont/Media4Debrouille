<script lang="ts">
	let { data } = $props();
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
	<title>Modifier {data.media?.name} — Console</title>
</svelte:head>

{#if !data.media}
	<p class="text-slate-600">Média non trouvé.</p>
	<a href="/admin/medias" class="text-slate-600 underline">Retour à la médiathèque</a>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier le média</h1>

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
				value={data.media.name}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>

		<div>
			<label for="type" class="block text-sm font-medium text-slate-700">Type</label>
			<select id="type" name="type" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
				{#each types as t}
					<option value={t.value} selected={data.media.type === t.value}>{t.label}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="url" class="block text-sm font-medium text-slate-700">URL du contenu</label>
			<input
				id="url"
				name="url"
				type="url"
				value={data.media.url || data.media.cdnUrl || ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>

		<div>
			<label for="duration" class="block text-sm font-medium text-slate-700">Durée (secondes, optionnel)</label>
			<input
				id="duration"
				name="duration"
				type="number"
				min="1"
				value={data.media.duration ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>

		<div class="flex gap-3 pt-2">
			<button
				type="submit"
				class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
			>
				Enregistrer
			</button>
			<a href="/admin/medias/{data.media.id}" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
				Annuler
			</a>
		</div>
	</form>
{/if}

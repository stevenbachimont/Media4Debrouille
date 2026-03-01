<script lang="ts">
	import { invalidateAll } from '$app/navigation';

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

	let replaceStatus = $state<'idle' | 'uploading' | 'error'>('idle');
	let replaceError = $state('');
	const acceptUpload =
		'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.ppt,.pptx';

	async function handleReplaceFile(e: Event) {
		const formEl = e.target as HTMLFormElement;
		const formData = new FormData(formEl);
		const file = formData.get('file') as File | null;
		if (!file?.size || !data.media) return;
		replaceError = '';
		replaceStatus = 'uploading';
		try {
			const payload = new FormData();
			payload.set('file', file);
			const res = await fetch(`/api/admin/medias/${data.media.id}/replace-file`, {
				method: 'POST',
				body: payload
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				replaceError = out.error || 'Erreur';
				replaceStatus = 'error';
				return;
			}
			replaceStatus = 'idle';
			invalidateAll();
		} catch (err) {
			replaceError = err instanceof Error ? err.message : 'Erreur réseau';
			replaceStatus = 'error';
		}
	}
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

		{#if data.media.s3Key || data.media.cdnUrl}
			<div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<p class="text-sm font-medium text-slate-700">Remplacer le fichier</p>
				<form onsubmit={(e) => { e.preventDefault(); handleReplaceFile(e); }} class="mt-2 flex flex-wrap items-end gap-3">
					<input
						name="file"
						type="file"
						accept={acceptUpload}
						class="rounded border border-slate-300 px-2 py-1.5 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-700 file:px-3 file:py-1 file:text-white"
					/>
					<button
						type="submit"
						disabled={replaceStatus === 'uploading'}
						class="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
					>
						{replaceStatus === 'uploading' ? 'Envoi…' : 'Remplacer'}
					</button>
				</form>
				{#if replaceError}
					<p class="mt-2 text-sm text-red-600">{replaceError}</p>
				{/if}
			</div>
		{/if}

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

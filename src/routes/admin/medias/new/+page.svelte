<script lang="ts">
	import { goto } from '$app/navigation';

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

	let uploadStatus = $state<'idle' | 'uploading' | 'error'>('idle');
	let uploadError = $state('');

	const acceptUpload =
		'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.ppt,.pptx';

	async function handleFileUpload(e: Event) {
		const formEl = e.target as HTMLFormElement;
		const formData = new FormData(formEl);
		const file = formData.get('file') as File | null;
		if (!file?.size) {
			uploadError = 'Choisissez un fichier.';
			uploadStatus = 'error';
			return;
		}
		uploadError = '';
		uploadStatus = 'uploading';
		try {
			const payload = new FormData();
			payload.set('file', file);
			const name = (formData.get('uploadName') as string)?.trim();
			const duration = (formData.get('uploadDuration') as string)?.trim();
			if (name) payload.set('name', name);
			if (duration) payload.set('duration', duration);
			const res = await fetch('/api/admin/medias/upload', {
				method: 'POST',
				body: payload
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				uploadError = out.error || 'Erreur lors de l’envoi';
				uploadStatus = 'error';
				return;
			}
			goto(`/admin/medias/${out.id}`);
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Erreur réseau';
			uploadStatus = 'error';
		}
	}
</script>

<svelte:head>
	<title>Nouveau média — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Ajouter un média</h1>

<section class="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
	<h2 class="text-lg font-medium text-slate-900">Envoyer un fichier</h2>
	<p class="mt-1 text-sm text-slate-600">
		Images (JPEG, PNG, GIF, WebP, SVG), vidéos (MP4, WebM, OGG), PDF, PowerPoint (PPT, PPTX). Max 500 Mo.
	</p>
	<form onsubmit={(e) => { e.preventDefault(); handleFileUpload(e); }} class="mt-4 max-w-xl space-y-4">
		<div>
			<label for="file" class="block text-sm font-medium text-slate-700">Fichier *</label>
			<input
				id="file"
				name="file"
				type="file"
				accept={acceptUpload}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-white file:hover:bg-slate-700"
			/>
		</div>
		<div>
			<label for="uploadName" class="block text-sm font-medium text-slate-700">Nom (optionnel)</label>
			<input
				id="uploadName"
				name="uploadName"
				type="text"
				placeholder="Sinon : nom du fichier"
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="uploadDuration" class="block text-sm font-medium text-slate-700">Durée (s, optionnel)</label>
			<input
				id="uploadDuration"
				name="uploadDuration"
				type="number"
				min="1"
				placeholder="10"
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		{#if uploadError}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p>
		{/if}
		<div class="flex gap-3">
			<button
				type="submit"
				disabled={uploadStatus === 'uploading'}
				class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
			>
				{uploadStatus === 'uploading' ? 'Envoi en cours…' : 'Envoyer le fichier'}
			</button>
		</div>
	</form>
</section>

<section class="mt-8 max-w-xl">
	<h2 class="text-lg font-medium text-slate-900">Ou par lien</h2>
	<p class="mt-1 text-sm text-slate-600">
		Indiquez une URL (image, vidéo, page web, flux RSS).
	</p>
	<form method="POST" class="mt-4 space-y-4">
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
		</div>
		<div class="flex gap-3">
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
</section>

<p class="mt-8">
	<a href="/admin/medias" class="text-slate-600 underline">← Retour à la médiathèque</a>
</p>

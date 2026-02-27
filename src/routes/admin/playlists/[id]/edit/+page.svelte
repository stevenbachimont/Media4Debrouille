<script lang="ts">
	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);

	let items = $state<{ mediaId: string; duration: number }[]>([]);

	$effect(() => {
		const list = data.playlist?.items ?? [];
		items = list.map((i: { mediaId: string; duration?: number | null }) => ({
			mediaId: i.mediaId,
			duration: i.duration ?? data.playlist?.defaultDuration ?? 10
		}));
	});

	function addItem() {
		items = [...items, { mediaId: data.medias?.[0]?.id ?? '', duration: data.playlist?.defaultDuration ?? 10 }];
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...items];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		items = next;
	}

	function moveDown(index: number) {
		if (index >= items.length - 1) return;
		const next = [...items];
		[next[index], next[index + 1]] = [next[index + 1], next[index]];
		items = next;
	}

	function mediaName(mediaId: string) {
		return data.medias?.find((m: { id: string }) => m.id === mediaId)?.name ?? mediaId;
	}
</script>

<svelte:head>
	<title>Modifier {data.playlist?.name} — Console</title>
</svelte:head>

{#if !data.playlist}
	<p class="text-slate-600">Playlist non trouvée.</p>
	<a href="/admin/playlists" class="text-slate-600 underline">Retour aux playlists</a>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier la playlist</h1>
	<form method="POST" class="mt-6 max-w-2xl space-y-4">
		{#if form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<input type="hidden" name="items" value={JSON.stringify(items)} />
		<div>
			<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
			<input id="name" name="name" type="text" required value={data.playlist.name} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div>
			<label for="defaultDuration" class="block text-sm font-medium text-slate-700">Durée par défaut (s)</label>
			<input id="defaultDuration" name="defaultDuration" type="number" min="1" value={data.playlist.defaultDuration} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div>
			<label for="transition" class="block text-sm font-medium text-slate-700">Transition</label>
			<select id="transition" name="transition" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
				<option value="FADE" selected={data.playlist.transition === 'FADE'}>FADE</option>
				<option value="SLIDE" selected={data.playlist.transition === 'SLIDE'}>SLIDE</option>
				<option value="NONE" selected={data.playlist.transition === 'NONE'}>NONE</option>
			</select>
		</div>

		<div>
			<div class="flex items-center justify-between">
				<span class="block text-sm font-medium text-slate-700">Médias (ordre)</span>
				<button type="button" onclick={addItem} class="text-sm text-slate-600 hover:text-slate-900">+ Ajouter</button>
			</div>
			<ul class="mt-2 space-y-2">
				{#each items as item, i}
					<li class="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2">
						<span class="w-6 text-slate-500">{i + 1}</span>
						<select
							bind:value={item.mediaId}
							class="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
						>
							<option value="">— Choisir un média —</option>
							{#each data.medias ?? [] as m}
								<option value={m.id}>{m.name}</option>
							{/each}
						</select>
						<input
							type="number"
							min="1"
							bind:value={item.duration}
							class="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
							title="Durée (s)"
						/>
						<span class="text-slate-500 text-xs">s</span>
						<button type="button" onclick={() => moveUp(i)} class="rounded p-1 text-slate-500 hover:bg-slate-200" title="Monter">↑</button>
						<button type="button" onclick={() => moveDown(i)} class="rounded p-1 text-slate-500 hover:bg-slate-200" title="Descendre">↓</button>
						<button type="button" onclick={() => removeItem(i)} class="rounded p-1 text-red-600 hover:bg-red-50">×</button>
					</li>
				{/each}
			</ul>
		</div>

		<div class="flex gap-3 pt-2">
			<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Enregistrer</button>
			<a href="/admin/playlists/{data.playlist.id}" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
		</div>
	</form>
{/if}

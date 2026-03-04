<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	const form = $derived((data as { form?: { message?: string; values?: Record<string, unknown> } }).form);

	let name = $state('');
	let targetType = $state('SCREEN');
	let targetId = $state('');
	let priority = $state(50);
	let defaultDuration = $state(10);
	let startDate = $state(new Date().toISOString().slice(0, 10));
	let endDate = $state(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
	let startTime = $state('00:00');
	let endTime = $state('23:59');
	let daysOfWeek = $state('0,1,2,3,4,5,6');
	let items = $state<{ mediaId: string; duration: number }[]>([]);

	// Réhydrater les champs uniquement après une erreur de validation (évite d’écraser la saisie)
	$effect(() => {
		const v = form?.values;
		if (v && typeof v === 'object' && form?.message) {
			if (v.name !== undefined) name = String(v.name);
			if (v.targetType !== undefined) targetType = String(v.targetType);
			if (v.targetId !== undefined) targetId = String(v.targetId);
			if (v.priority !== undefined) priority = Number(v.priority) || 50;
			if (v.defaultDuration !== undefined) defaultDuration = Number(v.defaultDuration) || 10;
			if (v.startDate !== undefined) startDate = String(v.startDate);
			if (v.endDate !== undefined) endDate = String(v.endDate);
			if (v.startTime !== undefined) startTime = String(v.startTime);
			if (v.endTime !== undefined) endTime = String(v.endTime);
			if (v.daysOfWeek !== undefined) daysOfWeek = String(v.daysOfWeek);
			if (Array.isArray(v.items)) items = v.items as { mediaId: string; duration: number }[];
		}
	});

	function addItem() {
		items = [...items, { mediaId: (data.medias?.[0] as { id: string })?.id ?? '', duration: defaultDuration }];
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
		return (data.medias as { id: string; name: string }[])?.find((m) => m.id === mediaId)?.name ?? mediaId;
	}

	async function refreshLists() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Nouveau planning — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Nouveau planning</h1>
<form method="POST" class="mt-6 max-w-xl space-y-4" novalidate>
	{#if form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
	{/if}
	<input type="hidden" name="items" value={encodeURIComponent(JSON.stringify(items))} />
	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input id="name" name="name" type="text" required bind:value={name} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div>
		<label for="targetType" class="block text-sm font-medium text-slate-700">Cible</label>
		<select id="targetType" name="targetType" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={targetType}>
			<option value="SCREEN">Un écran</option>
			<option value="GROUP">Un groupe</option>
		</select>
	</div>
	<div id="targetId-container">
		<label for="targetId" class="block text-sm font-medium text-slate-700">Écran / Groupe *</label>
		<div class="mt-1 flex gap-2">
			<select id="targetId" name="targetId" required class="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2" bind:value={targetId}>
				<option value="">Choisir…</option>
				{#each data.screens ?? [] as s}
					<option value={s.id}>{s.name} ({s.site?.name ?? 'sans site'})</option>
				{/each}
				<optgroup label="Groupes">
					{#each data.groups ?? [] as g}
						<option value={g.id}>Groupe : {g.name}</option>
					{/each}
				</optgroup>
			</select>
			<button
				type="button"
				onclick={refreshLists}
				class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
				title="Recharger la liste des écrans et groupes"
			>
				Actualiser
			</button>
		</div>
		{#if (data.screens?.length ?? 0) === 0 && (data.groups?.length ?? 0) === 0}
			<p class="mt-2 text-sm text-amber-700">
				Aucun écran ni groupe. <a href="/admin/screens/new" class="underline">Créez un écran</a> (ou un groupe depuis un site), puis cliquez sur « Actualiser » ci-dessus.
			</p>
		{/if}
	</div>

	<div>
		<div class="flex items-center justify-between">
			<span class="block text-sm font-medium text-slate-700">Médias de ce planning (ordre de lecture)</span>
			<button type="button" onclick={addItem} class="text-sm text-slate-600 hover:text-slate-900">+ Ajouter un média</button>
		</div>
		{#if (data.medias?.length ?? 0) === 0}
			<p class="mt-2 text-sm text-amber-700">
				Aucun média. <a href="/admin/medias/new" class="underline">Ajoutez des médias</a> d’abord.
			</p>
		{:else}
			<ul class="mt-2 space-y-2">
				{#each items as item, i}
					<li class="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2">
						<span class="w-6 text-slate-500">{i + 1}</span>
						<select
							name="item_media_{i}"
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
						<span class="text-xs text-slate-500">s</span>
						<button type="button" onclick={() => moveUp(i)} class="rounded p-1 text-slate-500 hover:bg-slate-200" title="Monter">↑</button>
						<button type="button" onclick={() => moveDown(i)} class="rounded p-1 text-slate-500 hover:bg-slate-200" title="Descendre">↓</button>
						<button type="button" onclick={() => removeItem(i)} class="rounded p-1 text-red-600 hover:bg-red-50">×</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div>
		<label for="defaultDuration" class="block text-sm font-medium text-slate-700">Durée par défaut (s) pour les nouveaux médias</label>
		<input id="defaultDuration" name="defaultDuration" type="number" min="1" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={defaultDuration} required />
	</div>
	<div>
		<label for="priority" class="block text-sm font-medium text-slate-700">Priorité (1–100)</label>
		<input id="priority" name="priority" type="number" min="1" max="100" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={priority} />
	</div>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="startDate" class="block text-sm font-medium text-slate-700">Date début</label>
			<input id="startDate" name="startDate" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={startDate} />
		</div>
		<div>
			<label for="endDate" class="block text-sm font-medium text-slate-700">Date fin</label>
			<input id="endDate" name="endDate" type="date" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={endDate} />
		</div>
	</div>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="startTime" class="block text-sm font-medium text-slate-700">Heure début (HH:MM)</label>
			<input id="startTime" name="startTime" type="time" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={startTime} />
		</div>
		<div>
			<label for="endTime" class="block text-sm font-medium text-slate-700">Heure fin (HH:MM)</label>
			<input id="endTime" name="endTime" type="time" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={endTime} />
		</div>
	</div>
	<div>
		<label for="daysOfWeek" class="block text-sm font-medium text-slate-700">Jours (0=dim… 6=sam)</label>
		<input id="daysOfWeek" name="daysOfWeek" type="text" placeholder="0,1,2,3,4,5,6" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" bind:value={daysOfWeek} />
		<p class="mt-1 text-xs text-slate-500">Séparés par des virgules. 0=dimanche, 6=samedi. Par défaut : tous les jours.</p>
	</div>
	<div class="flex gap-3 pt-2">
		<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Créer le planning</button>
		<a href="/admin/schedules" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
	</div>
</form>

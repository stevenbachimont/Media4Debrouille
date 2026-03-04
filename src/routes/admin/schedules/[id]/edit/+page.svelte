<script lang="ts">
	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);

	let items = $state<{ mediaId: string; duration: number }[]>([]);

	$effect(() => {
		const list = data.schedule?.playlist?.items ?? [];
		items = list.map((i: { mediaId: string; duration?: number | null }) => ({
			mediaId: i.mediaId,
			duration: i.duration ?? data.schedule?.playlist?.defaultDuration ?? 10
		}));
	});

	function addItem() {
		items = [...items, { mediaId: (data.medias?.[0] as { id: string })?.id ?? '', duration: data.schedule?.playlist?.defaultDuration ?? 10 }];
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

	function daysToStr(daysOfWeek: string) {
		try {
			const d = JSON.parse(daysOfWeek || '[]') as number[];
			return d.join(',');
		} catch {
			return '0,1,2,3,4,5,6';
		}
	}
</script>

<svelte:head>
	<title>Modifier {data.schedule?.name} — Console</title>
</svelte:head>

{#if !data.schedule}
	<p class="text-slate-600">Planning non trouvé.</p>
	<a href="/admin/schedules" class="text-slate-600 underline">Retour à la planification</a>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier le planning</h1>
	<form method="POST" class="mt-6 max-w-xl space-y-4">
		{#if form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
		{/if}
		<input type="hidden" name="items" value={JSON.stringify(items)} />
		<div>
			<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
			<input id="name" name="name" type="text" required value={data.schedule.name} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div>
			<label for="targetType" class="block text-sm font-medium text-slate-700">Cible</label>
			<select id="targetType" name="targetType" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
				<option value="SCREEN" selected={data.schedule.targetType === 'SCREEN'}>Un écran</option>
				<option value="GROUP" selected={data.schedule.targetType === 'GROUP'}>Un groupe</option>
			</select>
		</div>
		<div>
			<label for="targetId" class="block text-sm font-medium text-slate-700">Écran / Groupe *</label>
			<select id="targetId" name="targetId" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
				{#each data.screens ?? [] as s}
					<option value={s.id} selected={data.schedule.targetType === 'SCREEN' && data.schedule.targetId === s.id}>{s.name}</option>
				{/each}
				<optgroup label="Groupes">
					{#each data.groups ?? [] as g}
						<option value={g.id} selected={data.schedule.targetType === 'GROUP' && data.schedule.targetId === g.id}>Groupe : {g.name}</option>
					{/each}
				</optgroup>
			</select>
		</div>

		<div>
			<div class="flex items-center justify-between">
				<span class="block text-sm font-medium text-slate-700">Médias de ce planning (ordre de lecture)</span>
				<button type="button" onclick={addItem} class="text-sm text-slate-600 hover:text-slate-900">+ Ajouter un média</button>
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

		<div>
			<label for="priority" class="block text-sm font-medium text-slate-700">Priorité (1–100)</label>
			<input id="priority" name="priority" type="number" min="1" max="100" value={data.schedule.priority} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="startDate" class="block text-sm font-medium text-slate-700">Date début</label>
				<input id="startDate" name="startDate" type="date" value={new Date(data.schedule.startDate).toISOString().slice(0, 10)} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
			<div>
				<label for="endDate" class="block text-sm font-medium text-slate-700">Date fin</label>
				<input id="endDate" name="endDate" type="date" value={new Date(data.schedule.endDate).toISOString().slice(0, 10)} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="startTime" class="block text-sm font-medium text-slate-700">Heure début</label>
				<input id="startTime" name="startTime" type="time" value={data.schedule.startTime} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
			<div>
				<label for="endTime" class="block text-sm font-medium text-slate-700">Heure fin</label>
				<input id="endTime" name="endTime" type="time" value={data.schedule.endTime} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
		</div>
		<div>
			<label for="daysOfWeek" class="block text-sm font-medium text-slate-700">Jours (0=dim… 6=sam)</label>
			<input id="daysOfWeek" name="daysOfWeek" type="text" value={daysToStr(data.schedule.daysOfWeek)} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div class="flex gap-3 pt-2">
			<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Enregistrer</button>
			<a href="/admin/schedules/{data.schedule.id}" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
		</div>
	</form>
{/if}

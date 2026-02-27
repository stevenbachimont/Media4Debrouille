<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	const form = $derived((data as { form?: { message?: string } }).form);

	const dayOptions = [
		{ value: 0, label: 'Dimanche' },
		{ value: 1, label: 'Lundi' },
		{ value: 2, label: 'Mardi' },
		{ value: 3, label: 'Mercredi' },
		{ value: 4, label: 'Jeudi' },
		{ value: 5, label: 'Vendredi' },
		{ value: 6, label: 'Samedi' }
	];

	async function refreshLists() {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Nouveau planning — Console</title>
</svelte:head>

<h1 class="text-2xl font-semibold text-slate-900">Nouveau planning</h1>
<form method="POST" class="mt-6 max-w-xl space-y-4">
	{#if form?.message}
		<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{form.message}</p>
	{/if}
	<div>
		<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
		<input id="name" name="name" type="text" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
	<div>
		<label for="targetType" class="block text-sm font-medium text-slate-700">Cible</label>
		<select id="targetType" name="targetType" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
			<option value="SCREEN">Un écran</option>
			<option value="GROUP">Un groupe</option>
		</select>
	</div>
	<div id="targetId-container">
		<label for="targetId" class="block text-sm font-medium text-slate-700">Écran / Groupe *</label>
		<div class="mt-1 flex gap-2">
			<select id="targetId" name="targetId" required class="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2">
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
		<label for="playlistId" class="block text-sm font-medium text-slate-700">Playlist *</label>
		<select id="playlistId" name="playlistId" required class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
			<option value="">Choisir une playlist</option>
			{#each data.playlists ?? [] as p}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="priority" class="block text-sm font-medium text-slate-700">Priorité (1–100)</label>
		<input id="priority" name="priority" type="number" min="1" max="100" value="50" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
	</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="startDate" class="block text-sm font-medium text-slate-700">Date début</label>
				<input id="startDate" name="startDate" type="date" value={new Date().toISOString().slice(0, 10)} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
			<div>
				<label for="endDate" class="block text-sm font-medium text-slate-700">Date fin</label>
				<input id="endDate" name="endDate" type="date" value={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)} class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
			</div>
		</div>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="startTime" class="block text-sm font-medium text-slate-700">Heure début (HH:MM)</label>
			<input id="startTime" name="startTime" type="time" value="00:00" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
		<div>
			<label for="endTime" class="block text-sm font-medium text-slate-700">Heure fin (HH:MM)</label>
			<input id="endTime" name="endTime" type="time" value="23:59" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		</div>
	</div>
	<div>
		<label class="block text-sm font-medium text-slate-700">Jours (0=dim… 6=sam)</label>
		<input name="daysOfWeek" type="text" value="0,1,2,3,4,5,6" placeholder="0,1,2,3,4,5,6" class="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
		<p class="mt-1 text-xs text-slate-500">Séparés par des virgules. 0=dimanche, 6=samedi. Par défaut : tous les jours.</p>
	</div>
	<div class="flex gap-3 pt-2">
		<button type="submit" class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Créer</button>
		<a href="/admin/schedules" class="rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Annuler</a>
	</div>
</form>

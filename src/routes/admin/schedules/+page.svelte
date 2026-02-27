<script lang="ts">
	let { data } = $props();

	function targetLabel(s: { targetType: string; targetId: string }) {
		if (s.targetType === 'SCREEN') {
			const screen = data.screens?.find((x: { id: string }) => x.id === s.targetId);
			return screen?.name ?? s.targetId;
		}
		const group = data.groups?.find((g: { id: string }) => g.id === s.targetId);
		return group ? `Groupe: ${group.name}` : s.targetId;
	}

	function daysLabel(daysOfWeek: string) {
		try {
			const d = JSON.parse(daysOfWeek || '[]') as number[];
			if (!d.length || d.length === 7) return 'Tous les jours';
			const names = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
			return d.map((i) => names[i]).join(', ');
		} catch {
			return '—';
		}
	}
</script>

<svelte:head>
	<title>Planification — Console</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-slate-900">Planification</h1>
	<a
		href="/admin/schedules/new"
		class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
		>Nouveau planning</a
	>
</div>

<div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
	<table class="min-w-full divide-y divide-slate-200">
		<thead class="bg-slate-50">
			<tr>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Nom</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Cible</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Playlist</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Priorité</th>
				<th class="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Plage</th>
				<th class="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-200">
			{#if data.schedules.length === 0}
				<tr>
					<td colspan="6" class="px-4 py-8 text-center text-slate-500">
						Aucun planning. <a href="/admin/schedules/new" class="text-slate-700 underline">En créer un</a>.
					</td>
				</tr>
			{:else}
				{#each data.schedules as s}
					<tr class="hover:bg-slate-50">
						<td class="px-4 py-3 font-medium text-slate-900">
							<a href="/admin/schedules/{s.id}" class="hover:underline">{s.name}</a>
						</td>
						<td class="px-4 py-3 text-slate-600">{targetLabel(s)}</td>
						<td class="px-4 py-3 text-slate-600">{s.playlist?.name ?? '—'}</td>
						<td class="px-4 py-3 text-slate-600">{s.priority}</td>
						<td class="px-4 py-3 text-slate-600">
							{s.startTime}–{s.endTime} · {daysLabel(s.daysOfWeek)}
						</td>
						<td class="px-4 py-3 text-right">
							<a href="/admin/schedules/{s.id}" class="text-sm text-slate-600 hover:text-slate-900">Voir</a>
							<span class="mx-2 text-slate-300">|</span>
							<a href="/admin/schedules/{s.id}/edit" class="text-sm text-slate-600 hover:text-slate-900">Modifier</a>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

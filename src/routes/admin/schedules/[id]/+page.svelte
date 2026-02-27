<script lang="ts">
	let { data } = $props();

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
	<title>{data.schedule?.name ?? 'Planning'} — Console</title>
</svelte:head>

{#if !data.schedule}
	<p class="text-slate-600">Planning non trouvé.</p>
	<a href="/admin/schedules" class="text-slate-600 underline">Retour à la planification</a>
{:else}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-slate-900">{data.schedule.name}</h1>
		<div class="flex gap-2">
			<a href="/admin/schedules/{data.schedule.id}/edit" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Modifier</a>
			<a href="/admin/schedules" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Retour</a>
		</div>
	</div>
	<dl class="mt-6 grid gap-3 sm:grid-cols-2">
		<div>
			<dt class="text-sm font-medium text-slate-500">Cible</dt>
			<dd class="mt-1 text-slate-800">{data.schedule.targetType} : {data.schedule.targetId}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Playlist</dt>
			<dd class="mt-1 text-slate-800">{data.schedule.playlist?.name ?? '—'}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Priorité</dt>
			<dd class="mt-1 text-slate-800">{data.schedule.priority}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Plage horaire</dt>
			<dd class="mt-1 text-slate-800">{data.schedule.startTime} – {data.schedule.endTime}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Jours</dt>
			<dd class="mt-1 text-slate-800">{daysLabel(data.schedule.daysOfWeek)}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Dates</dt>
			<dd class="mt-1 text-slate-800">
				{new Date(data.schedule.startDate).toLocaleDateString('fr-FR')} – {new Date(data.schedule.endDate).toLocaleDateString('fr-FR')}
			</dd>
		</div>
	</dl>
{/if}

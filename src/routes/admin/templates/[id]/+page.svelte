<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.template?.name ?? 'Template'} — Console</title>
</svelte:head>

{#if !data.template}
	<p class="text-slate-600">Template non trouvé.</p>
	<a href="/admin/templates" class="text-slate-600 underline">Retour aux templates</a>
{:else}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-slate-900">{data.template.name}</h1>
		<div class="flex gap-2">
			<a href="/admin/templates/{data.template.id}/edit" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Modifier</a>
			<a href="/admin/templates" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Retour</a>
		</div>
	</div>
	{#if data.template.description}
		<p class="mt-2 text-slate-600">{data.template.description}</p>
	{/if}
	<div class="mt-6">
		<h2 class="text-sm font-medium text-slate-500">Zones (JSON)</h2>
		<pre class="mt-1 max-h-64 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs">{JSON.stringify(JSON.parse(data.template.zonesJson || '[]'), null, 2)}</pre>
	</div>
{/if}

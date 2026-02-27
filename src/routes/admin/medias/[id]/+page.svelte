<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.media?.name ?? 'Média'} — Console</title>
</svelte:head>

{#if !data.media}
	<p class="text-slate-600">Média non trouvé.</p>
	<a href="/admin/medias" class="text-slate-600 underline">Retour à la médiathèque</a>
{:else}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-slate-900">{data.media.name}</h1>
		<div class="flex gap-2">
			<a
				href="/admin/medias/{data.media.id}/edit"
				class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>Modifier</a
			>
			<a href="/admin/medias" class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>Retour</a
			>
		</div>
	</div>

	<dl class="mt-6 grid gap-3 sm:grid-cols-2">
		<div>
			<dt class="text-sm font-medium text-slate-500">Type</dt>
			<dd class="mt-1 rounded bg-slate-100 px-2 py-1 text-sm text-slate-800">{data.media.type}</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Durée (s)</dt>
			<dd class="mt-1 text-slate-800">{data.media.duration ?? '—'}</dd>
		</div>
		<div class="sm:col-span-2">
			<dt class="text-sm font-medium text-slate-500">URL</dt>
			<dd class="mt-1 break-all text-slate-800">{data.media.url || data.media.cdnUrl || '—'}</dd>
		</div>
		<div class="sm:col-span-2">
			<dt class="text-sm font-medium text-slate-500">CDN URL</dt>
			<dd class="mt-1 break-all text-slate-800">{data.media.cdnUrl || '—'}</dd>
		</div>
	</dl>

	{#if data.media.type === 'IMAGE' && (data.media.cdnUrl || data.media.url)}
		<div class="mt-6">
			<dt class="text-sm font-medium text-slate-500">Aperçu</dt>
			<div class="mt-2 max-w-md">
				<img
					src={data.media.cdnUrl || data.media.url}
					alt={data.media.name}
					class="max-h-48 w-full rounded border border-slate-200 object-contain"
				/>
			</div>
		</div>
	{/if}
{/if}

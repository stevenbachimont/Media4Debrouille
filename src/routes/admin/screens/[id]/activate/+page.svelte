<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Activer {data.screen?.name} — Console</title>
</svelte:head>

{#if !data.screen}
	<p class="text-slate-600">Écran non trouvé.</p>
	<a href="/admin/screens" class="text-slate-600 underline">Retour aux écrans</a>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Activer l'écran : {data.screen.name}</h1>
	<p class="mt-2 text-slate-600">
		Ouvrez cette URL sur la machine du player (Chromium en kiosk). Le token est valable 24 h.
	</p>

	<div class="mt-8 flex flex-col items-start gap-8 sm:flex-row">
		{#if data.qrDataUrl}
			<div class="rounded-lg border border-slate-200 bg-white p-4">
				<img src={data.qrDataUrl} alt="QR Code d'activation" width="256" height="256" />
			</div>
		{/if}
		<div class="flex-1">
			<label for="activation-url" class="block text-sm font-medium text-slate-700">URL d'activation</label>
			<div class="mt-1 flex gap-2">
				<input
					id="activation-url"
					type="text"
					readonly
					value={data.activationUrl ?? ''}
					class="flex-1 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
				/>
				<button
					type="button"
					onclick={() => {
						if (data.activationUrl) navigator.clipboard.writeText(data.activationUrl);
					}}
					class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>
					Copier
				</button>
			</div>
		</div>
	</div>

	<p class="mt-8">
		<a href="/admin/screens/{data.screen.id}" class="text-slate-600 underline">← Retour à l'écran</a>
	</p>
{/if}

<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Modifier {data.site?.name} — Console</title>
</svelte:head>

{#if !data.site}
	<p class="text-slate-600">Site non trouvé.</p>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier le site</h1>
	<form method="POST" class="mt-6 space-y-4">
		{#if data.form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{data.form.message}</p>
		{/if}
		<div>
			<label for="name" class="block text-sm font-medium text-slate-700">Nom *</label>
			<input
				id="name"
				name="name"
				type="text"
				value={data.site.name}
				required
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="city" class="block text-sm font-medium text-slate-700">Ville</label>
			<input
				id="city"
				name="city"
				type="text"
				value={data.site.city ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="address" class="block text-sm font-medium text-slate-700">Adresse</label>
			<input
				id="address"
				name="address"
				type="text"
				value={data.site.address ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="timezone" class="block text-sm font-medium text-slate-700">Fuseau horaire</label>
			<input
				id="timezone"
				name="timezone"
				type="text"
				value={data.site.timezone ?? 'Europe/Paris'}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="contactName" class="block text-sm font-medium text-slate-700">Contact (nom)</label>
			<input
				id="contactName"
				name="contactName"
				type="text"
				value={data.site.contactName ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="contactEmail" class="block text-sm font-medium text-slate-700">Contact (email)</label>
			<input
				id="contactEmail"
				name="contactEmail"
				type="email"
				value={data.site.contactEmail ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div class="flex gap-3 pt-2">
			<button
				type="submit"
				class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
			>
				Enregistrer
			</button>
			<a
				href="/admin/sites/{data.site.id}"
				class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>Annuler</a
			>
		</div>
	</form>
{/if}

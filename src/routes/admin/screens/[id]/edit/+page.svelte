<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Modifier {data.screen?.name} — Console</title>
</svelte:head>

{#if !data.screen}
	<p class="text-slate-600">Écran non trouvé.</p>
{:else}
	<h1 class="text-2xl font-semibold text-slate-900">Modifier l'écran</h1>
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
				value={data.screen.name}
				required
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="description" class="block text-sm font-medium text-slate-700">Description</label>
			<input
				id="description"
				name="description"
				type="text"
				value={data.screen.description ?? ''}
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="groupId" class="block text-sm font-medium text-slate-700">Groupe</label>
			<select id="groupId" name="groupId" class="mt-1 w-full rounded border border-slate-300 px-3 py-2">
				<option value="">Aucun</option>
				{#each data.groups as group}
					<option value={group.id} selected={data.screen.groupId === group.id}>{group.name}</option>
				{/each}
			</select>
		</div>
		<div class="flex gap-3 pt-2">
			<button
				type="submit"
				class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
			>
				Enregistrer
			</button>
			<a
				href="/admin/screens/{data.screen.id}"
				class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>Annuler</a
			>
		</div>
	</form>
{/if}

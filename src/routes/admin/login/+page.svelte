<script lang="ts">
	// Page de connexion
	let email = $state('');
	let password = $state('');
	let { data } = $props();
</script>

<svelte:head>
	<title>Connexion — Digital Signage</title>
</svelte:head>

<div class="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<h1 class="text-xl font-semibold text-slate-900">Connexion</h1>
	<form method="POST" action="?/login" class="mt-4 space-y-4">
		{#if data.form?.message}
			<p class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{data.form.message}</p>
		{/if}
		<div>
			<label for="email" class="block text-sm font-medium text-slate-700">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				bind:value={email}
				required
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<div>
			<label for="password" class="block text-sm font-medium text-slate-700">Mot de passe</label>
			<input
				id="password"
				name="password"
				type="password"
				bind:value={password}
				required
				class="mt-1 w-full rounded border border-slate-300 px-3 py-2"
			/>
		</div>
		<button
			type="submit"
			class="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800"
		>
			Se connecter
		</button>
	</form>
</div>

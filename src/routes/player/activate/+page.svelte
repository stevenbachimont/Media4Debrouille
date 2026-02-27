<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (data.success && data.jwt && data.screenId) {
			localStorage.setItem('player_jwt', data.jwt);
			goto(`/player/${data.screenId}`);
		}
	});
</script>

<svelte:head>
	<title>Activation player — Digital Signage</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-100 p-4">
	<div class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
		{#if data.success}
			<p class="text-slate-700">Activation réussie. Redirection vers le player…</p>
			<p class="mt-4">
				<a href="/player/{data.screenId}" class="text-slate-600 underline"
					>Cliquez ici si la redirection ne fonctionne pas</a
				>
			</p>
		{:else}
			<h1 class="text-xl font-semibold text-slate-900">Activation du player</h1>
			{#if data.error}
				<p class="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{data.error}</p>
			{:else}
				<p class="mt-4 text-slate-600">
					Utilisez le lien d'activation fourni par la console (QR code ou URL avec token).
				</p>
			{/if}
		{/if}
	</div>
</div>

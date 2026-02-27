<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
</script>

<svelte:head>
	<title>Console — Digital Signage</title>
</svelte:head>

<div class="max-w-4xl">
	<h1 class="text-2xl font-semibold text-slate-900">Console d’administration</h1>
	{#if data.user}
		<p class="mt-2 text-slate-600">
			Connecté en tant que <strong>{data.user.email}</strong> (rôle: {data.user.role}).
		</p>
		<p class="mt-4 text-sm text-slate-500">
			Utilisez le menu pour gérer les sites, écrans, médias, playlists et planifications.
		</p>
	{:else}
		<p class="mt-2 text-slate-600">Redirection vers la connexion…</p>
	{/if}
</div>

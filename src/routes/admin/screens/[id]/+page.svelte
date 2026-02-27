<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let refreshStatus = $state<'idle' | 'sending' | 'ok' | 'error'>('idle');

	async function deleteScreen() {
		if (!data.screen || !confirm(`Supprimer l'écran « ${data.screen.name} » ?`)) return;
		const res = await fetch(`/api/admin/screens/${data.screen.id}`, { method: 'DELETE' });
		if (res.ok) goto('/admin/screens');
		else alert((await res.json().catch(() => ({}))).error || 'Erreur lors de la suppression');
	}

	async function refreshPlayer() {
		if (!data.screen) return;
		refreshStatus = 'sending';
		try {
			const res = await fetch(`/api/admin/screens/${data.screen.id}/command`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ command: 'RELOAD' })
			});
			if (res.ok) {
				refreshStatus = 'ok';
				setTimeout(() => (refreshStatus = 'idle'), 2000);
			} else {
				const err = await res.json().catch(() => ({}));
				refreshStatus = 'error';
				alert(err.error || 'Erreur');
				setTimeout(() => (refreshStatus = 'idle'), 2000);
			}
		} catch {
			refreshStatus = 'error';
			setTimeout(() => (refreshStatus = 'idle'), 2000);
		}
	}
</script>

<svelte:head>
	<title>{data.screen?.name ?? 'Écran'} — Console</title>
</svelte:head>

{#if !data.screen}
	<p class="text-slate-600">Écran non trouvé.</p>
	<a href="/admin/screens" class="text-slate-600 underline">Retour aux écrans</a>
{:else}
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-slate-900">{data.screen.name}</h1>
			<p class="text-slate-600">
				{data.screen.site?.name}
				{#if data.screen.group} — {data.screen.group.name}{/if}
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/admin/screens/{data.screen.id}/activate"
				class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
				>Activer cet écran</a
			>
			<button
				type="button"
				onclick={refreshPlayer}
				disabled={refreshStatus === 'sending'}
				title="Recharge la page du player (pour prendre en compte les changements de médias/planning)"
				class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
			>
				{refreshStatus === 'sending' ? 'Envoi…' : refreshStatus === 'ok' ? 'Envoyé ✓' : 'Rafraîchir le player'}
			</button>
			<a
				href="/admin/screens/{data.screen.id}/edit"
				class="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
				>Modifier</a
			>
			<button
				type="button"
				onclick={deleteScreen}
				class="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
			>
				Supprimer
			</button>
		</div>
	</div>

	<dl class="mt-8 grid gap-4 sm:grid-cols-2">
		<div>
			<dt class="text-sm font-medium text-slate-500">Statut</dt>
			<dd>
				<span
					class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium
					{data.screen.status === 'ONLINE'
						? 'bg-green-100 text-green-800'
						: data.screen.status === 'WARNING'
							? 'bg-amber-100 text-amber-800'
							: 'bg-slate-100 text-slate-600'}"
				>
					{data.screen.status ?? 'OFFLINE'}
				</span>
			</dd>
		</div>
		<div>
			<dt class="text-sm font-medium text-slate-500">Dernière activité</dt>
			<dd class="text-slate-700">
				{data.screen.lastSeen
					? new Date(data.screen.lastSeen).toLocaleString('fr-FR')
					: 'Jamais'}
			</dd>
		</div>
	</dl>

	<p class="mt-4 text-sm text-slate-500">
		<strong>Rafraîchir le player</strong> : envoie une commande au player pour recharger la page (nouveaux médias, planning). Nécessite que le player soit connecté au serveur (Socket.io actif, ex. <code class="rounded bg-slate-100 px-1">npm run start</code>).
	</p>

	<p class="mt-8">
		<a href="/admin/screens" class="text-slate-600 underline">← Retour aux écrans</a>
	</p>
{/if}

<script lang="ts">
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<nav class="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 p-4">
	<a href="/admin" class="font-medium text-slate-700 hover:text-slate-900">Console</a>
	<a
		href="/admin/sites"
		class:font-medium={$page.url.pathname.startsWith('/admin/sites')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/sites')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/sites')}
		class="hover:text-slate-900"
		>Sites</a
	>
	<a
		href="/admin/screens"
		class:font-medium={$page.url.pathname.startsWith('/admin/screens')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/screens')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/screens')}
		class="hover:text-slate-900"
		>Écrans</a
	>
	<a
		href="/admin/monitoring"
		class:font-medium={$page.url.pathname.startsWith('/admin/monitoring')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/monitoring')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/monitoring')}
		class="hover:text-slate-900"
		>Monitoring</a
	>
	<a
		href="/admin/medias"
		class:font-medium={$page.url.pathname.startsWith('/admin/medias')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/medias')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/medias')}
		class="hover:text-slate-900"
		>Médias</a
	>
	<a
		href="/admin/playlists"
		class:font-medium={$page.url.pathname.startsWith('/admin/playlists')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/playlists')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/playlists')}
		class="hover:text-slate-900"
		>Playlists</a
	>
	<a
		href="/admin/templates"
		class:font-medium={$page.url.pathname.startsWith('/admin/templates')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/templates')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/templates')}
		class="hover:text-slate-900"
		>Templates</a
	>
	<a
		href="/admin/schedules"
		class:font-medium={$page.url.pathname.startsWith('/admin/schedules')}
		class:text-slate-900={$page.url.pathname.startsWith('/admin/schedules')}
		class:text-slate-500={!$page.url.pathname.startsWith('/admin/schedules')}
		class="hover:text-slate-900"
		>Planification</a
	>
	<a href="/admin/alerts" class="text-slate-500 hover:text-slate-900">Alertes</a>
	<a href="/admin/reports" class="text-slate-500 hover:text-slate-900">Rapports</a>
	<a href="/admin/users" class="text-slate-500 hover:text-slate-900">Utilisateurs</a>
</nav>

<main class="p-6">
	{@render children()}
</main>

<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { io } from 'socket.io-client';
	import html2canvas from 'html2canvas';

	const JWT_KEY = 'player_jwt';
	const HEARTBEAT_INTERVAL_MS = 30_000;
	const FALLBACK_DURATION_MS = 10_000;

	type ScheduleItem = {
		mediaId: string;
		order: number;
		duration: number;
		type: string;
		cdnUrl: string;
		name: string;
	};

	type ScheduleData = {
		playlistId: string | null;
		version: number;
		defaultDuration: number;
		transition: string;
		items: ScheduleItem[];
	};

	let { data } = $props();
	let jwt = $state<string | null>(null);
	let screenId = $derived(data.screenId ?? '');
	let schedule = $state<ScheduleData | null>(null);
	let currentIndex = $state(0);
	let opacity = $state(1);
	let errorCount = $state(0);
	let startTime = $state(Date.now());
	let socket = $state<ReturnType<typeof io> | null>(null);
	let heartbeatTimer = $state<ReturnType<typeof setInterval> | null>(null);
	let fallbackTime = $state('');

	async function fetchSchedule(): Promise<ScheduleData | null> {
		if (!jwt || !screenId) return null;
		try {
			const res = await fetch(`/api/player/${screenId}/schedule`, {
				headers: { Authorization: `Bearer ${jwt}` }
			});
			if (!res.ok) return null;
			return await res.json();
		} catch {
			return null;
		}
	}

	function sendHeartbeatRest() {
		if (!jwt || !screenId) return;
		const uptime = Math.floor((Date.now() - startTime) / 1000);
		fetch(`/api/player/${screenId}/heartbeat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
			body: JSON.stringify({
				uptime,
				resolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
				isVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : undefined
			})
		}).catch(() => {});
	}

	function emitHeartbeat() {
		const uptime = Math.floor((Date.now() - startTime) / 1000);
		const payload = {
			uptime,
			resolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
			isVisible: typeof document !== 'undefined' ? document.visibilityState === 'visible' : undefined,
			currentPlaylistId: schedule?.playlistId ?? undefined,
			currentMediaName: schedule?.items?.[currentIndex]?.name ?? undefined
		};
		if (socket?.connected) {
			socket.emit('screen:heartbeat', payload);
		} else {
			sendHeartbeatRest();
		}
	}

	function emitError(type: string, message: string, mediaId: string) {
		if (socket?.connected) socket.emit('screen:error', { type, message, mediaId });
	}

	function nextItem() {
		if (!schedule?.items?.length) return;
		errorCount = 0;
		opacity = 0;
		setTimeout(() => {
			currentIndex = (currentIndex + 1) % schedule!.items.length;
			opacity = 1;
		}, 300);
	}

	function onMediaError(item: ScheduleItem) {
		emitError('PLAYBACK', 'Erreur de lecture', item.mediaId);
		errorCount++;
		if (errorCount >= (schedule?.items?.length ?? 0)) {
			// Tous en erreur → on reste sur fallback, pas de boucle
			return;
		}
		nextItem();
	}

	onMount(() => {
		const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(JWT_KEY) : null;
		if (!stored) {
			goto('/player/activate');
			return;
		}
		startTime = Date.now();

		(async () => {
			const s = await fetchSchedule();
			if (s) schedule = s;
		})();

		// Socket.io
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		const s = io(origin, { path: '/socket.io', auth: { token: stored }, transports: ['websocket', 'polling'] });
		socket = s;
		s.on('playlist:reload', async () => {
			const s2 = await fetchSchedule();
			if (s2) {
				schedule = s2;
				currentIndex = 0;
				opacity = 1;
			}
		});
		s.on('player:refresh', () => location.reload());
		s.on('player:screenshot', async (payload: { commandId?: string }) => {
			const commandId = payload?.commandId;
			try {
				const el = document.getElementById('player-root');
				if (!el) {
					s.emit('screen:screenshot_response', { commandId, imageBase64: null, width: 0, height: 0 });
					return;
				}
				const canvas = await html2canvas(el, {
					scale: Math.min(2, 1280 / Math.max(1, el.offsetWidth)),
					useCORS: true,
					allowTaint: true,
					logging: false
				});
				const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
				const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
				s.emit('screen:screenshot_response', {
					commandId,
					imageBase64: base64,
					width: canvas.width,
					height: canvas.height
				});
			} catch {
				s.emit('screen:screenshot_response', { commandId, imageBase64: null, width: 0, height: 0 });
			}
		});

		// Heartbeat toutes les 30s
		heartbeatTimer = setInterval(emitHeartbeat, HEARTBEAT_INTERVAL_MS);
		emitHeartbeat();

		// Horloge écran de secours
		const updateClock = () => {
			fallbackTime = new Date().toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		};
		updateClock();
		const clockTimer = setInterval(updateClock, 1000);

		return () => {
			if (heartbeatTimer) clearInterval(heartbeatTimer);
			clearInterval(clockTimer);
			s?.disconnect();
		};
	});

	// Timer pour durée par média
	$effect(() => {
		if (!schedule?.items?.length) return;
		const item = schedule.items[currentIndex];
		const durationMs = (item?.duration ?? schedule.defaultDuration) * 1000;
		const t = setInterval(() => nextItem(), durationMs);
		return () => clearInterval(t);
	});
</script>

<svelte:head>
	<title>Player — {screenId || 'Écran'}</title>
</svelte:head>

<div
	id="player-root"
	class="fixed inset-0 overflow-hidden bg-black"
	style="cursor: none;"
	role="application"
	aria-label="Player Digital Signage"
>
	{#if !jwt}
		<div class="flex h-full items-center justify-center text-white">Redirection…</div>
	{:else if schedule?.items?.length}
		<!-- Une zone, boucle FADE -->
		{#each schedule.items as item, i (item.mediaId + item.order) }
			{#if i === currentIndex}
				<div
					class="absolute inset-0 flex items-center justify-center bg-black"
					style="opacity: {opacity}; transition: opacity 0.3s ease;"
				>
					{#if item.type === 'IMAGE' || item.type === 'HTML'}
						<img
							src={item.cdnUrl}
							alt={item.name}
							class="max-h-full max-w-full object-contain"
							onerror={() => onMediaError(item)}
						/>
					{:else if item.type === 'VIDEO'}
						<video
							src={item.cdnUrl}
							class="max-h-full max-w-full object-contain"
							autoplay
							muted
							playsinline
							onerror={() => onMediaError(item)}
						></video>
					{:else if item.type === 'WEBPAGE'}
						<iframe
							title={item.name}
							src={item.cdnUrl}
							class="h-full w-full border-0"
							sandbox="allow-scripts allow-same-origin"
							onerror={() => onMediaError(item)}
						></iframe>
					{:else}
						<img
							src={item.cdnUrl}
							alt={item.name}
							class="max-h-full max-w-full object-contain"
							onerror={() => onMediaError(item)}
						/>
					{/if}
				</div>
			{/if}
		{/each}
	{:else}
		<!-- Écran de secours : heure + logo -->
		<div class="flex h-full flex-col items-center justify-center gap-6 text-white">
			<p class="text-6xl font-light tabular-nums">{fallbackTime || '--:--:--'}</p>
			<p class="text-xl text-white/80">Digital Signage</p>
		</div>
	{/if}
</div>

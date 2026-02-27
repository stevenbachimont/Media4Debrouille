import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'socket.io',
			configureServer(server) {
				const httpServer = (server as { httpServer?: import('node:http').Server }).httpServer;
				if (httpServer) {
					import('./src/lib/server/socket.ts')
						.then((m) => m.createSocketServer(httpServer))
						.catch((err) => console.warn('[socket.io] Plugin failed to attach:', err));
				}
			}
		}
	]
});

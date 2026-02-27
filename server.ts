/**
 * Custom server for production: attaches Socket.io to the SvelteKit handler.
 * Run after build: npx tsx server.ts
 * Requires: build/ (from npm run build), .env
 */
import 'dotenv/config';
import { createServer } from 'node:http';
// @ts-expect-error build output
import { handler } from './build/handler.js';
import { createSocketServer } from './src/lib/server/socket.ts';

const port = Number(process.env.PORT) || 3000;

const server = createServer(handler);
createSocketServer(server);

server.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
});

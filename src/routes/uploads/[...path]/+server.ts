import type { RequestHandler } from './$types';
import { resolveUploadFile } from '$lib/server/upload';
import { readFile } from 'node:fs/promises';

const MIME: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	mp4: 'video/mp4',
	webm: 'video/webm',
	ogv: 'video/ogg',
	mov: 'video/quicktime',
	pdf: 'application/pdf',
	ppt: 'application/vnd.ms-powerpoint',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

export const GET: RequestHandler = async (event) => {
	const pathParam = event.params.path;
	if (!pathParam || pathParam.includes('..')) {
		return new Response('Not Found', { status: 404 });
	}
	const filename = pathParam.split('/').pop() || pathParam;
	const filePath = resolveUploadFile(filename);
	if (!filePath) {
		return new Response('Not Found', { status: 404 });
	}
	const ext = filename.split('.').pop()?.toLowerCase() || '';
	const contentType = MIME[ext] || 'application/octet-stream';
	try {
		const buffer = await readFile(filePath);
		return new Response(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400'
			}
		});
	} catch {
		return new Response('Not Found', { status: 404 });
	}
};

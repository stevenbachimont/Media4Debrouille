import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';
import {
	saveUploadedFile,
	getMediaTypeFromMime
} from '$lib/server/upload';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export const POST: RequestHandler = async (event) => {
	requireAdmin(event);
	const { id } = event.params;
	const media = await prisma.media.findUnique({ where: { id } });
	if (!media) return json({ error: 'Média non trouvé' }, { status: 404 });

	let formData: FormData;
	try {
		formData = await event.request.formData();
	} catch {
		return json({ error: 'Requête multipart invalide' }, { status: 400 });
	}
	const file = formData.get('file');
	if (!file || !(file instanceof File)) {
		return json({ error: 'Champ "file" requis (fichier)' }, { status: 400 });
	}

	try {
		const { storagePath, publicUrl, mimeType, fileSize } = await saveUploadedFile(file);
		const mediaType = getMediaTypeFromMime(mimeType);
		if (!mediaType) {
			return json({ error: 'Type de fichier non reconnu' }, { status: 400 });
		}
		// Supprimer l'ancien fichier s'il était en local (s3Key sans préfixe S3)
		if (media.s3Key && !media.s3Key.startsWith('s3://')) {
			const oldPath = path.join(UPLOAD_DIR, media.s3Key);
			try {
				await unlink(oldPath);
			} catch {
				// ignorer si fichier déjà absent
			}
		}
		const updated = await prisma.media.update({
			where: { id },
			data: {
				s3Key: storagePath,
				cdnUrl: publicUrl,
				url: null,
				mimeType,
				fileSize,
				type: mediaType,
				encodingStatus: mediaType === 'VIDEO' ? 'PENDING' : null
			}
		});
		return json(updated);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Erreur lors du remplacement';
		return json({ error: message }, { status: 400 });
	}
};

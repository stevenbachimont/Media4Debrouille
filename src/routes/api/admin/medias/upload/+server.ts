import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/api-auth';
import { prisma } from '$lib/server/db';
import {
	saveUploadedFile,
	getMediaTypeFromMime
} from '$lib/server/upload';

export const POST: RequestHandler = async (event) => {
	const user = requireAdmin(event);
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
	const nameFromForm = (formData.get('name') as string)?.trim();
	const durationStr = (formData.get('duration') as string)?.trim();
	const duration = durationStr ? parseInt(durationStr, 10) : null;

	try {
		const { storagePath, publicUrl, mimeType, fileSize } = await saveUploadedFile(file);
		const mediaType = getMediaTypeFromMime(mimeType);
		if (!mediaType) {
			return json({ error: 'Type de média non reconnu' }, { status: 400 });
		}
		const name = nameFromForm || file.name || `Média ${storagePath}`;
		const media = await prisma.media.create({
			data: {
				name,
				type: mediaType,
				s3Key: storagePath,
				cdnUrl: publicUrl,
				url: null,
				fileSize,
				mimeType,
				duration: duration && duration > 0 ? duration : null,
				encodingStatus: mediaType === 'VIDEO' ? 'PENDING' : null,
				createdById: user.id
			}
		});
		return json(media);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Erreur lors de l’upload';
		return json({ error: message }, { status: 400 });
	}
};

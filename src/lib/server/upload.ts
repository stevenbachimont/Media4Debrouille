import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 Mo

const MIME_TO_TYPE: Record<string, 'IMAGE' | 'VIDEO' | 'PDF'> = {
	'image/jpeg': 'IMAGE',
	'image/png': 'IMAGE',
	'image/gif': 'IMAGE',
	'image/webp': 'IMAGE',
	'image/svg+xml': 'IMAGE',
	'video/mp4': 'VIDEO',
	'video/webm': 'VIDEO',
	'video/ogg': 'VIDEO',
	'video/quicktime': 'VIDEO',
	'application/pdf': 'PDF',
	'application/vnd.ms-powerpoint': 'PDF',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PDF'
};

const MIME_TO_EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'video/mp4': 'mp4',
	'video/webm': 'webm',
	'video/ogg': 'ogv',
	'video/quicktime': 'mov',
	'application/pdf': 'pdf',
	'application/vnd.ms-powerpoint': 'ppt',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

export function getMediaTypeFromMime(mime: string): 'IMAGE' | 'VIDEO' | 'PDF' | null {
	return MIME_TO_TYPE[mime] ?? null;
}

export function isAllowedMime(mime: string): boolean {
	return mime in MIME_TO_TYPE;
}

export function getAllowedMimes(): string[] {
	return Object.keys(MIME_TO_TYPE);
}

/** Sauvegarde un fichier uploadé. Retourne le chemin relatif (pour s3Key) et l'URL publique (pour cdnUrl). */
export async function saveUploadedFile(
	file: { arrayBuffer: () => Promise<ArrayBuffer>; size: number; type: string }
): Promise<{ storagePath: string; publicUrl: string; mimeType: string; fileSize: number }> {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('Fichier trop volumineux (max 500 Mo)');
	}
	const mime = file.type?.toLowerCase() || 'application/octet-stream';
	if (!isAllowedMime(mime)) {
		throw new Error(
			`Type de fichier non autorisé. Autorisés : images (JPEG, PNG, GIF, WebP, SVG), vidéos (MP4, WebM, OGG), PDF, PowerPoint (PPT, PPTX). Reçu : ${mime}`
		);
	}
	if (!existsSync(UPLOAD_DIR)) {
		await mkdir(UPLOAD_DIR, { recursive: true });
	}
	const ext = MIME_TO_EXT[mime] || 'bin';
	const id = randomUUID();
	const filename = `${id}.${ext}`;
	const filePath = path.join(UPLOAD_DIR, filename);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);
	const publicUrl = `/uploads/${filename}`;
	return {
		storagePath: filename,
		publicUrl,
		mimeType: mime,
		fileSize: file.size
	};
}

/** Chemin absolu du fichier à partir du nom de fichier (segment sécurisé). */
export function getUploadFilePath(filename: string): string | null {
	if (!filename || filename.includes('..') || path.isAbsolute(filename)) return null;
	const base = path.basename(filename);
	if (base !== filename) return null;
	return path.join(UPLOAD_DIR, base);
}

/** Vérifie que le fichier existe et retourne le chemin absolu. */
export function resolveUploadFile(filename: string): string | null {
	const filePath = getUploadFilePath(filename);
	if (!filePath || !existsSync(filePath)) return null;
	return filePath;
}

import { writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { UPLOAD_DIR } from './db'

export type SavedImage = { file: string; thumb: string; width: number; height: number; bytes: number }

const MAX_INPUT_BYTES = 20 * 1024 * 1024
const MAX_EDGE = 1600
const THUMB_EDGE = 480

// 统一压缩为 WebP:原图限长边 1600,缩略图 480,时间线只展示缩略图
export async function saveImage(input: File): Promise<SavedImage> {
	if (input.size > MAX_INPUT_BYTES) throw new Error('单张图片不能超过 20MB')
	const buffer = Buffer.from(await input.arrayBuffer())
	const source = sharp(buffer, { failOn: 'none' }).rotate()
	let full, thumb
	try {
		full = await source
			.clone()
			.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 82 })
			.toBuffer({ resolveWithObject: true })
		thumb = await source
			.clone()
			.resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 75 })
			.toBuffer()
	} catch {
		throw new Error(`图片 ${input.name || '未命名'} 无法解析,请换一张试试`)
	}
	const name = randomBytes(8).toString('hex')
	const file = `${name}.webp`
	const thumbFile = `${name}_t.webp`
	await Promise.all([writeFile(path.join(UPLOAD_DIR, file), full.data), writeFile(path.join(UPLOAD_DIR, thumbFile), thumb)])
	return { file, thumb: thumbFile, width: full.info.width, height: full.info.height, bytes: full.data.length }
}

export function removeImage(file: string, thumb: string): void {
	for (const name of [file, thumb]) {
		if (!/^[0-9a-f]{16}(_t)?\.webp$/.test(name)) continue
		unlink(path.join(UPLOAD_DIR, name)).catch(() => {})
	}
}

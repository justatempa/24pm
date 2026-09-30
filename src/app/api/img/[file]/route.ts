import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { UPLOAD_DIR } from '@/lib/db'

// 文件名由服务端生成(16 位 hex + 可选 _t 缩略图后缀),正则校验同时杜绝路径穿越
const NAME_RE = /^[0-9a-f]{16}(_t)?\.webp$/

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
	const { file } = await params
	if (!NAME_RE.test(file)) return new Response('Not found', { status: 404 })
	const full = path.join(UPLOAD_DIR, file)
	try {
		const data = await readFile(full)
		return new Response(new Uint8Array(data), {
			headers: {
				'Content-Type': 'image/webp',
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		})
	} catch {
		return new Response('Not found', { status: 404 })
	}
}

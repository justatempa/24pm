import { db } from './db'
import { parseTags } from './content'
import { saveImage, removeImage } from './images'
import { commentSummaries, type CommentItem } from './comments'

export const PAGE_SIZE = 20

export type PostImage = { file: string; thumb: string; width: number; height: number }
export type Post = {
	id: number
	userId: number
	username: string
	nickname: string
	visibility: 'public' | 'private'
	content: string
	createdAt: string
	tags: string[]
	images: PostImage[]
	comments: number
	previewComments: CommentItem[]
}

type PostRow = {
	id: number
	user_id: number
	username: string
	nickname: string
	visibility: string
	content: string
	created_at: string
}

type TagRow = { pid: number; name: string }
type ImageRow = { pid: number; file: string; thumb: string; width: number; height: number }

function hydrate(rows: PostRow[]): Post[] {
	if (rows.length === 0) return []
	const ids = rows.map(r => r.id)
	const ph = ids.map(() => '?').join(',')
	const tagRows = db
		.prepare(`SELECT pt.post_id AS pid, t.name AS name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id IN (${ph})`)
		.all(...ids) as unknown as TagRow[]
	const imageRows = db
		.prepare(`SELECT post_id AS pid, file, thumb, width, height FROM post_images WHERE post_id IN (${ph}) ORDER BY position, id`)
		.all(...ids) as unknown as ImageRow[]
	const { counts: commentCount, previews: previewMap } = commentSummaries(ids)
	const tagMap = new Map<number, string[]>()
	for (const r of tagRows) {
		const list = tagMap.get(r.pid) ?? []
		list.push(r.name)
		tagMap.set(r.pid, list)
	}
	const imageMap = new Map<number, PostImage[]>()
	for (const r of imageRows) {
		const list = imageMap.get(r.pid) ?? []
		list.push({ file: r.file, thumb: r.thumb, width: r.width, height: r.height })
		imageMap.set(r.pid, list)
	}
	return rows.map(r => ({
		id: r.id,
		userId: r.user_id,
		username: r.username,
		nickname: r.nickname || r.username,
		visibility: r.visibility === 'private' ? 'private' : 'public',
		content: r.content,
		createdAt: r.created_at,
		tags: tagMap.get(r.id) ?? [],
		images: imageMap.get(r.id) ?? [],
		comments: commentCount.get(r.id) ?? 0,
		previewComments: previewMap.get(r.id) ?? []
	}))
}

export function listPublicPosts(page: number): { posts: Post[]; total: number } {
	const total = (db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE visibility = 'public'`).get() as { c: number }).c
	const rows = db
		.prepare(
			`SELECT p.id, p.user_id, p.visibility, p.content, p.created_at, u.username, u.nickname
			 FROM posts p JOIN users u ON u.id = p.user_id
			 WHERE p.visibility = 'public' ORDER BY p.id DESC LIMIT ? OFFSET ?`
		)
		.all(PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as PostRow[]
	return { posts: hydrate(rows), total }
}

export function listUserPosts(userId: number, page: number): { posts: Post[]; total: number } {
	const total = (db.prepare('SELECT COUNT(*) AS c FROM posts WHERE user_id = ?').get(userId) as { c: number }).c
	const rows = db
		.prepare(
			`SELECT p.id, p.user_id, p.visibility, p.content, p.created_at, u.username, u.nickname
			 FROM posts p JOIN users u ON u.id = p.user_id
			 WHERE p.user_id = ? ORDER BY p.id DESC LIMIT ? OFFSET ?`
		)
		.all(userId, PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as PostRow[]
	return { posts: hydrate(rows), total }
}

export function listTagPosts(tag: string, viewerId: number | null, page: number): { posts: Post[]; total: number } {
	const total = (
		db
			.prepare(
				`SELECT COUNT(*) AS c FROM posts p JOIN post_tags pt ON pt.post_id = p.id JOIN tags t ON t.id = pt.tag_id
				 WHERE t.name = ? AND (p.visibility = 'public' OR p.user_id = ?)`
			)
			.get(tag, viewerId ?? -1) as { c: number }
	).c
	const rows = db
		.prepare(
			`SELECT p.id, p.user_id, p.visibility, p.content, p.created_at, u.username, u.nickname
			 FROM posts p JOIN users u ON u.id = p.user_id
			 JOIN post_tags pt ON pt.post_id = p.id JOIN tags t ON t.id = pt.tag_id
			 WHERE t.name = ? AND (p.visibility = 'public' OR p.user_id = ?)
			 ORDER BY p.id DESC LIMIT ? OFFSET ?`
		)
		.all(tag, viewerId ?? -1, PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as PostRow[]
	return { posts: hydrate(rows), total }
}

export type SearchRange = '7d' | '30d' | '1y'

const RANGE_DAYS: Record<SearchRange, number> = { '7d': 7, '30d': 30, '1y': 365 }

// LIKE 通配符转义,查询时须带 ESCAPE '\'
function escapeLike(text: string): string {
	return text.replace(/[\\%_]/g, ch => `\\${ch}`)
}

export function searchPosts(opts: {
	q?: string
	tag?: string
	range?: SearchRange
	viewerId: number | null
	page: number
}): { posts: Post[]; total: number } {
	const where = [`(p.visibility = 'public' OR p.user_id = ?)`]
	const params: (string | number)[] = [opts.viewerId ?? -1]

	// 多个关键字取交集;每个关键字命中正文或标签名都算
	const keywords = (opts.q ?? '').split(/\s+/).filter(Boolean).slice(0, 5)
	for (const kw of keywords) {
		where.push(
			`(p.content LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM post_tags kpt JOIN tags kt ON kt.id = kpt.tag_id WHERE kpt.post_id = p.id AND kt.name LIKE ? ESCAPE '\\'))`
		)
		const pattern = `%${escapeLike(kw)}%`
		params.push(pattern, pattern)
	}
	if (opts.tag) {
		where.push(`EXISTS (SELECT 1 FROM post_tags tpt JOIN tags tt ON tt.id = tpt.tag_id WHERE tpt.post_id = p.id AND tt.name = ?)`)
		params.push(opts.tag)
	}
	if (opts.range) {
		// created_at 是 UTC ISO 字符串,字典序即时间序
		where.push(`p.created_at >= ?`)
		params.push(new Date(Date.now() - RANGE_DAYS[opts.range] * 86400_000).toISOString())
	}

	const whereSql = where.join(' AND ')
	const total = (db.prepare(`SELECT COUNT(*) AS c FROM posts p WHERE ${whereSql}`).get(...params) as { c: number }).c
	const rows = db
		.prepare(
			`SELECT p.id, p.user_id, p.visibility, p.content, p.created_at, u.username, u.nickname
			 FROM posts p JOIN users u ON u.id = p.user_id
			 WHERE ${whereSql}
			 ORDER BY p.id DESC LIMIT ? OFFSET ?`
		)
		.all(...params, PAGE_SIZE, (opts.page - 1) * PAGE_SIZE) as unknown as PostRow[]
	return { posts: hydrate(rows), total }
}

// 标签下拉选项:按可见帖使用次数倒序
export function listTagOptions(viewerId: number | null): { name: string; c: number }[] {
	return db
		.prepare(
			`SELECT t.name, COUNT(*) AS c FROM tags t
			 JOIN post_tags pt ON pt.tag_id = t.id
			 JOIN posts p ON p.id = pt.post_id
			 WHERE p.visibility = 'public' OR p.user_id = ?
			 GROUP BY t.id ORDER BY c DESC, t.name`
		)
		.all(viewerId ?? -1) as unknown as { name: string; c: number }[]
}

export async function createPost(opts: {
	userId: number
	content: string
	visibility: 'public' | 'private'
	files: File[]
}): Promise<number> {
	// 先压缩图片再入库,任何一张失败则整体失败
	const saved = []
	for (const file of opts.files) saved.push(await saveImage(file))

	const info = db
		.prepare(`INSERT INTO posts (user_id, visibility, content, created_at) VALUES (?, ?, ?, ?)`)
		.run(opts.userId, opts.visibility, opts.content, new Date().toISOString())
	const postId = Number(info.lastInsertRowid)

	const insertTag = db.prepare(`INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING`)
	const findTag = db.prepare(`SELECT id FROM tags WHERE name = ?`)
	const linkTag = db.prepare(`INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`)
	for (const name of parseTags(opts.content)) {
		insertTag.run(name)
		const tag = findTag.get(name) as { id: number }
		linkTag.run(postId, tag.id)
	}

	const insertImage = db.prepare(
		`INSERT INTO post_images (post_id, file, thumb, width, height, bytes, position) VALUES (?, ?, ?, ?, ?, ?, ?)`
	)
	saved.forEach((img, i) => insertImage.run(postId, img.file, img.thumb, img.width, img.height, img.bytes, i))

	return postId
}

// 详情页取单帖:私密帖仅作者本人可见(管理员也不例外,与时间线口径一致)
export function getPostForViewer(id: number, viewer: { id: number } | null): Post | null {
	if (!Number.isInteger(id)) return null
	const row = db
		.prepare(
			`SELECT p.id, p.user_id, p.visibility, p.content, p.created_at, u.username, u.nickname
			 FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
		)
		.get(id) as unknown as PostRow | undefined
	if (!row) return null
	if (row.visibility !== 'public' && row.user_id !== viewer?.id) return null
	return hydrate([row])[0]
}

export function deletePost(postId: number, actor: { id: number; isAdmin: boolean }): boolean {
	const row = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId) as { user_id: number } | undefined
	if (!row) return false
	if (row.user_id !== actor.id && !actor.isAdmin) return false
	const images = db.prepare('SELECT file, thumb FROM post_images WHERE post_id = ?').all(postId) as unknown as {
		file: string
		thumb: string
	}[]
	db.prepare('DELETE FROM posts WHERE id = ?').run(postId) // post_tags / post_images 级联删除
	db.prepare('DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)').run()
	for (const img of images) removeImage(img.file, img.thumb)
	return true
}

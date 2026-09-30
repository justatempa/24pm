import { db } from './db'

export type CommentItem = {
	id: number
	postId: number
	userId: number
	username: string
	nickname: string
	content: string
	createdAt: string
}

type CommentRow = {
	id: number
	post_id: number
	user_id: number
	username: string
	nickname: string
	content: string
	created_at: string
}

export function listComments(postId: number): CommentItem[] {
	const rows = db
		.prepare(
			`SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.username, u.nickname
			 FROM comments c JOIN users u ON u.id = c.user_id
			 WHERE c.post_id = ? ORDER BY c.id`
		)
		.all(postId) as unknown as CommentRow[]
	return rows.map(r => ({
		id: r.id,
		postId: r.post_id,
		userId: r.user_id,
		username: r.username,
		nickname: r.nickname || r.username,
		content: r.content,
		createdAt: r.created_at
	}))
}

// 信息流内联预览:每帖最多显示几条、单条最多显示多少字
export const PREVIEW_COMMENTS = 2
const PREVIEW_MAX_CHARS = 120

export function truncateComment(content: string): string {
	return content.length > PREVIEW_MAX_CHARS ? `${content.slice(0, PREVIEW_MAX_CHARS)}…` : content
}

// 一次查出每帖评论数 + 最新几条预览(新→旧),供信息流内联展示
export function commentSummaries(postIds: number[]): {
	counts: Map<number, number>
	previews: Map<number, CommentItem[]>
} {
	const counts = new Map<number, number>()
	const previews = new Map<number, CommentItem[]>()
	if (postIds.length === 0) return { counts, previews }
	const ph = postIds.map(() => '?').join(',')
	const rows = db
		.prepare(
			`SELECT c.post_id AS pid, c.id, c.user_id, c.content, c.created_at, u.username, u.nickname
			 FROM comments c JOIN users u ON u.id = c.user_id
			 WHERE c.post_id IN (${ph}) ORDER BY c.id DESC`
		)
		.all(...postIds) as unknown as {
		pid: number
		id: number
		user_id: number
		content: string
		created_at: string
		username: string
		nickname: string
	}[]
	for (const r of rows) {
		counts.set(r.pid, (counts.get(r.pid) ?? 0) + 1)
		if ((counts.get(r.pid) ?? 0) > PREVIEW_COMMENTS) continue
		const list = previews.get(r.pid) ?? []
		list.push({
			id: r.id,
			postId: r.pid,
			userId: r.user_id,
			username: r.username,
			nickname: r.nickname || r.username,
			content: truncateComment(r.content),
			createdAt: r.created_at
		})
		previews.set(r.pid, list)
	}
	return { counts, previews }
}

export function addComment(postId: number, userId: number, content: string): number {
	const info = db
		.prepare('INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)')
		.run(postId, userId, content, new Date().toISOString())
	return Number(info.lastInsertRowid)
}

// 返回被删评论所在帖子 id,便于按路径刷新;无权限或不存在返回 null
export function deleteComment(commentId: number, actor: { id: number; isAdmin: boolean }): number | null {
	const row = db.prepare('SELECT id, post_id, user_id FROM comments WHERE id = ?').get(commentId) as
		| { id: number; post_id: number; user_id: number }
		| undefined
	if (!row) return null
	if (row.user_id !== actor.id && !actor.isAdmin) return null
	db.prepare('DELETE FROM comments WHERE id = ?').run(commentId)
	return row.post_id
}

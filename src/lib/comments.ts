import { db } from './db'
import { renderContent } from './content'

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

// 评论正文与帖子共用同一套渲染(链接、#标签# 仅作展示,不影响帖子标签聚合)
export function renderComment(content: string) {
	return renderContent(content)
}

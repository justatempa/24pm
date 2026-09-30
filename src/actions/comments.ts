'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth'
import { getPostForViewer } from '@/lib/posts'
import { addComment, deleteComment, listComments, type CommentItem } from '@/lib/comments'

export type CommentFormState = { error: string; ok: boolean }

const MAX_CONTENT = 500

// 内联“查看更多”用:返回帖子全部评论;帖子不可见返回空
export async function fetchCommentsAction(postId: number): Promise<CommentItem[]> {
	const user = await getSessionUser()
	const post = getPostForViewer(postId, user)
	if (!post) return []
	return listComments(postId)
}

export async function createCommentAction(_prev: CommentFormState, formData: FormData): Promise<CommentFormState> {
	const user = await getSessionUser()
	if (!user) return { error: '请先登录', ok: false }

	const postId = Number(formData.get('postId'))
	const content = String(formData.get('content') ?? '').trim()
	if (!Number.isInteger(postId)) return { error: '帖子不存在', ok: false }
	if (!content) return { error: '评论不能为空', ok: false }
	if (content.length > MAX_CONTENT) return { error: `评论最多 ${MAX_CONTENT} 字`, ok: false }

	// 可见性口径与详情页一致:公开帖或自己的私密帖
	const post = getPostForViewer(postId, user)
	if (!post) return { error: '帖子不存在或不可见', ok: false }

	addComment(postId, user.id, content)
	revalidatePath(`/p/${postId}`)
	revalidatePath('/', 'layout')
	return { error: '', ok: true }
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
	const user = await getSessionUser()
	if (!user) return
	const id = Number(formData.get('id'))
	if (!Number.isInteger(id)) return
	const postId = deleteComment(id, { id: user.id, isAdmin: user.isAdmin })
	if (postId !== null) {
		revalidatePath(`/p/${postId}`)
		revalidatePath('/', 'layout')
	}
}

'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth'
import { createPost, deletePost } from '@/lib/posts'

export type PostFormState = { error: string; ok: boolean }

const MAX_IMAGES = 9
const MAX_CONTENT = 2000

export async function createPostAction(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
	const user = await getSessionUser()
	if (!user) return { error: '请先登录', ok: false }

	const content = String(formData.get('content') ?? '').trim()
	const visibility = formData.get('visibility') === 'private' ? 'private' : 'public'
	const files = formData.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)

	if (!content && files.length === 0) return { error: '写点什么,或选一张图片', ok: false }
	if (content.length > MAX_CONTENT) return { error: `内容太长了,最多 ${MAX_CONTENT} 字`, ok: false }
	if (files.length > MAX_IMAGES) return { error: `一次最多 ${MAX_IMAGES} 张图片`, ok: false }

	try {
		await createPost({ userId: user.id, content, visibility, files })
	} catch (e) {
		return { error: e instanceof Error ? e.message : '发布失败,请重试', ok: false }
	}
	revalidatePath('/')
	revalidatePath('/me')
	return { error: '', ok: true }
}

export async function deletePostAction(formData: FormData): Promise<void> {
	const user = await getSessionUser()
	if (!user) return
	const id = Number(formData.get('id'))
	if (!Number.isInteger(id)) return
	deletePost(id, { id: user.id, isAdmin: user.isAdmin })
	revalidatePath('/')
	revalidatePath('/me')
}

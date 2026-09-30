'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export type ProfileState = { error: string; ok: string }

export async function updateNicknameAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
	const user = await requireUser()
	const nickname = String(formData.get('nickname') ?? '').trim()
	if (nickname.length > 20) return { error: '昵称最长 20 个字符', ok: '' }
	db.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(nickname, user.id)
	revalidatePath('/me')
	revalidatePath('/', 'layout')
	return { error: '', ok: '昵称已更新' }
}

'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { getSessionUser } from '@/lib/auth'

export type AdminState = { error: string; ok: string }

export async function createUserAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
	const admin = await getSessionUser()
	if (!admin?.isAdmin) return { error: '需要管理员权限', ok: '' }

	const username = String(formData.get('username') ?? '').trim()
	const nickname = String(formData.get('nickname') ?? '').trim()
	const password = String(formData.get('password') ?? '')
	if (!/^[a-zA-Z0-9_-]{2,20}$/.test(username)) return { error: '用户名需为 2-20 位字母、数字、_ 或 -', ok: '' }
	if (nickname.length > 20) return { error: '昵称最长 20 个字符', ok: '' }
	if (password.length < 6) return { error: '密码至少 6 位', ok: '' }
	if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return { error: '用户名已存在', ok: '' }

	db.prepare('INSERT INTO users (username, nickname, password_hash, is_admin, created_at) VALUES (?, ?, ?, 0, ?)').run(
		username,
		nickname || username,
		hashPassword(password),
		new Date().toISOString()
	)
	revalidatePath('/admin')
	return { error: '', ok: `已创建用户 ${nickname || username}` }
}

export async function toggleUserDisabledAction(formData: FormData): Promise<void> {
	const admin = await getSessionUser()
	if (!admin?.isAdmin) return
	const id = Number(formData.get('id'))
	const disabled = formData.get('disabled') === '1' ? 1 : 0
	if (!Number.isInteger(id) || id === admin.id) return // 不能禁用自己
	db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(disabled, id)
	revalidatePath('/admin')
}

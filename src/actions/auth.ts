'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth'

export type LoginState = { error: string }

const MAX_AGE_S = 30 * 24 * 3600

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
	const username = String(formData.get('username') ?? '').trim()
	const password = String(formData.get('password') ?? '')
	if (!username || !password) return { error: '请输入用户名和密码' }

	const row = db.prepare('SELECT id, password_hash, disabled FROM users WHERE username = ?').get(username) as
		| { id: number; password_hash: string; disabled: number }
		| undefined
	if (!row || !verifyPassword(password, row.password_hash)) return { error: '用户名或密码错误' }
	if (row.disabled) return { error: '该账户已被禁用' }

	const jar = await cookies()
	// Secure cookie 在纯 HTTP 下会被浏览器直接丢弃,导致登录后 session 存不住;
	// 这里跟随请求实际协议:HTTPS 反代会带 x-forwarded-proto: https,直连 HTTP 则不带
	const proto = (await headers()).get('x-forwarded-proto')?.split(',')[0].trim()
	jar.set(SESSION_COOKIE, createSessionToken(row.id), {
		httpOnly: true,
		sameSite: 'lax',
		secure: proto === 'https',
		path: '/',
		maxAge: MAX_AGE_S
	})
	redirect('/')
}

export async function logoutAction(): Promise<void> {
	;(await cookies()).delete(SESSION_COOKIE)
	redirect('/')
}

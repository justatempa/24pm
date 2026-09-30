import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-production'
export const SESSION_COOKIE = 'sid'
const MAX_AGE_S = 30 * 24 * 3600

export type SessionUser = {
	id: number
	username: string
	isAdmin: boolean
}

function sign(payload: string): string {
	return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function createSessionToken(userId: number): string {
	const payload = `${userId}.${Date.now() + MAX_AGE_S * 1000}`
	return `${payload}.${sign(payload)}`
}

function verifySessionToken(token: string): number | null {
	const parts = token.split('.')
	if (parts.length !== 3) return null
	const [uid, exp, sig] = parts
	try {
		const expected = Buffer.from(sign(`${uid}.${exp}`))
		if (!timingSafeEqual(expected, Buffer.from(sig))) return null
	} catch {
		return null
	}
	if (Number(exp) < Date.now()) return null
	return Number(uid)
}

export async function getSessionUser(): Promise<SessionUser | null> {
	const token = (await cookies()).get(SESSION_COOKIE)?.value
	if (!token) return null
	const userId = verifySessionToken(token)
	if (userId === null) return null
	const row = db.prepare('SELECT id, username, is_admin, disabled FROM users WHERE id = ?').get(userId) as
		| { id: number; username: string; is_admin: number; disabled: number }
		| undefined
	if (!row || row.disabled) return null
	return { id: row.id, username: row.username, isAdmin: row.is_admin === 1 }
}

export async function requireUser(): Promise<SessionUser> {
	const user = await getSessionUser()
	if (!user) redirect('/login')
	return user
}

export async function requireAdmin(): Promise<SessionUser> {
	const user = await requireUser()
	if (!user.isAdmin) redirect('/')
	return user
}

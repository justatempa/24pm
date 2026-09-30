import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

export function hashPassword(password: string): string {
	const salt = randomBytes(16)
	const hash = scryptSync(password, salt, 64, SCRYPT_OPTS)
	return `s1$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
	try {
		const [version, saltB64, hashB64] = stored.split('$')
		if (version !== 's1') return false
		const expected = Buffer.from(hashB64, 'base64')
		const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT_OPTS)
		return timingSafeEqual(expected, actual)
	} catch {
		return false
	}
}

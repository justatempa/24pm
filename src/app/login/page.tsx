import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = { title: '登录' }

export default async function LoginPage() {
	if (await getSessionUser()) redirect('/')
	return (
		<div className='auth-wrap'>
			<LoginForm />
		</div>
	)
}

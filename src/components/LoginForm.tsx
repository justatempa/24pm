'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '@/actions/auth'

export function LoginForm() {
	const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { error: '' })
	return (
		<form action={action} className='auth-form card rise'>
			<p className='auth-brand'>
				24<span>pm</span>
			</p>
			<h1>登录</h1>
			<p className='muted'>私有站点,账号由管理员创建。</p>
			<label>
				<span>用户名</span>
				<input name='username' autoComplete='username' required autoFocus />
			</label>
			<label>
				<span>密码</span>
				<input type='password' name='password' autoComplete='current-password' required />
			</label>
			{state.error && <p className='form-error'>{state.error}</p>}
			<button type='submit' className='btn btn-primary' disabled={pending}>
				{pending ? '登录中…' : '登录'}
			</button>
		</form>
	)
}

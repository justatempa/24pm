'use client'

import { useActionState } from 'react'
import { createUserAction, type AdminState } from '@/actions/admin'

export function AdminCreateForm() {
	const [state, action, pending] = useActionState<AdminState, FormData>(createUserAction, { error: '', ok: '' })
	return (
		<form action={action} className='admin-create card'>
			<h2>创建用户</h2>
			<div className='admin-create-row'>
				<input name='username' placeholder='用户名' required minLength={2} maxLength={20} />
				<input type='password' name='password' placeholder='初始密码(至少 6 位)' required minLength={6} />
				<button type='submit' className='btn btn-primary' disabled={pending}>
					{pending ? '创建中…' : '创建'}
				</button>
			</div>
			{state.error && <p className='form-error'>{state.error}</p>}
			{state.ok && <p className='form-ok'>{state.ok}</p>}
		</form>
	)
}

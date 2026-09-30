'use client'

import { useActionState } from 'react'
import { updateNicknameAction, type ProfileState } from '@/actions/profile'

export function NicknameForm({ nickname }: { nickname: string }) {
	const [state, action, pending] = useActionState<ProfileState, FormData>(updateNicknameAction, { error: '', ok: '' })
	return (
		<form action={action} className='card'>
			<h2 className='page-title'>昵称</h2>
			<div className='admin-create-row'>
				<input name='nickname' defaultValue={nickname} placeholder='昵称(留空用用户名)' maxLength={20} />
				<button type='submit' className='btn btn-primary btn-sm' disabled={pending}>
					{pending ? '保存中…' : '保存'}
				</button>
			</div>
			{state.error && <p className='form-error'>{state.error}</p>}
			{state.ok && <p className='form-ok'>{state.ok}</p>}
		</form>
	)
}

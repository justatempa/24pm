'use client'

import { useActionState, useEffect, useState } from 'react'
import { createCommentAction, type CommentFormState } from '@/actions/comments'

const initialState: CommentFormState = { error: '', ok: false }

export function CommentForm({ postId }: { postId: number }) {
	const [state, action, pending] = useActionState(createCommentAction, initialState)
	// 发送成功后重挂载表单以清空输入
	const [key, setKey] = useState(0)
	useEffect(() => {
		if (state.ok) setKey(k => k + 1)
	}, [state.ok])

	return (
		<form key={key} action={action} className='comment-form card'>
			<input type='hidden' name='postId' value={postId} />
			<textarea name='content' rows={2} maxLength={500} placeholder='写评论…' required />
			{state.error && <p className='form-error'>{state.error}</p>}
			<div className='comment-form-bar'>
				<button type='submit' className='btn btn-primary btn-sm' disabled={pending}>
					{pending ? '发送中…' : '评论'}
				</button>
			</div>
		</form>
	)
}

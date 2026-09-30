'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createCommentAction, type CommentFormState } from '@/actions/comments'

const initialState: CommentFormState = { error: '', ok: false }

export function CommentForm({
	postId,
	autoFocus,
	onPosted
}: {
	postId: number
	autoFocus?: boolean
	onPosted?: () => void
}) {
	const [state, action, pending] = useActionState(createCommentAction, initialState)
	// 发送成功后重挂载表单以清空输入,并通知父级刷新评论列表
	const [key, setKey] = useState(0)
	const onPostedRef = useRef(onPosted)
	useEffect(() => {
		onPostedRef.current = onPosted
	})
	useEffect(() => {
		if (state.ok) {
			setKey(k => k + 1)
			onPostedRef.current?.()
		}
	}, [state.ok])

	return (
		<form key={key} action={action} className='comment-form card'>
			<input type='hidden' name='postId' value={postId} />
			<textarea name='content' rows={2} maxLength={500} placeholder='写评论…' required autoFocus={autoFocus} />
			{state.error && <p className='form-error'>{state.error}</p>}
			<div className='comment-form-bar'>
				<button type='submit' className='btn btn-primary btn-sm' disabled={pending}>
					{pending ? '发送中…' : '评论'}
				</button>
			</div>
		</form>
	)
}

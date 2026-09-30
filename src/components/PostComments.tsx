'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChatCircle, Trash } from '@phosphor-icons/react/dist/ssr'
import { deleteCommentAction, fetchCommentsAction } from '@/actions/comments'
import { renderContent } from '@/lib/content'
import { formatTime } from '@/lib/format'
import type { CommentItem } from '@/lib/comments'
import type { SessionUser } from '@/lib/auth'
import { CommentForm } from './CommentForm'

// 信息流内联评论区:默认显示最新 1-2 条预览,可展开全部并就地评论;
// 点帖子正文进详情页,页脚按钮在本页展开评论(不跳转)
export function PostComments({
	postId,
	total,
	preview,
	viewer
}: {
	postId: number
	total: number
	preview: CommentItem[]
	viewer: SessionUser | null
}) {
	const [open, setOpen] = useState(false)
	const [focusForm, setFocusForm] = useState(false)
	const [list, setList] = useState<CommentItem[] | null>(null)
	const [pending, startTransition] = useTransition()

	const expand = (focus: boolean) => {
		setOpen(true)
		setFocusForm(focus)
		if (!list && !pending) {
			startTransition(async () => {
				setList(await fetchCommentsAction(postId))
			})
		}
	}
	const collapse = () => {
		setOpen(false)
		setFocusForm(false)
	}
	// 服务端 revalidate 只更新预览,展开态的全量列表需要重新拉取
	const refresh = () => {
		if (list) {
			startTransition(async () => {
				setList(await fetchCommentsAction(postId))
			})
		}
	}
	const remove = async (formData: FormData) => {
		await deleteCommentAction(formData)
		refresh()
	}

	const canDelete = (c: CommentItem) => !!viewer && (viewer.id === c.userId || viewer.isAdmin)

	return (
		<>
			<div className='post-foot'>
				<button
					type='button'
					className='post-comments'
					aria-expanded={open}
					onClick={() => (open ? collapse() : expand(true))}
				>
					<ChatCircle size={15} />
					{total > 0 ? `${total} 条评论` : '评论'}
				</button>
			</div>
			<div className='post-inline'>
				{!open && preview.length > 0 && (
					<ul className='comment-list preview'>
						{preview.map(c => (
							<li key={c.id} className='comment-preview'>
								<span className='comment-author'>@{c.nickname}</span>
								<div className='comment-content'>{renderContent(c.content)}</div>
							</li>
						))}
					</ul>
				)}
				{!open && total > preview.length && (
					<button type='button' className='comments-more' onClick={() => expand(false)} disabled={pending}>
						查看更多 {total - preview.length} 条评论
					</button>
				)}
				{open && (
					<>
						{list ? (
							<ul className='comment-list'>
								{list.map(c => (
									<li key={c.id} className='comment'>
										<header className='comment-head'>
											<span className='comment-author'>@{c.nickname}</span>
											<time className='post-time' dateTime={c.createdAt}>
												{formatTime(c.createdAt)}
											</time>
											{canDelete(c) && (
												<form action={remove} className='post-del'>
													<input type='hidden' name='id' value={c.id} />
													<button type='submit' className='icon-btn' aria-label='删除评论' title='删除'>
														<Trash size={13} />
													</button>
												</form>
											)}
										</header>
										<div className='comment-content'>{renderContent(c.content)}</div>
									</li>
								))}
							</ul>
						) : (
							<p className='comments-loading'>加载中…</p>
						)}
						<button type='button' className='comments-more' onClick={collapse}>
							收起评论
						</button>
						{viewer ? (
							<CommentForm postId={postId} autoFocus={focusForm} onPosted={refresh} />
						) : (
							<p className='notice'>
								<Link href='/login'>登录</Link>后才能评论。
							</p>
						)}
					</>
				)}
			</div>
		</>
	)
}

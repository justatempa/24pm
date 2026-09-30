import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Trash } from '@phosphor-icons/react/dist/ssr'
import { getSessionUser } from '@/lib/auth'
import { getPostForViewer } from '@/lib/posts'
import { listComments, renderComment } from '@/lib/comments'
import { formatTime } from '@/lib/format'
import { PostCard } from '@/components/PostCard'
import { CommentForm } from '@/components/CommentForm'
import { deleteCommentAction } from '@/actions/comments'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params
	const post = getPostForViewer(Number(id), null)
	return { title: post ? `@${post.nickname}:${post.content.slice(0, 24) || '[图片]'}` : '帖子' }
}

export default async function PostPage({ params }: Props) {
	const { id } = await params
	const viewer = await getSessionUser()
	const post = getPostForViewer(Number(id), viewer)
	if (!post) notFound()
	const comments = listComments(post.id)

	return (
		<>
			<PostCard post={post} viewer={viewer} first />
			<section className='comments'>
				<h2 className='comments-title'>{comments.length > 0 ? `${comments.length} 条评论` : '评论'}</h2>
				{comments.length > 0 && (
					<ul className='comment-list'>
						{comments.map(c => {
							const canDelete = viewer && (viewer.id === c.userId || viewer.isAdmin)
							return (
								<li key={c.id} className='comment'>
									<header className='comment-head'>
										<span className='comment-author'>@{c.nickname}</span>
										<time className='post-time' dateTime={c.createdAt}>
											{formatTime(c.createdAt)}
										</time>
										{canDelete && (
											<form action={deleteCommentAction} className='post-del'>
												<input type='hidden' name='id' value={c.id} />
												<button type='submit' className='icon-btn' aria-label='删除评论' title='删除'>
													<Trash size={13} />
												</button>
											</form>
										)}
									</header>
									<div className='comment-content'>{renderComment(c.content)}</div>
								</li>
							)
						})}
					</ul>
				)}
				{viewer ? (
					<CommentForm postId={post.id} />
				) : (
					<p className='notice'>
						<Link href='/login'>登录</Link>后才能评论。
					</p>
				)}
			</section>
		</>
	)
}

import { Fragment } from 'react'
import Link from 'next/link'
import { ChatCircle, LockSimple, Trash } from '@phosphor-icons/react/dist/ssr'
import { renderContent } from '@/lib/content'
import { formatTime, formatDate, dayKey } from '@/lib/format'
import type { Post } from '@/lib/posts'
import type { SessionUser } from '@/lib/auth'
import type { CSSProperties } from 'react'
import { deletePostAction } from '@/actions/posts'
import { PostComments } from './PostComments'

export function PostCard({
	post,
	viewer,
	delay,
	first,
	detail
}: {
	post: Post
	viewer: SessionUser | null
	delay?: CSSProperties
	first?: boolean
	detail?: boolean
}) {
	const canDelete = viewer && (viewer.id === post.userId || viewer.isAdmin)
	const gridClass = post.images.length >= 3 ? 'cols-3' : post.images.length === 2 ? 'cols-2' : 'cols-1'
	return (
		<article className={first ? 'post first rise' : 'post rise'} style={delay}>
			{/* 列表页:整卡覆盖链接,点正文进详情;图片/标签/评论区等交互元素浮在其上 */}
			{!detail && <Link href={`/p/${post.id}`} className='post-cover' aria-label='查看帖子详情' />}
			<header className='post-head'>
				<span className='post-author'>@{post.nickname}</span>
				{post.visibility === 'private' && (
					<span className='badge-private' title='仅自己可见'>
						<LockSimple size={11} weight='fill' />
						仅自己
					</span>
				)}
				<time className='post-time' dateTime={post.createdAt}>
					{formatTime(post.createdAt)}
				</time>
				{canDelete && (
					<form action={deletePostAction} className='post-del'>
						<input type='hidden' name='id' value={post.id} />
						<button type='submit' className='icon-btn' aria-label='删除帖子' title='删除'>
							<Trash size={15} />
						</button>
					</form>
				)}
			</header>
			{post.content && <div className='post-content'>{renderContent(post.content)}</div>}
			{post.images.length > 0 && (
				<div className={`post-images ${gridClass}`}>
					{post.images.map(img => (
						<a key={img.file} href={`/api/img/${img.file}`} target='_blank' className='post-image'>
							<img src={`/api/img/${img.thumb}`} width={img.width} height={img.height} alt='帖子图片' loading='lazy' />
						</a>
					))}
				</div>
			)}
			{post.tags.length > 0 && (
				<div className='post-tags'>
					{post.tags.map(tag => (
						<Link key={tag} className='tag' href={`/tag/${encodeURIComponent(tag)}`}>
							#{tag}
						</Link>
					))}
				</div>
			)}
			{detail ? (
				<div className='post-foot'>
					<a className='post-comments' href='#comments'>
						<ChatCircle size={15} />
						{post.comments > 0 ? `${post.comments} 条评论` : '评论'}
					</a>
				</div>
			) : (
				<PostComments postId={post.id} total={post.comments} preview={post.previewComments} viewer={viewer} />
			)}
		</article>
	)
}

export function PostList({ posts, viewer, empty }: { posts: Post[]; viewer: SessionUser | null; empty: string }) {
	if (posts.length === 0) return <p className='empty'>{empty}</p>
	let lastDay = ''
	return (
		<div className='feed'>
			{posts.map((post, i) => {
				const day = dayKey(post.createdAt)
				const newDay = day !== lastDay
				lastDay = day
				const delay: CSSProperties = { animationDelay: `${Math.min(i * 45, 360)}ms` }
				return (
					<Fragment key={post.id}>
						{newDay && (
							<div className='date-sep rise' style={delay}>
								{formatDate(post.createdAt)}
							</div>
						)}
						<PostCard post={post} viewer={viewer} delay={delay} first={i === 0} />
					</Fragment>
				)
			})}
		</div>
	)
}

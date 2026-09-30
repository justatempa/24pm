import type { Metadata } from 'next'
import { getSessionUser } from '@/lib/auth'
import { listTagPosts } from '@/lib/posts'
import { PostList } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { name } = await params
	return { title: `#${decodeURIComponent(name)}` }
}

export default async function TagPage({ params, searchParams }: Props) {
	const tag = decodeURIComponent((await params).name)
	const page = Math.max(1, Number((await searchParams).page) || 1)
	const user = await getSessionUser()
	const { posts, total } = listTagPosts(tag, user?.id ?? null, page)

	return (
		<>
			<h1 className='tag-title rise'>
				<span>#</span>
				{tag}
			</h1>
			<PostList posts={posts} viewer={user} empty='这个标签下还没有帖子' />
			<Pagination page={page} hasMore={page * 20 < total} basePath={`/tag/${encodeURIComponent(tag)}`} />
		</>
	)
}

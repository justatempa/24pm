import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { listUserPosts } from '@/lib/posts'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

export const metadata: Metadata = { title: '我的时间线' }

export default async function MePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
	const user = await requireUser()
	const page = Math.max(1, Number((await searchParams).page) || 1)
	const { posts, total } = listUserPosts(user.id, page)

	return (
		<>
			<Composer from='me' />
			<PostList posts={posts} viewer={user} empty='还没有发过帖子' />
			<Pagination page={page} hasMore={page * 20 < total} basePath='/me' />
		</>
	)
}

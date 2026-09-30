import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listPublicPosts } from '@/lib/posts'
import { Composer } from '@/components/Composer'
import { PostList } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
	const page = Math.max(1, Number((await searchParams).page) || 1)
	const user = await getSessionUser()
	const { posts, total } = listPublicPosts(page)

	return (
		<>
			{user ? (
				<Composer />
			) : (
				<div className='notice card'>
					这是一个私有微博,<Link href='/login'>登录</Link>后可以发帖。
				</div>
			)}
			<PostList posts={posts} viewer={user} empty='还没有公开帖子,来发第一条吧' />
			<Pagination page={page} hasMore={page * 20 < total} basePath='/' />
		</>
	)
}

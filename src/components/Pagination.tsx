import Link from 'next/link'

export function Pagination({ page, hasMore, basePath }: { page: number; hasMore: boolean; basePath: string }) {
	if (page === 1 && !hasMore) return null
	return (
		<nav className='pager'>
			{page > 1 ? (
				<Link className='btn btn-ghost btn-sm' href={`${basePath}?page=${page - 1}`}>
					← 上一页
				</Link>
			) : (
				<span />
			)}
			<span className='pager-num'>第 {page} 页</span>
			{hasMore ? (
				<Link className='btn btn-ghost btn-sm' href={`${basePath}?page=${page + 1}`}>
					下一页 →
				</Link>
			) : (
				<span />
			)}
		</nav>
	)
}

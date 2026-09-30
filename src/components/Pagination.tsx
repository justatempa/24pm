import Link from 'next/link'

export function Pagination({
	page,
	hasMore,
	basePath,
	params
}: {
	page: number
	hasMore: boolean
	basePath: string
	params?: Record<string, string>
}) {
	if (page === 1 && !hasMore) return null
	const href = (target: number) => {
		if (!params || Object.keys(params).length === 0) return `${basePath}?page=${target}`
		const us = new URLSearchParams(params)
		us.set('page', String(target))
		return `${basePath}?${us.toString()}`
	}
	return (
		<nav className='pager'>
			{page > 1 ? (
				<Link className='btn btn-ghost btn-sm' href={href(page - 1)}>
					← 上一页
				</Link>
			) : (
				<span />
			)}
			<span className='pager-num'>第 {page} 页</span>
			{hasMore ? (
				<Link className='btn btn-ghost btn-sm' href={href(page + 1)}>
					下一页 →
				</Link>
			) : (
				<span />
			)}
		</nav>
	)
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { listTagOptions, searchPosts, type SearchRange } from '@/lib/posts'
import { PostList } from '@/components/PostCard'
import { Pagination } from '@/components/Pagination'

export const metadata: Metadata = { title: '搜索' }

const RANGES: { value: SearchRange | ''; label: string }[] = [
	{ value: '', label: '全部' },
	{ value: '7d', label: '最近7天' },
	{ value: '30d', label: '最近30天' },
	{ value: '1y', label: '最近一年' }
]

type Props = { searchParams: Promise<{ q?: string; tag?: string; range?: string; page?: string }> }

export default async function SearchPage({ searchParams }: Props) {
	const sp = await searchParams
	const q = (sp.q ?? '').trim().slice(0, 100)
	const tag = (sp.tag ?? '').trim()
	const range = (RANGES.some(r => r.value === sp.range) ? sp.range : '') as SearchRange | ''
	const page = Math.max(1, Number(sp.page) || 1)

	const user = await getSessionUser()
	const viewerId = user?.id ?? null
	const tags = listTagOptions(viewerId)
	const { posts, total } = searchPosts({
		q: q || undefined,
		tag: tag || undefined,
		range: range || undefined,
		viewerId,
		page
	})

	// 时间芯片只切换 range,保留关键字和标签
	const chipHref = (value: SearchRange | '') => {
		const us = new URLSearchParams()
		if (q) us.set('q', q)
		if (tag) us.set('tag', tag)
		if (value) us.set('range', value)
		const qs = us.toString()
		return qs ? `/search?${qs}` : '/search'
	}

	// 翻页时保留全部筛选条件
	const pagerParams: Record<string, string> = {}
	if (q) pagerParams.q = q
	if (tag) pagerParams.tag = tag
	if (range) pagerParams.range = range

	return (
		<>
			<h1 className='page-title rise'>搜索</h1>
			<form className='search-form card rise' action='/search' method='get'>
				{range && <input type='hidden' name='range' value={range} />}
				<div className='search-row'>
					<input type='search' name='q' defaultValue={q} placeholder='搜索正文或 #标签…' maxLength={100} aria-label='关键字' />
					<button type='submit' className='btn btn-primary btn-sm'>
						搜索
					</button>
				</div>
				{tags.length > 0 && (
					<label className='search-tag'>
						标签
						<select name='tag' defaultValue={tag}>
							<option value=''>全部标签</option>
							{tags.map(t => (
								<option key={t.name} value={t.name}>
									#{t.name}({t.c})
								</option>
							))}
						</select>
					</label>
				)}
			</form>
			<nav className='search-chips rise' aria-label='时间范围'>
				{RANGES.map(r => (
					<Link key={r.label} href={chipHref(r.value)} className={`chip${r.value === range ? ' active' : ''}`}>
						{r.label}
					</Link>
				))}
			</nav>
			<p className='search-count'>找到 {total} 条便签</p>
			<PostList posts={posts} viewer={user} empty='没有找到相关便签' />
			<Pagination page={page} hasMore={page * 20 < total} basePath='/search' params={pagerParams} />
		</>
	)
}

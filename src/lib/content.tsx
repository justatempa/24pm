import type { ReactNode } from 'react'
import Link from 'next/link'

// 标签:#话题#(微博式,可省略收尾 #)或 #tag(Twitter 式),边界为空白或标点
// 注意:合并正则里第 1 组必须是 URL、第 2 组是标签,renderContent 按组号取值
// URL 中允许出现汉字(如维基百科路径),但遇到 CJK 标点(。、!?等)即终止,
// 避免中文后缀被吞进链接;尾部 ASCII 标点再由 URL_TRAILING 剥离
const URL_RE = /(https?:\/\/[^\s<>"'\u3000-\u303f\uff00-\uffef]+)/u
const TAG_RE = /#([^\s#]{1,40}?)(?=[\s\p{P}]|$)/gu
const TOKEN_RE = new RegExp(`${URL_RE.source}|${TAG_RE.source}`, 'gu')
const URL_TRAILING = /[.,;:!?)\]}】》'"]+$/u

export function parseTags(content: string): string[] {
	const tags: string[] = []
	for (const m of content.matchAll(TAG_RE)) {
		const tag = m[1]
		if (!tags.includes(tag)) tags.push(tag)
		if (tags.length >= 10) break
	}
	return tags
}

export function renderContent(content: string): ReactNode[] {
	const nodes: ReactNode[] = []
	let last = 0
	let key = 0
	for (const m of content.matchAll(TOKEN_RE)) {
		const idx = m.index
		if (idx > last) nodes.push(content.slice(last, idx))
		if (m[1]) {
			const url = m[1].replace(URL_TRAILING, '')
			nodes.push(
				<a key={key++} href={url} target='_blank' rel='noopener nofollow'>
					{url}
				</a>
			)
			if (url.length < m[1].length) nodes.push(m[1].slice(url.length))
		} else if (m[2]) {
			const tag = m[2]
			nodes.push(
				<Link key={key++} href={`/tag/${encodeURIComponent(tag)}`}>
					#{tag}
				</Link>
			)
		}
		last = idx + m[0].length
	}
	if (last < content.length) nodes.push(content.slice(last))
	return nodes
}

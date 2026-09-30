'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
	const pathname = usePathname()
	const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
	return (
		<Link href={href} className={[className, active ? 'active' : ''].filter(Boolean).join(' ') || undefined}>
			{children}
		</Link>
	)
}

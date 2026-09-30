import type { Metadata, Viewport } from 'next'
import { detectShell, Shell } from '@/components/Shells'
import './globals.css'

export const metadata: Metadata = {
	title: {
		default: '24pm',
		template: '%s · 24pm'
	},
	description: '个人微博'
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const variant = await detectShell()
	return (
		<html lang='zh-CN'>
			<body>
				<Shell variant={variant}>{children}</Shell>
			</body>
		</html>
	)
}

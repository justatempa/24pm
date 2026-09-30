import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'standalone',
	experimental: {
		serverActions: {
			// 帖子可携带最多 9 张图片,放宽 server action 体积限制
			bodySizeLimit: '20mb'
		}
	}
}

export default nextConfig

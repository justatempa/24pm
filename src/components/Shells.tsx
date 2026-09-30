import { headers } from 'next/headers'
import Link from 'next/link'
import { GearSix, House, MagnifyingGlass, SignIn, SignOut, User } from '@phosphor-icons/react/dist/ssr'
import { getSessionUser, type SessionUser } from '@/lib/auth'
import { logoutAction } from '@/actions/auth'
import { NavLink } from './NavLink'

export type ShellVariant = 'desktop' | 'mobile'

export async function detectShell(): Promise<ShellVariant> {
	const ua = (await headers()).get('user-agent') ?? ''
	return /Mobile|Android|iPhone|iPod|HarmonyOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ? 'mobile' : 'desktop'
}

function brand() {
	return (
		<Link href='/' className='brand'>
			24<span>pm</span>
		</Link>
	)
}

export async function Shell({ variant, children }: { variant: ShellVariant; children: React.ReactNode }) {
	const user = await getSessionUser()

	if (variant === 'mobile') {
		return (
			<div className='app shell-mobile'>
				<header className='topbar'>
					{brand()}
					{user && <span className='nav-user'>@{user.nickname}</span>}
				</header>
				<main className='main'>{children}</main>
				<nav className='tabbar'>
					<NavLink href='/' className='tab'>
						<House size={20} />
						<span>公开</span>
					</NavLink>
					<NavLink href='/search' className='tab'>
						<MagnifyingGlass size={20} />
						<span>搜索</span>
					</NavLink>
					{user && (
						<NavLink href='/me' className='tab'>
							<User size={20} />
							<span>我的</span>
						</NavLink>
					)}
					{user?.isAdmin && (
						<NavLink href='/admin' className='tab'>
							<GearSix size={20} />
							<span>管理</span>
						</NavLink>
					)}
					{user ? (
						<form action={logoutAction}>
							<button type='submit' className='tab'>
								<SignOut size={20} />
								<span>退出</span>
							</button>
						</form>
					) : (
						<NavLink href='/login' className='tab'>
							<SignIn size={20} />
							<span>登录</span>
						</NavLink>
					)}
				</nav>
			</div>
		)
	}

	return (
		<div className='app shell-desktop'>
			<header className='topbar'>
				<div className='topbar-inner'>
					{brand()}
					<nav className='nav'>
						<NavLink href='/'>公开时间线</NavLink>
						{user && <NavLink href='/me'>我的时间线</NavLink>}
						{user?.isAdmin && <NavLink href='/admin'>管理</NavLink>}
					</nav>
					<div className='nav-side'>
						<form action='/search' method='get' className='nav-search'>
							<input type='search' name='q' placeholder='搜索便签…' maxLength={100} aria-label='搜索便签' />
							<button type='submit' className='nav-search-btn' aria-label='搜索'>
								<MagnifyingGlass size={14} weight='bold' />
							</button>
						</form>
						{user ? (
							<>
								<span className='nav-user'>@{user.nickname}</span>
								<form action={logoutAction}>
									<button type='submit' className='icon-btn' aria-label='退出登录' title='退出'>
										<SignOut size={16} />
									</button>
								</form>
							</>
						) : (
							<NavLink href='/login' className='btn btn-ghost btn-sm'>
								<SignIn size={15} />
								登录
							</NavLink>
						)}
					</div>
				</div>
			</header>
			<main className='main'>{children}</main>
		</div>
	)
}

export type { SessionUser }

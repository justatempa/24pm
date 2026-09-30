import Link from 'next/link'
import { GearSix, House, MagnifyingGlass, SignIn, SignOut, User } from '@phosphor-icons/react/dist/ssr'
import { getSessionUser, type SessionUser } from '@/lib/auth'
import { logoutAction } from '@/actions/auth'
import { NavLink } from './NavLink'

function brand() {
	return (
		<Link href='/' className='brand'>
			24<span>pm</span>
		</Link>
	)
}

/*
 * 移动端与桌面端导航同时渲染,由 CSS 媒体查询按视口宽度切换(.chrome-m / .chrome-d)。
 * 不再用 UA 嗅探选壳:UA 识别不了 iPad、桌面模式等场景,会导致手机渲染桌面壳后顶栏溢出。
 */
function MobileChrome({ user }: { user: SessionUser | null }) {
	return (
		<>
			<header className='topbar topbar-m chrome-m'>
				{brand()}
				{user && <span className='nav-user'>@{user.nickname}</span>}
			</header>
			<nav className='tabbar chrome-m'>
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
		</>
	)
}

function DesktopChrome({ user }: { user: SessionUser | null }) {
	return (
		<header className='topbar chrome-d'>
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
	)
}

export async function Shell({ children }: { children: React.ReactNode }) {
	const user = await getSessionUser()

	return (
		<>
			<MobileChrome user={user} />
			<DesktopChrome user={user} />
			<main className='main'>{children}</main>
		</>
	)
}

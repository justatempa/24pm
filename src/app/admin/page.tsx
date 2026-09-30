import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { formatTime } from '@/lib/format'
import { AdminCreateForm } from '@/components/AdminCreateForm'
import { toggleUserDisabledAction, updateUserNicknameAction } from '@/actions/admin'

export const metadata: Metadata = { title: '管理' }

type UserRow = { id: number; username: string; nickname: string; is_admin: number; disabled: number; created_at: string; posts: number }

export default async function AdminPage() {
	const admin = await requireAdmin()
	const users = db
		.prepare(
			`SELECT u.id, u.username, u.nickname, u.is_admin, u.disabled, u.created_at, COUNT(p.id) AS posts
			 FROM users u LEFT JOIN posts p ON p.user_id = u.id
			 GROUP BY u.id ORDER BY u.id`
		)
		.all() as unknown as UserRow[]

	return (
		<>
			<AdminCreateForm />
			<h2 className='page-title'>用户</h2>
			<div className='admin-table card'>
				<table>
					<thead>
						<tr>
							<th>用户名</th>
							<th>昵称</th>
							<th>角色</th>
							<th>帖子</th>
							<th>状态</th>
							<th>创建时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{users.map(u => (
							<tr key={u.id} className={u.disabled ? 'row-disabled' : ''}>
								<td>{u.username}</td>
								<td>
									<details className='nick-set'>
										<summary title='点击修改昵称'>{u.nickname || u.username}</summary>
										<form action={updateUserNicknameAction}>
											<input type='hidden' name='id' value={u.id} />
											<input name='nickname' defaultValue={u.nickname || u.username} maxLength={20} aria-label={`${u.username} 的昵称`} />
											<button type='submit' className='btn-link'>保存</button>
										</form>
									</details>
								</td>
								<td>{u.is_admin ? '管理员' : '用户'}</td>
								<td>{u.posts}</td>
								<td>{u.disabled ? <span className='badge badge-disabled'>已禁用</span> : <span className='badge badge-ok'>正常</span>}</td>
								<td>{formatTime(u.created_at)}</td>
								<td>
									{u.id !== admin.id && (
										<form action={toggleUserDisabledAction}>
											<input type='hidden' name='id' value={u.id} />
											<input type='hidden' name='disabled' value={u.disabled ? '0' : '1'} />
											<button type='submit' className='btn-link'>
												{u.disabled ? '启用' : '禁用'}
											</button>
										</form>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</>
	)
}

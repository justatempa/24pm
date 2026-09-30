export function formatTime(iso: string): string {
	const then = new Date(iso).getTime()
	if (Number.isNaN(then)) return iso
	const diff = Date.now() - then
	if (diff < 60_000) return '刚刚'
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
	if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
	const d = new Date(then)
	const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
	if (d.getFullYear() === new Date().getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${hm}`
}

// 时间线按本地日历日分组
export function dayKey(iso: string): string {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return iso
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatDate(iso: string): string {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return iso
	const week = `周${WEEKDAYS[d.getDay()]}`
	if (d.getFullYear() === new Date().getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${week}`
	return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${week}`
}

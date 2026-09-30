import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { hashPassword } from './password'

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE COLLATE NOCASE,
	password_hash TEXT NOT NULL,
	is_admin INTEGER NOT NULL DEFAULT 0,
	disabled INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL REFERENCES users(id),
	visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
	content TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_public ON posts(visibility, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, id DESC);
CREATE TABLE IF NOT EXISTS tags (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS post_tags (
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	tag_id INTEGER NOT NULL REFERENCES tags(id),
	PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id);
CREATE TABLE IF NOT EXISTS post_images (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	file TEXT NOT NULL,
	thumb TEXT NOT NULL,
	width INTEGER NOT NULL,
	height INTEGER NOT NULL,
	bytes INTEGER NOT NULL,
	position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images(post_id);
CREATE TABLE IF NOT EXISTS comments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
	user_id INTEGER NOT NULL REFERENCES users(id),
	content TEXT NOT NULL,
	created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, id);
`

function openDb(): DatabaseSync {
	mkdirSync(UPLOAD_DIR, { recursive: true })
	const dbFile = path.join(DATA_DIR, 'app.db')
	let db: DatabaseSync
	try {
		db = new DatabaseSync(dbFile)
	} catch (err) {
		console.error(`SQLite 打开失败: ${dbFile} (DATA_DIR=${DATA_DIR}, 请检查目录是否存在/可写、磁盘是否已满)`, err)
		throw err
	}
	db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
	db.exec(SCHEMA)
	const row = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }
	if (row.c === 0) {
		db.prepare('INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, 1, ?)').run(
			'hello',
			hashPassword(process.env.ADMIN_PASSWORD || 'mm@9527'),
			new Date().toISOString()
		)
	}
	return db
}

// 开发模式 HMR 会重复执行模块,用全局单例避免打开多个连接
const globalStore = globalThis as unknown as { __appDb?: DatabaseSync }
export const db: DatabaseSync = globalStore.__appDb ?? (globalStore.__appDb = openDb())

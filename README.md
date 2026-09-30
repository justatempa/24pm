# 24pm

精简的个人微博:发布公开或仅自己可见的帖子,支持标签、链接和图片(自动压缩)。
桌面与移动端两套界面按设备自动切换。

技术栈:Next.js 16(App Router + Server Actions)· React 19 · SQLite(Node 24 内置 `node:sqlite`,零原生依赖)· sharp 图片压缩。

## 快速开始

```bash
pnpm i
pnpm dev        # http://localhost:3000
```

首次启动自动在 `data/` 下建库,并创建管理员账号:

- 用户名 `hello`
- 密码 `mm@9527`(可用环境变量 `ADMIN_PASSWORD` 覆盖,仅首次建库时生效)

登录后进入 `/admin` 创建其他用户。**没有开放注册**,账号一律由管理员创建,也可在后台禁用/启用。

## 功能

- **发帖**:文字(最多 2000 字,支持 0-9 张图片)、可见性(公开 / 仅自己)、删除自己的帖子;选图后有缩略图预览,可逐张移除
- **评论**:帖子详情页 `/p/帖子id` 评论,可见性跟随帖子(公开帖人人可读,登录才能评论;私密帖仅本人);作者和管理员可删评
- **标签**:正文中写 `#标签#`(微博式,收尾 `#` 可省略)或 `#tag`,自动聚合到 `/tag/标签名`
- **链接**:正文中的 URL 自动识别为外链
- **时间线**:`/` 公开时间线(游客可见),`/me` 个人时间线(含私密帖,私密帖带徽章);游客与禁用账户不可见私密内容
- **图片**:上传时用 sharp 压缩——长边限 1600px 输出 WebP(质量 82),另生成 480px 缩略图;时间线只展示缩略图,点击查看全图
- **两套界面**:服务端按 User-Agent 选择桌面外壳(顶栏导航)或移动外壳(底部标签栏 + 安全区适配),共用同一套数据层与组件

## 环境变量(见 `.env.example`)

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `DATA_DIR` | 数据目录(SQLite 数据库 + 图片) | `./data` |
| `SESSION_SECRET` | 会话 Cookie 签名密钥,生产环境必须设置 | 开发用临时值 |
| `ADMIN_PASSWORD` | 管理员初始密码(仅首次建库生效) | `mm@9527` |

## 生产部署

SQLite 与图片存本地磁盘,适合自己的服务器 / NAS / Docker,不适合 Vercel 这类无持久文件系统的平台:

```bash
pnpm build
SESSION_SECRET=随机长字符串 DATA_DIR=/var/lib/24pm pnpm start
```

## 结构

```
src/lib/db.ts        建库、建表、种子管理员
src/lib/auth.ts      会话(HMAC 签名 Cookie)+ scrypt 密码散列
src/lib/posts.ts     帖子查询 / 发布 / 删除
src/lib/comments.ts  评论查询 / 增删
src/lib/images.ts    sharp 压缩管线(WebP 全图 + 缩略图)
src/lib/content.tsx  正文渲染:标签、链接分词
src/actions/         Server Actions:登录、发帖、删帖、评论、后台管理
src/components/      Shell(桌面/移动)、Composer、PostCard、CommentForm 等
src/app/             页面:/、/login、/me、/p/[id]、/tag/[name]、/admin、/api/img/[file]
```

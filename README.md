# minimal-next

一个最小的 Next.js 项目，推送到 GitHub 后会自动部署到 Vercel。

## 本地开发

```bash
pnpm i
pnpm dev
```

打开 http://localhost:3000

## 构建

```bash
pnpm build
```

## 部署

Vercel 导入该 GitHub 仓库即可，无需任何环境变量和额外配置（框架预设 Next.js，构建命令 `next build`）。

## 结构

```
src/app/layout.tsx   根布局（html/body、metadata）
src/app/page.tsx     首页（你好）
src/app/globals.css  全局样式
```

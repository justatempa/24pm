FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@12

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS proddeps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production \
	PORT=3000 \
	HOSTNAME=0.0.0.0 \
	NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Next standalone 的依赖追踪(pnpm 布局)会漏掉 sharp 的平台二进制(@img/*),
# 导致运行时 require("sharp") 报错,这里把完整的生产 node_modules 拷进运行层
COPY --from=proddeps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "server.js"]

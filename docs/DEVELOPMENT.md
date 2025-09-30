# TMatrix Lite 开发指南

**版本**: v1.0
**日期**: 2025-09-30

---

## 一、开发环境搭建

### 1.1 系统要求

- **Node.js**: >= 18.17.0 (推荐 20.x LTS)
- **pnpm**: >= 8.0.0
- **Git**: >= 2.30.0
- **编辑器**: VS Code (推荐)

### 1.2 克隆项目

```bash
# 克隆仓库
git clone git@github.com:sit-in/tmatrix.git
cd tmatrix

# 安装依赖
pnpm install

# 复制环境变量模板
cp .env.example .env.local
```

### 1.3 VS Code 配置

**推荐扩展**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "mikestead.dotenv"
  ]
}
```

**设置**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 二、项目结构

```
tmatrix/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证相关页面组
│   │   ├── login/
│   │   └── register/
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── drafts/
│   │   ├── metrics/
│   │   ├── ai/
│   │   ├── twitter/
│   │   └── cron/
│   ├── content/             # 内容管理页
│   ├── data/                # 数据追踪页
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # Dashboard
│   └── globals.css          # 全局样式
│
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── layout/              # 布局组件
│   │   └── navbar.tsx
│   ├── content/             # 内容管理组件
│   ├── data/                # 数据追踪组件
│   └── dashboard/           # Dashboard 组件
│
├── lib/                     # 核心逻辑
│   ├── supabase/            # Supabase 客户端
│   │   ├── client.ts        # 浏览器端
│   │   ├── server.ts        # 服务端
│   │   └── migrations/      # 数据库迁移
│   ├── ai/                  # AI 服务
│   │   ├── content-generator.ts
│   │   └── prompts.ts
│   ├── twitter/             # Twitter 服务
│   │   ├── client.ts
│   │   └── sync-metrics.ts
│   ├── store.ts             # Zustand store
│   ├── utils.ts             # 工具函数
│   └── types.ts             # TypeScript 类型
│
├── hooks/                   # 自定义 Hooks
│   ├── use-auth.ts
│   ├── use-drafts.ts
│   └── use-metrics.ts
│
├── docs/                    # 文档
│   ├── UPGRADE_PLAN.md      # 升级方案
│   ├── ARCHITECTURE.md      # 技术架构
│   ├── DEVELOPMENT.md       # 本文档
│   └── API.md               # API 文档
│
├── public/                  # 静态资源
├── styles/                  # 额外样式
├── .env.example             # 环境变量模板
├── .env.local               # 本地环境变量 (不提交)
├── next.config.mjs          # Next.js 配置
├── tailwind.config.ts       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
├── package.json
└── README.md
```

---

## 三、核心开发流程

### 3.1 启动开发服务器

```bash
# 启动开发服务器 (http://localhost:3000)
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

### 3.2 数据库开发流程

#### 本地开发 (使用 Supabase Local)

```bash
# 安装 Supabase CLI
brew install supabase/tap/supabase

# 启动本地 Supabase
supabase start

# 创建新迁移
supabase migration new add_new_table

# 应用迁移
supabase db reset

# 查看数据库
supabase db diff
```

#### 使用远程 Supabase

1. 登录 https://supabase.com
2. 创建新项目
3. 复制连接信息到 `.env.local`
4. 在 Supabase Dashboard 的 SQL Editor 运行迁移脚本

### 3.3 API 开发流程

#### 创建新 API 端点

```typescript
// app/api/example/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // 1. 认证
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // 2. 业务逻辑
    const { data } = await supabase
      .from('your_table')
      .select('*')
      .eq('user_id', user.id)

    // 3. 返回响应
    return NextResponse.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

#### API 测试

```bash
# 使用 curl
curl -X GET http://localhost:3000/api/example \
  -H "Authorization: Bearer YOUR_TOKEN"

# 使用 httpie (推荐)
http GET localhost:3000/api/example \
  Authorization:"Bearer YOUR_TOKEN"
```

---

## 四、组件开发规范

### 4.1 组件结构

```typescript
// components/example/example-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ExampleCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ExampleCard({ title, children, className }: ExampleCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

### 4.2 使用 shadcn/ui

```bash
# 添加新组件
pnpx shadcn@latest add button
pnpx shadcn@latest add card
pnpx shadcn@latest add dialog

# 列出可用组件
pnpx shadcn@latest add
```

### 4.3 状态管理

#### 全局状态 (Zustand)

```typescript
// lib/store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  count: number
  increment: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'app-storage',
    }
  )
)
```

#### 服务端数据 (React Query)

```typescript
// hooks/use-drafts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useDrafts() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const createDraft = useMutation({
    mutationFn: async (draft: Draft) => {
      const { data } = await supabase.from('drafts').insert(draft).select().single()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] })
    },
  })

  return { drafts: data, isLoading, createDraft }
}
```

---

## 五、AI 集成开发

### 5.1 OpenAI 配置

```typescript
// lib/ai/client.ts

import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 测试连接
async function testConnection() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say "Hello"' }],
  })
  console.log(completion.choices[0].message.content)
}
```

### 5.2 Prompt 工程

```typescript
// lib/ai/prompts.ts

export const CONTENT_GENERATION_PROMPT = {
  system: `You are a Twitter growth expert who creates viral tweets.
Your tweets are:
- Data-driven with real numbers
- Actionable and specific
- Under 280 characters
- Engaging and shareable`,

  user: (params: { idea: string; template: string; variant: string }) => `
Create a Twitter post:

Idea: ${params.idea}
Template: ${params.template}
Style: ${params.variant}

Output only the tweet, no explanations.
`,
}
```

### 5.3 流式响应 (可选)

```typescript
// app/api/ai/stream/route.ts

import { OpenAIStream, StreamingTextResponse } from 'ai'
import { openai } from '@/lib/ai/client'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

---

## 六、Twitter API 集成

### 6.1 OAuth 2.0 流程

```typescript
// app/api/twitter/auth/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', process.env.TWITTER_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', process.env.TWITTER_REDIRECT_URI!)
  authUrl.searchParams.set('scope', 'tweet.read users.read offline.access')
  authUrl.searchParams.set('state', 'random-state-string')
  authUrl.searchParams.set('code_challenge', 'challenge')
  authUrl.searchParams.set('code_challenge_method', 'plain')

  return NextResponse.redirect(authUrl.toString())
}
```

### 6.2 获取推文数据

```typescript
// lib/twitter/client.ts

import { TwitterApi } from 'twitter-api-v2'

export async function getTweetMetrics(tweetId: string, accessToken: string) {
  const client = new TwitterApi(accessToken)

  const tweet = await client.v2.singleTweet(tweetId, {
    'tweet.fields': ['public_metrics', 'created_at'],
  })

  return {
    impressions: tweet.data.public_metrics?.impression_count || 0,
    likes: tweet.data.public_metrics?.like_count || 0,
    replies: tweet.data.public_metrics?.reply_count || 0,
    retweets: tweet.data.public_metrics?.retweet_count || 0,
    bookmarks: tweet.data.public_metrics?.bookmark_count || 0,
  }
}
```

---

## 七、测试

### 7.1 单元测试 (Vitest)

```bash
# 安装测试依赖
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// __tests__/lib/utils.test.ts

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})
```

### 7.2 集成测试

```typescript
// __tests__/api/drafts.test.ts

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('/api/drafts', () => {
  let supabase: any
  let user: any

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 创建测试用户
    const { data } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    })
    user = data.user
  })

  it('should create a draft', async () => {
    const response = await fetch('http://localhost:3000/api/drafts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`,
      },
      body: JSON.stringify({
        content: 'Test tweet',
        lang: 'zh',
        variant: 'A',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

### 7.3 E2E 测试 (Playwright)

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

```typescript
// e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test'

test('should display dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await expect(page.getByText('新增关注')).toBeVisible()
  await expect(page.getByText('微信引流')).toBeVisible()
  await expect(page.getByText('已发推文')).toBeVisible()
})

test('should create a draft', async ({ page }) => {
  await page.goto('http://localhost:3000/content')

  await page.getByRole('button', { name: '新Idea' }).click()
  await page.getByLabel('Idea').fill('Test idea')
  await page.getByRole('button', { name: '保存' }).click()

  await expect(page.getByText('Test idea')).toBeVisible()
})
```

---

## 八、调试技巧

### 8.1 调试 API

```typescript
// 在 API route 中添加日志
console.log('Request:', { method: request.method, url: request.url })
console.log('Body:', await request.json())

// 使用 Vercel Dev Tools (生产环境)
import { logger } from '@/lib/logger'
logger.info('Draft created', { draftId: draft.id })
```

### 8.2 调试 Supabase

```typescript
// 打印 SQL 查询
const { data, error } = await supabase
  .from('drafts')
  .select('*')
  .explain({ analyze: true })

console.log('Query plan:', data)
```

### 8.3 调试 React 组件

```typescript
// 使用 React DevTools Profiler
import { Profiler } from 'react'

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number
) {
  console.log(`${id} (${phase}): ${actualDuration}ms`)
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>
```

---

## 九、代码风格

### 9.1 TypeScript 规范

```typescript
// ✅ 好的实践
interface User {
  id: string
  email: string
}

async function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 避免
function getUser(id: any): any {
  // ...
}
```

### 9.2 React 规范

```typescript
// ✅ 使用函数组件
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>
}

// ✅ 提取复杂逻辑到 hooks
function useComplexLogic() {
  const [state, setState] = useState()
  // ...
  return { state, action }
}

// ❌ 避免类组件 (除非必要)
class MyComponent extends React.Component {
  // ...
}
```

### 9.3 命名规范

```typescript
// 组件: PascalCase
export function UserCard() {}

// 函数: camelCase
function getUserData() {}

// 常量: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'

// 类型: PascalCase
interface UserProfile {}
type Status = 'active' | 'inactive'

// 文件名: kebab-case
// user-profile.tsx
// api-client.ts
```

---

## 十、性能优化

### 10.1 React 优化

```typescript
// 使用 memo 避免不必要的重渲染
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### 10.2 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_drafts_user_status ON drafts(user_id, status);

-- 使用 EXPLAIN ANALYZE 分析查询
EXPLAIN ANALYZE
SELECT * FROM drafts WHERE user_id = 'xxx' AND status = 'posted';
```

### 10.3 图片优化

```typescript
// 使用 next/image
import Image from 'next/image'

<Image
  src="/placeholder.jpg"
  alt="Placeholder"
  width={500}
  height={300}
  priority // 首屏图片
  loading="lazy" // 懒加载
/>
```

---

## 十一、常见问题

### Q1: pnpm install 失败

```bash
# 清理缓存
pnpm store prune
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### Q2: Supabase 连接失败

```bash
# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 测试连接
curl https://your-project.supabase.co/rest/v1/
```

### Q3: TypeScript 类型错误

```bash
# 重新生成类型
pnpm tsc --noEmit

# 清理 .next 缓存
rm -rf .next
```

### Q4: Hot reload 不工作

```bash
# 重启开发服务器
# Ctrl+C 然后
pnpm dev
```

---

## 十二、Git 工作流

### 12.1 分支策略

```
main          # 生产分支 (保护分支)
  ↓
develop       # 开发分支
  ↓
feature/*     # 功能分支
hotfix/*      # 紧急修复
```

### 12.2 Commit 规范

```bash
# 格式: <type>(<scope>): <subject>

# 类型:
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具

# 示例:
git commit -m "feat(content): add AI content generation"
git commit -m "fix(api): handle rate limit error"
git commit -m "docs: update API documentation"
```

### 12.3 Pull Request 流程

1. 创建功能分支
```bash
git checkout -b feature/ai-generation
```

2. 开发并提交
```bash
git add .
git commit -m "feat(ai): implement content generation"
```

3. 推送到远程
```bash
git push origin feature/ai-generation
```

4. 在 GitHub 创建 Pull Request
5. 代码审查
6. 合并到 develop

---

## 十三、部署流程

### 13.1 本地测试生产构建

```bash
# 构建
pnpm build

# 测试生产版本
pnpm start

# 检查构建产物
ls -lh .next/
```

### 13.2 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod

# 查看部署日志
vercel logs
```

### 13.3 环境变量配置

在 Vercel Dashboard:
1. 进入项目 Settings > Environment Variables
2. 添加所有 `.env.local` 中的变量
3. 分别配置 Production / Preview / Development
4. 重新部署

---

## 十四、监控和日志

### 14.1 Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 14.2 错误追踪 (Sentry)

```bash
pnpm add @sentry/nextjs
pnpx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

## 十五、资源链接

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://zustand-demo.pmnd.rs
- **React Query**: https://tanstack.com/query/latest
- **Twitter API**: https://developer.twitter.com/en/docs
- **OpenAI API**: https://platform.openai.com/docs

---

**快速开始**: 复制这些命令开始开发

```bash
git clone git@github.com:sit-in/tmatrix.git
cd tmatrix
pnpm install
cp .env.example .env.local
# 编辑 .env.local 填入你的密钥
pnpm dev
# 打开 http://localhost:3000
```

---

END OF DOCUMENT
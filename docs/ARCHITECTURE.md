# TMatrix Lite 技术架构文档

**版本**: v1.0
**日期**: 2025-09-30
**状态**: 架构设计中

---

## 一、架构概览

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │   Content    │  │    Data      │          │
│  │   仪表盘     │  │   内容管理    │  │   数据追踪   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│           │                 │                 │                  │
│           └─────────────────┴─────────────────┘                 │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Zustand State Management                    │      │
│  │  - templates, ideas, drafts, metrics, dailyTasks     │      │
│  └──────────────────────────────────────────────────────┘      │
└───────────────────────────────┬─────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                       API 路由层 (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ /api/drafts │  │ /api/metrics│  │  /api/ai    │            │
│  │ CRUD操作    │  │ 数据同步    │  │  内容生成   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │/api/twitter │  │ /api/auth   │  │ /api/cron   │            │
│  │ Twitter集成 │  │ 用户认证    │  │ 定时任务    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└───────────────────────────────┬─────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                          服务层                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Supabase Client  │  │  AI Service      │                    │
│  │ - Auth           │  │  - OpenAI/Claude │                    │
│  │ - Database       │  │  - Prompt Eng    │                    │
│  │ - Storage        │  │  - Content Gen   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Twitter Service  │  │  Queue Service   │                    │
│  │ - OAuth 2.0      │  │  - Cron Jobs     │                    │
│  │ - Metrics Sync   │  │  - Webhooks      │                    │
│  └──────────────────┘  └──────────────────┘                    │
└───────────────────────────────┬─────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    数据持久层 (Supabase)                         │
│  ┌──────────────────────────────────────────────────┐          │
│  │              PostgreSQL Database                  │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │          │
│  │  │  users   │  │templates │  │  ideas   │       │          │
│  │  └──────────┘  └──────────┘  └──────────┘       │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │          │
│  │  │  drafts  │  │ metrics  │  │daily_task│       │          │
│  │  └──────────┘  └──────────┘  └──────────┘       │          │
│  └──────────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────────┐          │
│  │           Supabase Storage (文件存储)            │          │
│  │  - 用户头像                                       │          │
│  │  - 推文截图                                       │          │
│  │  - 导出文件                                       │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        外部服务                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ OpenAI API   │  │ Twitter API  │  │ Vercel Edge  │         │
│  │ GPT-4o-mini  │  │ v2 API       │  │ Functions    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈详解

#### 前端
- **框架**: Next.js 15.2.4 (App Router)
- **语言**: TypeScript 5.x (严格模式)
- **UI库**:
  - Radix UI (无样式组件)
  - shadcn/ui (预构建组件)
  - Tailwind CSS 4.x (样式)
- **状态管理**: Zustand + zustand/middleware/persist
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **日期**: date-fns
- **图标**: Lucide React

#### 后端
- **API**: Next.js API Routes
- **数据库**: PostgreSQL (via Supabase)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **缓存**: React Query (TanStack Query)

#### 外部服务
- **AI**: OpenAI GPT-4o-mini / Claude 3.5 Sonnet
- **Twitter**: Twitter API v2
- **部署**: Vercel
- **监控**: Vercel Analytics
- **错误追踪**: Sentry (可选)

---

## 二、数据模型设计

### 2.1 ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  templates  │       │    ideas    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ id (PK)     │
│ email       │   │   │ user_id (FK)│───┘   │ user_id (FK)│───┐
│ twitter_u   │   │   │ title       │       │ source_type │   │
│ twitter_tkn │   │   │ lang        │       │ source      │   │
│ openai_key  │   │   │ category    │       │ tags[]      │   │
│ created_at  │   │   │ variables   │       │ created_at  │   │
└─────────────┘   │   │ body        │       └─────────────┘   │
                  │   └─────────────┘                         │
                  │                                            │
                  │   ┌─────────────┐                         │
                  └───│   drafts    │                         │
                      ├─────────────┤                         │
                      │ id (PK)     │                         │
                      │ user_id (FK)│─────────────────────────┘
                      │ idea_id (FK)│
                      │ template_id │
                      │ lang        │
                      │ variant     │
                      │ content     │
                      │ status      │
                      │ scheduled_at│
                      │ posted_at   │
                      │ tweet_id    │
                      │ is_viral    │
                      └─────────────┘
                            │
                            │
                      ┌─────────────┐
                      │   metrics   │
                      ├─────────────┤
                      │ id (PK)     │
                      │ draft_id(FK)│
                      │ date        │
                      │ impressions │
                      │ likes       │
                      │ replies     │
                      │ reposts     │
                      │ bookmarks   │
                      │ link_clicks │
                      │ est_follows │
                      │ synced      │
                      └─────────────┘

                  ┌───────────────┐
                  │ daily_tasks   │
                  ├───────────────┤
                  │ id (PK)       │
                  │ user_id (FK)  │───┐
                  │ date          │   │
                  │ items (JSON)  │   │
                  │ goal (JSON)   │   │
                  │ lead_count    │   │
                  └───────────────┘   │
                                      │
                                      └─── user_id references users.id
```

### 2.2 核心表设计

#### users (用户表)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  twitter_username TEXT,
  twitter_access_token TEXT, -- 加密存储
  twitter_refresh_token TEXT, -- 加密存储
  openai_api_key TEXT, -- 加密存储
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS策略: 用户只能访问自己的数据
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
```

#### templates (模板表)
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  category TEXT NOT NULL, -- case, tools, experience, data, interaction
  variables JSONB NOT NULL DEFAULT '{}',
  body TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE, -- 是否公开给其他用户
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_lang ON templates(lang);
CREATE INDEX idx_templates_category ON templates(category);

-- RLS: 用户可以看自己的+公开的模板
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own and public templates" ON templates
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);
CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (user_id = auth.uid());
```

#### ideas (Idea收集箱)
```sql
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('link', 'text')),
  source TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ideas_user_id ON ideas(user_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ideas" ON ideas FOR ALL USING (user_id = auth.uid());
```

#### drafts (草稿表)
```sql
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT REFERENCES ideas(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'EN')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  twitter_tweet_id TEXT UNIQUE,
  is_viral_attempt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drafts_user_id ON drafts(user_id);
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_drafts_posted_at ON drafts(posted_at DESC);
CREATE INDEX idx_drafts_tweet_id ON drafts(twitter_tweet_id);

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own drafts" ON drafts FOR ALL USING (user_id = auth.uid());
```

#### metrics (指标表)
```sql
CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  draft_id TEXT REFERENCES drafts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  est_follows INTEGER DEFAULT 0,
  synced_from_twitter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draft_id, date)
);

CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_draft_id ON metrics(draft_id);
CREATE INDEX idx_metrics_date ON metrics(date DESC);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own metrics" ON metrics FOR ALL USING (user_id = auth.uid());
```

#### daily_tasks (每日任务)
```sql
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items JSONB NOT NULL, -- [{text: string, done: boolean}]
  goal JSONB NOT NULL, -- {tweets: number, interactions: number}
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, date DESC);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily tasks" ON daily_tasks FOR ALL USING (user_id = auth.uid());
```

---

## 三、API 设计

### 3.1 API 路由规范

**基础路径**: `/api/v1`

**认证**: 所有API都需要 Supabase Auth Token (除了public endpoints)

**请求头**:
```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

**响应格式**:
```typescript
// 成功响应
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    total?: number,
    timestamp: string
  }
}

// 错误响应
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 3.2 API 端点列表

#### 认证相关
```
POST   /api/auth/signup          # 注册
POST   /api/auth/login           # 登录
POST   /api/auth/logout          # 登出
GET    /api/auth/user            # 获取当前用户
PATCH  /api/auth/user            # 更新用户信息
```

#### 模板管理
```
GET    /api/templates            # 获取模板列表
GET    /api/templates/:id        # 获取单个模板
POST   /api/templates            # 创建模板
PATCH  /api/templates/:id        # 更新模板
DELETE /api/templates/:id        # 删除模板
```

#### Idea管理
```
GET    /api/ideas                # 获取Ideas
GET    /api/ideas/:id            # 获取单个Idea
POST   /api/ideas                # 创建Idea
PATCH  /api/ideas/:id            # 更新Idea
DELETE /api/ideas/:id            # 删除Idea
```

#### 草稿管理
```
GET    /api/drafts               # 获取草稿列表
  ?status=draft|scheduled|posted
  ?lang=zh|en
  ?limit=20&offset=0
GET    /api/drafts/:id           # 获取单个草稿
POST   /api/drafts               # 创建草稿
PATCH  /api/drafts/:id           # 更新草稿
DELETE /api/drafts/:id           # 删除草稿
```

#### 数据指标
```
GET    /api/metrics              # 获取指标列表
  ?draft_id=xxx
  ?start_date=2025-09-01
  ?end_date=2025-09-30
GET    /api/metrics/:id          # 获取单个指标
POST   /api/metrics              # 手动录入指标
PATCH  /api/metrics/:id          # 更新指标
DELETE /api/metrics/:id          # 删除指标
```

#### 每日任务
```
GET    /api/daily-tasks          # 获取任务列表
  ?date=2025-09-30
GET    /api/daily-tasks/:date    # 获取指定日期任务
PATCH  /api/daily-tasks/:date    # 更新任务
POST   /api/daily-tasks/:date/lead  # 增加引流计数
```

#### AI 内容生成
```
POST   /api/ai/generate          # 生成内容
  Body: {
    idea_id: string,
    template_id: string,
    variants: ['A', 'B', 'EN']
  }
  Response: {
    drafts: Draft[]
  }
```

#### Twitter 集成
```
GET    /api/twitter/auth         # 开始OAuth流程
GET    /api/twitter/callback     # OAuth回调
POST   /api/twitter/sync         # 手动同步数据
GET    /api/twitter/status       # 查看同步状态
DELETE /api/twitter/disconnect   # 断开连接
```

#### 定时任务（Cron）
```
GET    /api/cron/sync-metrics    # 定时同步推文数据
  Cron: 0 8 * * * (每天8点)
  Authorization: Bearer <cron_secret>
```

### 3.3 API 实现示例

#### 生成内容 API

```typescript
// app/api/ai/generate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateContent } from '@/lib/ai/content-generator'

export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // 2. 解析请求
    const { idea_id, template_id, variants } = await request.json()

    // 3. 获取 Idea 和 Template
    const { data: idea } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', idea_id)
      .single()

    const { data: template } = await supabase
      .from('templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (!idea || !template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Idea or Template not found' } },
        { status: 404 }
      )
    }

    // 4. 生成内容
    const drafts = []
    for (const variant of variants) {
      const content = await generateContent({
        idea: idea.source,
        template,
        variant,
      })

      // 5. 保存草稿
      const { data: draft } = await supabase
        .from('drafts')
        .insert({
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          idea_id,
          template_id,
          lang: template.lang,
          variant,
          content,
          status: 'draft',
        })
        .select()
        .single()

      drafts.push(draft)
    }

    // 6. 返回结果
    return NextResponse.json({
      success: true,
      data: { drafts },
      meta: { timestamp: new Date().toISOString() }
    })
  } catch (error) {
    console.error('Generate content error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

---

## 四、核心服务实现

### 4.1 AI 内容生成服务

```typescript
// lib/ai/content-generator.ts

import OpenAI from 'openai'
import { Template } from '@/lib/store'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface GenerateParams {
  idea: string
  template: Template
  variant: 'A' | 'B' | 'EN'
}

export async function generateContent(params: GenerateParams): Promise<string> {
  const { idea, template, variant } = params

  // 构造prompt
  const prompt = buildPrompt(idea, template, variant)

  // 调用OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a Twitter growth expert who creates viral tweets.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  })

  const content = completion.choices[0].message.content?.trim() || ''

  // 验证长度
  if (content.length > 280) {
    // 重新生成或截断
    return content.substring(0, 277) + '...'
  }

  return content
}

function buildPrompt(idea: string, template: Template, variant: 'A' | 'B' | 'EN'): string {
  const lang = variant === 'EN' ? 'English' : 'Chinese'
  const style = {
    A: '案例导向，用真实数据和结果吸引人',
    B: '工具导向，强调实用性和效率提升',
    EN: '技术专业，数据驱动，适合国际受众',
  }[variant]

  return `
Create a Twitter post based on:

Idea: ${idea}
Template: ${template.title}
Language: ${lang}
Style: ${style}

Template structure:
${template.body}

Template variables:
${JSON.stringify(template.variables, null, 2)}

Requirements:
1. Use real numbers and specific details
2. Keep it under 280 characters
3. Make it engaging and actionable
4. Fill in the template variables appropriately
5. Match the ${style} style

Output only the tweet content, no explanations.
`.trim()
}
```

### 4.2 Twitter 同步服务

```typescript
// lib/twitter/sync-metrics.ts

import { TwitterApi } from 'twitter-api-v2'
import { createClient } from '@supabase/supabase-js'

export async function syncUserMetrics(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. 获取用户 Twitter token
  const { data: user } = await supabase
    .from('users')
    .select('twitter_access_token, twitter_username')
    .eq('id', userId)
    .single()

  if (!user?.twitter_access_token) {
    throw new Error('Twitter not connected')
  }

  // 2. 初始化 Twitter client
  const client = new TwitterApi(user.twitter_access_token)

  // 3. 获取最近7天的已发布草稿
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: drafts } = await supabase
    .from('drafts')
    .select('id, twitter_tweet_id, posted_at')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', sevenDaysAgo.toISOString())
    .not('twitter_tweet_id', 'is', null)

  // 4. 批量获取推文数据
  for (const draft of drafts || []) {
    try {
      const tweet = await client.v2.singleTweet(draft.twitter_tweet_id!, {
        'tweet.fields': ['public_metrics', 'created_at'],
      })

      const metrics = tweet.data.public_metrics

      // 5. 更新或创建 metric 记录
      await supabase.from('metrics').upsert({
        id: `metric_${draft.id}_${new Date().toISOString().split('T')[0]}`,
        user_id: userId,
        draft_id: draft.id,
        date: new Date().toISOString().split('T')[0],
        impressions: metrics?.impression_count || 0,
        likes: metrics?.like_count || 0,
        replies: metrics?.reply_count || 0,
        reposts: metrics?.retweet_count || 0,
        bookmarks: metrics?.bookmark_count || 0,
        link_clicks: 0, // Twitter API v2 Free不提供
        est_follows: Math.floor((metrics?.like_count || 0) / 10), // 估算
        synced_from_twitter: true,
      })
    } catch (error) {
      console.error(`Failed to sync tweet ${draft.twitter_tweet_id}:`, error)
    }
  }

  return { success: true, synced: drafts?.length || 0 }
}
```

---

## 五、部署架构

### 5.1 Vercel 部署

```yaml
# vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "OPENAI_API_KEY": "@openai-api-key",
    "TWITTER_CLIENT_ID": "@twitter-client-id",
    "TWITTER_CLIENT_SECRET": "@twitter-client-secret",
    "CRON_SECRET": "@cron-secret"
  },
  "crons": [
    {
      "path": "/api/cron/sync-metrics",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 5.2 环境变量配置

```bash
# .env.local (开发环境)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

OPENAI_API_KEY=sk-...

TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TWITTER_REDIRECT_URI=http://localhost:3000/api/twitter/callback

CRON_SECRET=random-secret-for-cron-jobs

# 生产环境在 Vercel Dashboard 配置
```

### 5.3 Supabase Edge Functions (可选)

如果 Vercel Cron 不够用，可以用 Supabase Edge Functions:

```typescript
// supabase/functions/sync-metrics/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // 验证 secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 获取所有用户
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .not('twitter_access_token', 'is', null)

  // 批量同步
  for (const user of users || []) {
    await fetch(`${Deno.env.get('APP_URL')}/api/twitter/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SERVICE_TOKEN')}`,
      },
      body: JSON.stringify({ user_id: user.id }),
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## 六、安全设计

### 6.1 认证与授权

- **认证**: Supabase Auth (JWT)
- **授权**: Row Level Security (RLS)
- **API保护**: 所有API需要验证token
- **敏感数据加密**: Twitter token, OpenAI key

### 6.2 数据安全

```sql
-- 敏感字段加密
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密存储 Twitter token
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(token, secret), 'base64');
END;
$$ LANGUAGE plpgsql;

-- 解密
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT, secret TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), secret);
END;
$$ LANGUAGE plpgsql;
```

### 6.3 Rate Limiting

```typescript
// lib/middleware/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function rateLimitMiddleware(req: Request, userId: string) {
  const { success } = await ratelimit.limit(userId)
  if (!success) {
    throw new Error('Rate limit exceeded')
  }
}
```

---

## 七、性能优化

### 7.1 前端优化

- **代码分割**: Next.js自动分割
- **图片优化**: next/image
- **字体优化**: Geist字体预加载
- **缓存策略**: React Query + SWR

### 7.2 后端优化

- **数据库索引**: 所有查询字段加索引
- **批量操作**: 减少数据库往返
- **缓存**: Redis缓存热点数据
- **CDN**: Vercel Edge Network

### 7.3 监控

```typescript
// lib/monitoring/sentry.ts

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})

export function captureError(error: Error, context?: any) {
  Sentry.captureException(error, { extra: context })
}
```

---

## 八、测试策略

### 8.1 测试金字塔

```
       /\
      /  \       E2E Tests (5%)
     /────\      Playwright
    /      \
   /────────\    Integration Tests (15%)
  /          \   Testing Library
 /────────────\
/              \ Unit Tests (80%)
──────────────── Vitest + Jest
```

### 8.2 关键测试用例

```typescript
// __tests__/lib/ai/content-generator.test.ts

import { generateContent } from '@/lib/ai/content-generator'

describe('generateContent', () => {
  it('should generate content within 280 characters', async () => {
    const result = await generateContent({
      idea: 'Test idea',
      template: mockTemplate,
      variant: 'A',
    })
    expect(result.length).toBeLessThanOrEqual(280)
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    await expect(generateContent(invalidParams)).rejects.toThrow()
  })
})
```

---

## 九、未来扩展

### 9.1 可扩展模块

- **多账号管理**: 支持管理多个Twitter账号
- **团队协作**: 邀请成员、权限管理
- **内容日历**: 可视化发布计划
- **竞品监控**: 追踪竞争对手推文
- **自动回复**: AI自动回复评论（谨慎）

### 9.2 技术演进

- **微服务拆分**: AI服务、Twitter服务独立部署
- **消息队列**: Bull MQ处理异步任务
- **数据仓库**: ClickHouse存储历史数据分析
- **实时通知**: WebSocket推送数据更新

---

**文档维护**: 每个Sprint结束后更新
**版本控制**: 重大架构变更升级版本号

---

END OF DOCUMENT
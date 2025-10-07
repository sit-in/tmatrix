# TMatrix MVP - 1天上线计划

**目标**: 今天内完成Supabase集成并上线
**策略**: 砍掉所有非核心功能，只保留最基础的数据存储

---

## ❌ 不做的功能

- ❌ 用户认证（先单用户使用）
- ❌ AI内容生成
- ❌ Twitter API集成
- ❌ 复杂的数据迁移
- ❌ 完善的错误处理
- ❌ 性能优化

## ✅ 只做核心功能

- ✅ Supabase数据库集成
- ✅ 基础CRUD（创建、读取、更新、删除）
- ✅ Dashboard展示数据
- ✅ 手动录入推文数据
- ✅ 数据持久化（不会丢失）

---

## 📋 执行计划（8小时）

### Phase 1: Supabase设置 (1小时)

**Step 1.1: 创建项目 (10分钟)**
```
1. 访问 https://supabase.com
2. 创建项目: tmatrix-mvp
3. Region: Hong Kong
4. 等待项目创建完成
```

**Step 1.2: 创建最简化表 (20分钟)**

在Supabase SQL Editor运行：

```sql
-- 只创建3个核心表

-- 1. 草稿表（简化版）
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  lang TEXT DEFAULT 'zh',
  variant TEXT DEFAULT 'A',
  status TEXT DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 指标表（简化版）
CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  est_follows INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 每日任务表（简化版）
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_metrics_date ON metrics(date DESC);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(date DESC);
```

**Step 1.3: 获取API Keys (5分钟)**
```
Settings > API > 复制:
- Project URL
- anon public key
- service_role key (先不用)
```

---

### Phase 2: 项目配置 (30分钟)

**Step 2.1: 安装依赖 (5分钟)**

```bash
cd ~/Documents/千里会/code/website/tmatrix
pnpm add @supabase/supabase-js
```

**Step 2.2: 配置环境变量 (5分钟)**

编辑 `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Step 2.3: 创建Supabase client (10分钟)**

创建文件 `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试连接
export async function testConnection() {
  const { data, error } = await supabase.from('drafts').select('count')
  if (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
  console.log('Supabase connected successfully')
  return true
}
```

---

### Phase 3: 改造store.ts (2小时)

**策略**: 保持Zustand，但数据从Supabase读写

创建新文件 `lib/store-supabase.ts`:

```typescript
"use client"

import { create } from 'zustand'
import { supabase } from './supabase'

// 保留原有类型定义
export interface Draft {
  id: string
  content: string
  lang: 'zh' | 'en'
  variant: 'A' | 'B' | 'EN'
  status: 'draft' | 'scheduled' | 'posted'
  posted_at?: string
  created_at?: string
}

export interface Metric {
  id: string
  draft_id: string
  date: string
  impressions: number
  likes: number
  replies: number
  reposts: number
  est_follows: number
}

export interface DailyTask {
  id: string
  date: string
  items: { text: string; done: boolean }[]
  lead_count: number
}

interface AppState {
  // 状态
  drafts: Draft[]
  metrics: Metric[]
  dailyTasks: DailyTask[]
  isLoading: boolean

  // Actions
  fetchDrafts: () => Promise<void>
  fetchMetrics: () => Promise<void>
  fetchDailyTasks: () => Promise<void>

  addDraft: (draft: Draft) => Promise<void>
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>

  addMetric: (metric: Metric) => Promise<void>

  updateDailyTask: (date: string, updates: Partial<DailyTask>) => Promise<void>
  incrementLeadCount: (date: string) => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // 初始状态
  drafts: [],
  metrics: [],
  dailyTasks: [],
  isLoading: false,

  // 获取草稿
  fetchDrafts: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      set({ drafts: data, isLoading: false })
    } else {
      console.error('Fetch drafts error:', error)
      set({ isLoading: false })
    }
  },

  // 获取指标
  fetchMetrics: async () => {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) {
      set({ metrics: data })
    }
  },

  // 获取每日任务
  fetchDailyTasks: async () => {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('date', { ascending: false })
      .limit(30)

    if (!error && data) {
      set({ dailyTasks: data })
    }
  },

  // 添加草稿
  addDraft: async (draft) => {
    const { error } = await supabase.from('drafts').insert(draft)
    if (!error) {
      await get().fetchDrafts()
    }
  },

  // 更新草稿
  updateDraft: async (id, updates) => {
    const { error } = await supabase
      .from('drafts')
      .update(updates)
      .eq('id', id)

    if (!error) {
      await get().fetchDrafts()
    }
  },

  // 添加指标
  addMetric: async (metric) => {
    const { error } = await supabase.from('metrics').insert(metric)
    if (!error) {
      await get().fetchMetrics()
    }
  },

  // 更新每日任务
  updateDailyTask: async (date, updates) => {
    const { data: existing } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('date', date)
      .single()

    if (existing) {
      await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('date', date)
    } else {
      await supabase.from('daily_tasks').insert({
        id: `t${date.replace(/-/g, '')}`,
        date,
        ...updates,
      })
    }

    await get().fetchDailyTasks()
  },

  // 增加引流计数
  incrementLeadCount: async (date) => {
    const { data: task } = await supabase
      .from('daily_tasks')
      .select('lead_count')
      .eq('date', date)
      .single()

    const newCount = (task?.lead_count || 0) + 1

    await get().updateDailyTask(date, { lead_count: newCount })
  },
}))

// 工具函数（保持不变）
export const calculateEngagementRate = (metric: Metric): number => {
  if (metric.impressions === 0) return 0
  return ((metric.likes + metric.replies + metric.reposts) / metric.impressions) * 100
}

export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

---

### Phase 4: 修改Dashboard (1.5小时)

修改 `app/page.tsx`:

1. 导入新的store
2. 在useEffect中加载数据
3. 添加loading状态

最小改动:

```typescript
"use client"

import { useStore } from "@/lib/store-supabase" // 改这里
import { useEffect } from 'react'

export default function DashboardPage() {
  const {
    metrics,
    drafts,
    dailyTasks,
    isLoading,
    fetchMetrics,
    fetchDrafts,
    fetchDailyTasks,
    incrementLeadCount,
    updateDailyTask
  } = useStore()

  // 加载数据
  useEffect(() => {
    fetchMetrics()
    fetchDrafts()
    fetchDailyTasks()
  }, [])

  // 今日引流计数
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTask = dailyTasks.find(t => t.date === today)
  const todayLeadCount = todayTask?.lead_count || 0

  const handleIncrementLead = async () => {
    await incrementLeadCount(today)
  }

  // 其余代码保持不变...

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  }

  return (
    // 原有的JSX...
  )
}
```

---

### Phase 5: 测试 (1小时)

**Step 5.1: 本地测试 (30分钟)**

```bash
# 重启开发服务器
pnpm dev

# 打开浏览器
open http://localhost:3000
```

**测试清单**:
- [ ] Dashboard能正常加载
- [ ] 点击"微信引流"的+按钮能增加计数
- [ ] 刷新页面后数据还在
- [ ] 打开Supabase Dashboard能看到数据

**Step 5.2: 修复错误 (30分钟)**

如果有错误，逐个修复

---

### Phase 6: 部署 (1小时)

**Step 6.1: 提交代码 (10分钟)**

```bash
git add .
git commit -m "feat: MVP - Supabase集成完成"
git push
```

**Step 6.2: 部署到Vercel (20分钟)**

```bash
# 安装Vercel CLI（如果没有）
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

在部署过程中，添加环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Step 6.3: 验证 (10分钟)**

访问你的生产URL，测试功能

---

## 🚨 如果卡住了

### 问题1: Supabase连接失败

```typescript
// 在浏览器console运行
import { supabase } from './lib/supabase'
const { data, error } = await supabase.from('drafts').select('*')
console.log(data, error)
```

### 问题2: 数据不显示

1. 检查Supabase表是否创建成功
2. 检查环境变量是否正确
3. 看浏览器console有无错误

### 问题3: TypeScript报错

暂时先注释掉报错的类型，能跑就行

---

## ✅ 完成标准

- [ ] Dashboard能打开
- [ ] 点击按钮有反应
- [ ] 数据保存在Supabase
- [ ] 刷新不丢失数据
- [ ] 部署到线上能访问

**能用就行！不追求完美！**

---

## 📞 紧急联系

如果实在卡住了：
1. 截图错误信息
2. 发给我
3. 我实时帮你解决

---

**现在开始！8小时后见！** 🚀
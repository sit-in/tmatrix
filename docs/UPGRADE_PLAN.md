# TMatrix Lite 升级改进方案（方案A）

**文档版本**: v1.0
**创建时间**: 2025-09-30
**负责人**: @sitinme
**改进策略**: 方案A - 修复当前项目，升级为生产级应用

---

## 一、当前问题诊断

### 1.1 致命问题（P0）

#### 问题1: 数据丢失风险
- **现状**: 所有数据存储在浏览器 LocalStorage
- **风险**:
  - 清除浏览器缓存 → 数据全部丢失
  - 无法多设备同步
  - 无法备份恢复
  - 无法团队协作
- **影响**: **致命**，生产环境不可用

#### 问题2: 手动录入效率低
- **现状**: 所有推文数据需要手动输入
- **问题**:
  - 每天录入数据耗时30分钟+
  - 容易遗漏或输错
  - 无法持续执行
- **影响**: **高**，2周后会放弃使用

#### 问题3: 缺少AI能力
- **现状**: 无AI内容生成功能
- **问题**:
  - 与战略定位不符（AI赚钱但工具不用AI）
  - 内容创作仍需手动
  - 无法快速生成A/B/EN变体
- **影响**: **高**，核心竞争力缺失

### 1.2 重要问题（P1）

#### 问题4: 功能不完整
- content 页面未完全实现
- data 页面数据录入体验差
- 无数据导入导出自动化

#### 问题5: 无Twitter API集成
- 无法自动获取推文指标
- 无法验证推文是否发布成功
- 无法追踪实时数据

### 1.3 次要问题（P2）

- 无移动端优化
- 无多语言支持（英文Twitter运营不友好）
- 性能未优化（数据量大会卡顿）

---

## 二、升级目标

### 2.1 核心目标

**从"玩具级原型"升级为"生产级工具"**

具体指标：
- ✅ 数据永久存储，0丢失风险
- ✅ 80%的数据录入自动化
- ✅ AI辅助内容生成，3分钟生成3个变体
- ✅ 支持多设备访问
- ✅ Twitter API集成，自动同步数据
- ✅ 完整的功能实现

### 2.2 技术目标

| 模块 | 当前状态 | 目标状态 |
|------|---------|---------|
| 数据层 | LocalStorage | Supabase + PostgreSQL |
| API层 | 无 | Next.js API Routes + tRPC |
| 认证 | 无 | Supabase Auth |
| AI引擎 | 无 | OpenAI/Claude API |
| Twitter集成 | 无 | Twitter API v2 |
| 部署 | 无 | Vercel + Supabase |

---

## 三、技术架构升级

### 3.1 新架构图

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Dashboard │  │ Content  │  │  Data    │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│         │              │              │             │
│         └──────────────┴──────────────┘             │
│                       ↓                              │
│              ┌─────────────────┐                    │
│              │  Zustand Store  │                    │
│              └─────────────────┘                    │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ /api/    │  │ /api/    │  │ /api/    │          │
│  │ drafts   │  │ metrics  │  │ ai       │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│                   Services Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Supabase │  │ OpenAI   │  │ Twitter  │          │
│  │ Client   │  │ Service  │  │ Service  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└───────────────────────┬─────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Data Layer (Supabase)                   │
│  ┌──────────────────────────────────────┐           │
│  │      PostgreSQL Database             │           │
│  │  - users                             │           │
│  │  - templates                         │           │
│  │  - ideas                             │           │
│  │  - drafts                            │           │
│  │  - metrics                           │           │
│  │  - daily_tasks                       │           │
│  └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

### 3.2 数据库设计

#### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  twitter_username TEXT,
  twitter_access_token TEXT ENCRYPTED,
  openai_api_key TEXT ENCRYPTED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 模板表
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  category TEXT NOT NULL,
  variables JSONB NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idea表
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('link', 'text')),
  source TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 草稿表
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id TEXT REFERENCES ideas(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES templates(id) ON DELETE SET NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'EN')),
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'posted')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  twitter_tweet_id TEXT UNIQUE,
  is_viral_attempt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 指标表
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

-- 每日任务表
CREATE TABLE daily_tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items JSONB NOT NULL,
  goal JSONB NOT NULL,
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX idx_drafts_user_id ON drafts(user_id);
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_date ON metrics(date);
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, date);
```

---

## 四、功能模块升级

### 4.1 后端 + 数据库（优先级P0）

#### 4.1.1 Supabase 集成

**任务**:
1. 创建 Supabase 项目
2. 配置数据库表结构
3. 设置 Row Level Security (RLS)
4. 配置环境变量

**实现步骤**:
```bash
# 1. 安装依赖
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs

# 2. 创建 Supabase client
lib/supabase/client.ts
lib/supabase/server.ts

# 3. 配置环境变量
.env.local:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**文件清单**:
- `lib/supabase/client.ts` - 客户端Supabase实例
- `lib/supabase/server.ts` - 服务端Supabase实例
- `lib/supabase/migrations/001_initial_schema.sql` - 数据库迁移脚本

**工作量**: 1天

#### 4.1.2 认证系统

**任务**:
1. 实现登录/注册页面
2. 集成 Supabase Auth
3. 保护路由中间件
4. 用户状态管理

**实现步骤**:
```typescript
// app/login/page.tsx
// app/register/page.tsx
// middleware.ts (保护路由)
// lib/hooks/useAuth.ts
```

**工作量**: 1天

#### 4.1.3 数据迁移

**任务**: 将 LocalStorage 数据迁移到 Supabase

**实现步骤**:
1. 创建迁移脚本读取 LocalStorage
2. 批量导入到 Supabase
3. 提供导入/导出功能（兼容性）

**文件清单**:
- `lib/migration/localStorage-to-supabase.ts`
- `app/api/migrate/route.ts`

**工作量**: 0.5天

---

### 4.2 Twitter API 集成（优先级P0）

#### 4.2.1 功能目标

- ✅ 自动获取推文曝光数据（impressions, likes, replies, etc.）
- ✅ 自动同步已发布推文
- ✅ 定时任务每天同步数据
- ⚠️ 不实现自动发推（风险高）

#### 4.2.2 Twitter API 设置

**任务**:
1. 申请 Twitter Developer Account
2. 创建 App，获取 API Keys
3. 实现 OAuth 2.0 认证流程
4. 存储用户 Access Token（加密）

**文件清单**:
- `lib/twitter/client.ts` - Twitter API 客户端
- `app/api/twitter/auth/route.ts` - OAuth回调
- `app/api/twitter/sync/route.ts` - 数据同步接口

**环境变量**:
```bash
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_REDIRECT_URI=https://yourdomain.com/api/twitter/auth
```

#### 4.2.3 自动同步逻辑

```typescript
// lib/twitter/sync-metrics.ts

async function syncTweetMetrics(userId: string) {
  // 1. 获取用户 Twitter token
  // 2. 查询最近7天的 posted drafts
  // 3. 调用 Twitter API 获取推文数据
  // 4. 更新 metrics 表
  // 5. 计算涨粉数（followers增量）
}

// 定时任务（使用 Vercel Cron 或 Supabase Edge Functions）
// cron: 0 8 * * * (每天早上8点)
```

**文件清单**:
- `lib/twitter/sync-metrics.ts`
- `app/api/cron/sync-metrics/route.ts`

**工作量**: 2天

---

### 4.3 AI 内容生成引擎（优先级P0）

#### 4.3.1 功能目标

- ✅ 输入 Idea → 自动生成 A/B/EN 三个变体
- ✅ 基于模板自动填充变量
- ✅ 支持自定义 prompt
- ✅ 生成速度 < 30秒

#### 4.3.2 AI 服务选择

**推荐**: OpenAI GPT-4o-mini（性价比高）
**备选**: Anthropic Claude 3.5 Sonnet

**成本估算**:
- 每次生成3个变体 ≈ 500 tokens
- GPT-4o-mini: $0.15/1M tokens
- 每月1000次生成 ≈ $0.08

#### 4.3.3 实现架构

```typescript
// lib/ai/content-generator.ts

interface GenerateContentParams {
  idea: string
  templateId: string
  lang: 'zh' | 'en'
  variant: 'A' | 'B' | 'EN'
}

async function generateContent(params: GenerateContentParams): Promise<string> {
  // 1. 获取模板
  // 2. 构造 prompt
  // 3. 调用 OpenAI API
  // 4. 解析返回内容
  // 5. 填充到模板
}

// Prompt 模板示例
const PROMPT_TEMPLATE = `
你是一个Twitter增长专家，擅长创作爆款推文。

用户提供的Idea: {{idea}}
使用模板: {{template.title}}
目标语言: {{lang}}
变体类型: {{variant}}

要求:
1. 内容要有数据/案例/细节
2. 使用模板变量: {{template.variables}}
3. 保持280字符以内
4. ${variant === 'A' ? '案例导向' : variant === 'B' ? '工具导向' : '技术专业'}

直接输出推文内容，不要任何额外解释。
`
```

**文件清单**:
- `lib/ai/content-generator.ts`
- `lib/ai/prompts.ts`
- `app/api/ai/generate/route.ts`

**环境变量**:
```bash
OPENAI_API_KEY=sk-...
```

**工作量**: 1.5天

---

### 4.4 内容管理页完善（优先级P1）

#### 4.4.1 功能清单

**Idea 管理**:
- ✅ 添加 Idea（link/text）
- ✅ 标签管理
- ✅ 删除/编辑
- ✅ 搜索过滤

**草稿生成**:
- ✅ 选择 Idea + Template
- ✅ 一键生成 A/B/EN 三个变体
- ✅ 手动编辑草稿
- ✅ 预览推文效果

**发布调度**:
- ✅ 设置发布时间
- ✅ 标记为"爆款尝试"
- ✅ 复制到剪贴板（手动发推）
- ⚠️ 不实现自动发推（风险高）

#### 4.4.2 UI设计

```
┌─────────────────────────────────────────────────────┐
│  内容管理                                [+ 新Idea]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Ideas 列表                                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ [🔗] https://twitter.com/user/status/123     │  │
│  │ #RPA #电商                      [生成草稿]    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ [📝] 用RPA批量清洗商品图                     │  │
│  │ #自动化                        [生成草稿]    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  草稿列表                         [筛选: 全部 ▼]    │
│  ┌──────────────────────────────────────────────┐  │
│  │ [A] 我用XX工具做了7天...       [已发布]      │  │
│  │     曝光: 12,000  互动率: 3.2%               │  │
│  │     [编辑] [复制] [查看数据]                 │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │ [B] 推荐5个我每天用的...       [草稿]        │  │
│  │     [编辑] [定时发布] [复制]                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**文件清单**:
- `app/content/page.tsx` - 完整重构
- `components/content/idea-list.tsx`
- `components/content/idea-form.tsx`
- `components/content/draft-list.tsx`
- `components/content/draft-editor.tsx`
- `components/content/generate-dialog.tsx`

**工作量**: 2天

---

### 4.5 数据追踪页优化（优先级P1）

#### 4.5.1 功能清单

**手动录入优化**:
- ✅ 快速录入表单（输入推文链接自动提取ID）
- ✅ 批量录入（CSV导入）
- ✅ OCR识别截图数据（可选）

**Twitter同步**:
- ✅ 显示同步状态
- ✅ 手动触发同步按钮
- ✅ 同步历史记录

**数据查看**:
- ✅ 按日期筛选
- ✅ 按草稿筛选
- ✅ 导出CSV/Excel

#### 4.5.2 UI设计

```
┌─────────────────────────────────────────────────────┐
│  数据追踪                                            │
├─────────────────────────────────────────────────────┤
│  Twitter 同步                                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ 最后同步: 2025-09-30 08:00                   │  │
│  │ 状态: ✅ 已连接 @sitinme                     │  │
│  │                              [立即同步]       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
├─────────────────────────────────────────────────────┤
│  手动录入                                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ 推文链接: [____________________________]     │  │
│  │ 或选择草稿: [选择草稿 ▼]                    │  │
│  │                                               │  │
│  │ 曝光: [_____]  点赞: [___]  回复: [___]     │  │
│  │ 转发: [___]   书签: [___]  新增关注: [___]  │  │
│  │                                 [提交]        │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
├─────────────────────────────────────────────────────┤
│  历史数据                    [导出CSV] [按日期▼]    │
│  ┌──────────────────────────────────────────────┐  │
│  │ 2025-09-30  示例内容A    12,000    3.2%     │  │
│  │ 2025-09-29  Sample EN     8,500    2.8%     │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**文件清单**:
- `app/data/page.tsx` - 重构
- `components/data/twitter-sync-card.tsx`
- `components/data/manual-entry-form.tsx`
- `components/data/metrics-table.tsx`

**工作量**: 1.5天

---

### 4.6 Dashboard 优化（优先级P2）

#### 当前Dashboard已经很好，只需小优化:

**优化点**:
1. 添加"同步中"loading状态
2. 显示数据来源标签（手动/自动）
3. 添加周报生成功能
4. 优化图表交互（点击查看详情）

**工作量**: 0.5天

---

## 五、开发路线图

### Phase 1: 数据层升级（Week 1）

**目标**: 解决数据丢失问题

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| Supabase项目创建 + 数据库设计 | 0.5天 | - | 未开始 |
| 数据库迁移脚本 | 0.5天 | - | 未开始 |
| Supabase集成到Next.js | 1天 | - | 未开始 |
| 认证系统实现 | 1天 | - | 未开始 |
| LocalStorage迁移工具 | 0.5天 | - | 未开始 |
| 测试 + 部署 | 0.5天 | - | 未开始 |

**里程碑**: 数据存储到云端，多设备可访问

---

### Phase 2: AI + Twitter 集成（Week 2）

**目标**: 核心功能自动化

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| OpenAI API集成 | 1天 | - | 未开始 |
| AI内容生成引擎 | 1.5天 | - | 未开始 |
| Twitter Developer申请 | 0.5天 | - | 未开始 |
| Twitter OAuth实现 | 1天 | - | 未开始 |
| Twitter数据同步 | 1.5天 | - | 未开始 |
| 定时任务配置 | 0.5天 | - | 未开始 |

**里程碑**: AI生成内容 + Twitter自动同步数据

---

### Phase 3: 功能完善（Week 3）

**目标**: 完成所有核心功能

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 内容管理页重构 | 2天 | - | 未开始 |
| 数据追踪页优化 | 1.5天 | - | 未开始 |
| Dashboard小优化 | 0.5天 | - | 未开始 |
| 移动端适配 | 1天 | - | 未开始 |

**里程碑**: 所有功能可用，体验流畅

---

### Phase 4: 优化 + 上线（Week 4）

**目标**: 生产环境上线

| 任务 | 工作量 | 负责人 | 状态 |
|------|--------|--------|------|
| 性能优化 | 1天 | - | 未开始 |
| 错误处理 | 0.5天 | - | 未开始 |
| 用户文档 | 0.5天 | - | 未开始 |
| 测试 | 1天 | - | 未开始 |
| 部署 | 0.5天 | - | 未开始 |
| 数据迁移 | 0.5天 | - | 未开始 |

**里程碑**: 正式上线使用

---

## 六、成本估算

### 6.1 开发成本

| 项目 | 工作量 | 成本 |
|------|--------|------|
| Phase 1: 数据层 | 4天 | - |
| Phase 2: AI + Twitter | 6天 | - |
| Phase 3: 功能完善 | 5天 | - |
| Phase 4: 优化上线 | 4天 | - |
| **总计** | **19天** | - |

**如果外包**: 19天 × 1000元/天 = 19,000元
**如果自己做**: 时间成本（晚上+周末约1个月）

### 6.2 运营成本（每月）

| 服务 | 免费额度 | 付费价格 | 预估 |
|------|---------|---------|------|
| Supabase | 500MB数据库<br>2GB存储<br>50,000 API请求 | $25/月 (Pro) | 前期免费<br>后期$25 |
| Vercel | Hobby免费 | $20/月 (Pro) | 免费 |
| OpenAI | $5赠金 | $0.15/1M tokens | $5-10/月 |
| Twitter API | Free tier | $100/月 (Basic) | 前期免费<br>后期$100 |
| **总计** | **前期: $0-5/月** | **后期: $125-150/月** | **可接受** |

### 6.3 ROI分析

**如果按战略目标达成**:
- 2个月引流500人到微信
- 10%转化率 = 50人付费
- 人均1000元 = 50,000元收入
- 运营成本: $300 (2个月) ≈ 2,000元
- **ROI: 2400%**

**值得投入。**

---

## 七、风险管理

### 7.1 技术风险

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| Twitter API申请被拒 | 中 | 高 | 备选: 手动录入 + 第三方工具 |
| Supabase免费额度超限 | 低 | 中 | 升级到Pro ($25/月) |
| AI生成质量不达预期 | 中 | 中 | 优化prompt + 人工审核 |
| 开发时间超预期 | 高 | 中 | 分阶段上线，先上核心功能 |

### 7.2 产品风险

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| 工具做完没人用 | 中 | 高 | 自己先用，验证价值后再推广 |
| 功能复杂度过高 | 高 | 中 | MVP先行，渐进式增加功能 |
| 与战略目标脱节 | 低 | 高 | 每周对齐STRATEGY.md |

### 7.3 时间风险

**最大风险**: 开发工具耗时太长，错过最佳运营窗口

**缓解**:
1. **并行执行**: 边开发边运营Twitter
2. **MVP优先**: Phase 1-2完成就可以开始使用
3. **外包考虑**: 如果自己时间不够，部分模块外包

---

## 八、决策建议

### 8.1 立即执行（推荐）

**如果你认同以下判断**:
1. ✅ Twitter运营需要长期投入（不是2个月）
2. ✅ 数据驱动比拍脑袋更重要
3. ✅ 愿意投入3-4周时间完善工具
4. ✅ 预算可以接受$150/月

**→ 立即开始Phase 1**

### 8.2 简化版本（折中）

**如果你担心时间成本**:

**最小可用版本（MVP）**:
- ✅ Phase 1: Supabase + 认证（必须）
- ✅ Phase 2: AI生成（必须）
- ❌ Twitter API（暂时手动）
- ❌ 功能完善（渐进式）

**工作量**: 10天 → 2周可上线

### 8.3 放弃方案A（不推荐）

**如果你觉得投入太大**:

→ 回到现实：用 **Notion + Buffer + ChatGPT** 组合

**但是**:
- 没有数据驱动
- 没有系统化
- 无法形成产品
- 2个月目标很难达成

---

## 九、下一步行动

### 9.1 立即决策（今天）

**选择路线**:
- [ ] 路线A: 完整版本（4周，推荐）
- [ ] 路线B: MVP版本（2周，折中）
- [ ] 路线C: 放弃开发（专注运营）

### 9.2 技术准备（明天）

**如果选择路线A或B**:

1. **注册账号**:
   - [ ] Supabase账号
   - [ ] OpenAI账号（获取API Key）
   - [ ] Twitter Developer账号（申请API）

2. **环境配置**:
   - [ ] 创建Supabase项目
   - [ ] 配置环境变量
   - [ ] 创建GitHub仓库（已完成）

3. **阅读文档**:
   - [ ] Supabase文档（2小时）
   - [ ] Twitter API v2文档（2小时）
   - [ ] OpenAI API文档（1小时）

### 9.3 开发启动（Week 1）

**Day 1-2**: Supabase集成
**Day 3**: 认证系统
**Day 4**: 数据迁移 + 测试

---

## 十、文档维护

### 更新日志

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2025-09-30 | 初始版本 | Claude |

### 相关文档

- `STRATEGY.md` - 整体运营战略
- `docs/ARCHITECTURE.md` - 技术架构详解（待创建）
- `docs/API_DESIGN.md` - API设计文档（待创建）
- `docs/DEVELOPMENT.md` - 开发指南（待创建）

---

**这份文档是你的行动指南。**

**现在，做决策：**
1. 选择路线（A/B/C）
2. 开始执行
3. 按周复盘进度

**60天后，我们用数据说话。**

---

END OF DOCUMENT
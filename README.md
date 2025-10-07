# TMatrix Lite

**Twitter 内容管理与数据分析工具** - 为 Twitter 矩阵运营打造的系统化工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)

---

## 🚨 **当前状态: 单用户MVP v0.2.0**

> **重要说明**: 这是一个**单用户MVP版本**，专注于核心功能的稳定实现。
>
> ✅ **已实现**: Dashboard展示、Supabase数据持久化、手动数据录入
> ⏸️ **暂不支持**: 多用户、AI生成、Twitter API自动同步
>
> 📖 完整部署指南: [DEPLOY.md](DEPLOY.md)

---

## 📖 项目简介

TMatrix Lite 是一个为 Twitter 矩阵运营设计的内容管理和数据分析工具，帮助你系统化地管理 Twitter 账号，实现数据驱动的增长。

**当前版本特点**：
- ✅ 干净的代码架构（移除技术债）
- ✅ 统一的命名规范（snake_case与数据库一致）
- ✅ 完整的类型定义（TypeScript严格模式）
- ✅ Supabase数据持久化（告别LocalStorage）

### 核心功能（当前版本）

- 📊 **数据看板**: KPI追踪、趋势分析、Top推文展示
- ✍️ **内容管理**: Idea收集、草稿创建、状态管理
- 📈 **数据追踪**: 手动录入推文指标、CSV批量导入
- ⏰ **每日清单**: 任务管理、微信引流计数

### 计划中功能（未来版本）

- 🤖 **AI辅助**: OpenAI/Claude驱动的内容生成
- 🔄 **Twitter API**: 自动同步推文数据
- 🔐 **多用户**: 用户认证、数据隔离
- 🎨 **UI优化**: Toast提示、Loading状态

### 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **UI**: Radix UI + shadcn/ui + Tailwind CSS 4
- **状态**: Zustand + React Query
- **后端**: Next.js API Routes + Supabase
- **数据库**: PostgreSQL (Supabase)
- **AI**: OpenAI GPT-4o-mini / Claude 3.5 Sonnet
- **部署**: Vercel + Supabase Cloud

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.17.0
- pnpm >= 8.0.0
- Git
- Supabase 账号 (免费)
- OpenAI API Key (可选)

### 安装步骤

```bash
# 1. 克隆项目
git clone git@github.com:sit-in/tmatrix.git
cd tmatrix

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的密钥

# 4. 启动开发服务器
pnpm dev

# 5. 打开浏览器
# 访问 http://localhost:3000
```

### 环境变量配置

创建 `.env.local` 文件:

```bash
# Supabase (必需)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (可选 - AI内容生成)
OPENAI_API_KEY=sk-...

# Twitter API (可选 - 自动同步数据)
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/twitter/callback

# Cron Jobs (生产环境)
CRON_SECRET=random-secret-string
```

### 数据库设置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 在 SQL Editor 运行 `lib/supabase/schema-single-user.sql`
4. 复制 API keys 到 `.env.local`

> 💡 **提示**: 详细的数据库设置和部署步骤请查看 [DEPLOY.md](DEPLOY.md)

---

## 📂 项目结构

```
tmatrix/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard 页面
│   ├── content/           # 内容管理页
│   ├── data/              # 数据追踪页
│   └── api/               # API Routes
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── layout/           # 布局组件
│   ├── content/          # 内容管理组件
│   └── data/             # 数据追踪组件
├── lib/                   # 核心逻辑
│   ├── supabase/         # Supabase 客户端
│   ├── ai/               # AI 服务
│   ├── twitter/          # Twitter API
│   └── store.ts          # Zustand 状态管理
├── docs/                  # 文档
│   ├── UPGRADE_PLAN.md   # 升级方案(方案A)
│   ├── ARCHITECTURE.md   # 技术架构
│   ├── DEVELOPMENT.md    # 开发指南
│   └── STRATEGY.md       # 运营战略
└── public/                # 静态资源
```

---

## 📚 文档

- **[升级方案 (方案A)](docs/UPGRADE_PLAN.md)** - 从原型到生产级的完整升级路线
- **[技术架构](docs/ARCHITECTURE.md)** - 系统架构、数据库设计、API设计
- **[开发指南](docs/DEVELOPMENT.md)** - 开发环境、编码规范、测试
- **[运营战略](STRATEGY.md)** - Twitter矩阵运营的完整战略

---

## 🎯 核心功能详解

### 1. Dashboard 数据看板

实时追踪关键指标:
- **新增关注**: 本周累计涨粉数
- **微信引流**: 今日引流人数（手动录入）
- **已发推文**: 过去7天发布数量
- **爆款尝试**: >10k曝光的推文数

**7天趋势图**: 双Y轴展示曝光量和互动率

**Top推文表格**: 按曝光量排序的Top 5推文

### 2. 内容管理

**Idea 收集箱**:
- 支持链接和文本两种类型
- 标签分类管理
- 快速搜索过滤

**模板化创作**:
- 预设5个爆款模板（案例、工具、经验、数据、互动）
- 支持变量填充
- 自定义模板

**A/B/EN 变体生成**:
- 同一个Idea生成3个变体
- AI辅助生成（可选）
- 手动编辑优化

### 3. 数据追踪

**手动录入**:
- 输入推文链接自动提取ID
- 快速录入曝光、点赞、回复等指标
- 批量导入CSV

**Twitter API自动同步**:
- 每天自动同步推文数据
- OAuth 2.0安全认证
- 增量更新，避免重复

### 4. AI 内容生成 (升级后)

- 基于Idea和模板自动生成推文
- 支持中文/英文双语
- 3种变体风格（案例/工具/技术）
- 30秒内完成生成

---

## 🛠️ 开发命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 代码检查

# 测试
pnpm test             # 运行单元测试
pnpm test:e2e         # 运行E2E测试

# 数据库
pnpm db:migrate       # 运行数据库迁移
pnpm db:reset         # 重置数据库
pnpm db:seed          # 填充示例数据

# 部署
vercel                # 部署到Vercel
```

---

## 🚦 开发路线图

### ✅ Phase 0: 原型阶段 (已完成)

- [x] Dashboard 基础功能
- [x] 内容管理页框架
- [x] 数据追踪页框架
- [x] Zustand 状态管理
- [x] LocalStorage 持久化

### 🔄 Phase 1: 数据层升级 (进行中)

- [ ] Supabase 集成
- [ ] 认证系统
- [ ] 数据迁移工具
- [ ] 多用户支持

### ⏳ Phase 2: AI + Twitter 集成

- [ ] OpenAI API 集成
- [ ] AI 内容生成引擎
- [ ] Twitter OAuth 认证
- [ ] Twitter 数据自动同步
- [ ] 定时任务配置

### ⏳ Phase 3: 功能完善

- [ ] 内容管理页完整重构
- [ ] 数据追踪页优化
- [ ] Dashboard 高级功能
- [ ] 移动端适配

### ⏳ Phase 4: 生产上线

- [ ] 性能优化
- [ ] 错误处理
- [ ] 用户文档
- [ ] 监控告警
- [ ] 正式部署

完整路线图见: [docs/UPGRADE_PLAN.md](docs/UPGRADE_PLAN.md)

---

## 📊 数据模型

### 核心实体

```typescript
// 用户
users: {
  id, email, twitter_username, twitter_access_token, openai_api_key
}

// 模板
templates: {
  id, user_id, title, lang, category, variables, body
}

// Idea
ideas: {
  id, user_id, source_type, source, tags
}

// 草稿
drafts: {
  id, user_id, idea_id, template_id, lang, variant,
  content, status, scheduled_at, posted_at, twitter_tweet_id
}

// 指标
metrics: {
  id, user_id, draft_id, date,
  impressions, likes, replies, reposts, bookmarks, link_clicks, est_follows
}

// 每日任务
daily_tasks: {
  id, user_id, date, items, goal, lead_count
}
```

完整ER图见: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#%E6%95%B0%E6%8D%AE%E6%A8%A1%E5%9E%8B%E8%AE%BE%E8%AE%A1)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

---

## 📄 许可证

MIT License

Copyright (c) 2025 @sitinme

---

## 🔗 相关链接

- **作者 Twitter**: [@sitinme](https://twitter.com/sitinme)
- **微信**: 257735
- **GitHub**: [@sit-in](https://github.com/sit-in)
- **文档**: [docs/](docs/)

---

## 💡 设计理念

**TMatrix Lite 的核心理念**:

1. **数据驱动**: 所有决策基于真实数据，而非直觉
2. **系统化**: 从内容创作到数据分析的完整闭环
3. **自动化**: 减少重复劳动，提高效率
4. **可扩展**: 模块化设计，易于添加新功能

**目标用户**:

- Twitter 内容创作者
- 增长黑客
- 社交媒体运营
- 独立开发者
- AI 出海创业者

**为什么叫 TMatrix?**

- **T**: Twitter
- **Matrix**: 矩阵（多账号、多维度、系统化）

---

## ⚠️ 当前限制

### 单用户MVP (v0.2.0) - 当前版本

- ✅ 数据永久存储 (Supabase)
- ✅ 基础功能稳定可用
- ✅ 代码架构清晰
- ⚠️ **单用户使用**（所有人看到同一份数据）
- ⚠️ 需手动录入数据
- ❌ 无用户认证
- ❌ 无 AI 功能
- ❌ 无 Twitter API 集成
- ❌ 无错误Toast提示

### 未来版本规划 (v1.0.0)

- 🔄 多用户支持 + 用户认证
- 🔄 AI 内容生成（OpenAI/Claude）
- 🔄 Twitter API 自动同步
- 🔄 错误处理和用户反馈
- 🔄 性能优化和缓存
- 🔄 完整的E2E测试

> 💡 **升级路线**: 查看 [docs/UPGRADE_PLAN.md](docs/UPGRADE_PLAN.md) 了解完整升级计划

---

## 🎉 致谢

感谢以下开源项目:

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 开源 Firebase 替代品
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 React 组件
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理
- [Vercel](https://vercel.com/) - 部署平台

---

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/sit-in/tmatrix/issues)
- **Twitter**: [@sitinme](https://twitter.com/sitinme)
- **微信**: 257735（备注来意）

---

**Built with ❤️ by [@sitinme](https://twitter.com/sitinme)**

**Let's grow on Twitter, systematically.**

---

END OF README
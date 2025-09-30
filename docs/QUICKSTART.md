# TMatrix Lite 快速开始指南

**5分钟快速上手 TMatrix Lite**

---

## 一、安装项目

### 1.1 克隆项目

```bash
git clone git@github.com:sit-in/tmatrix.git
cd tmatrix
```

### 1.2 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 1.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local
code .env.local  # 或使用你喜欢的编辑器
```

**最小配置** (仅使用本地功能):
```bash
# .env.local
# 暂时使用空值，后续配置 Supabase 后填入
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 1.4 启动开发服务器

```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## 二、配置 Supabase (推荐)

### 2.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com/)
2. 点击 "Start your project"
3. 创建新项目:
   - Name: `tmatrix-lite`
   - Database Password: 记住这个密码
   - Region: Hong Kong (或离你最近的)

### 2.2 获取 API Keys

在项目页面:
1. 点击左侧 Settings > API
2. 复制以下信息到 `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 创建数据库表

在 Supabase Dashboard:
1. 点击左侧 SQL Editor
2. 创建新查询
3. 复制粘贴 `lib/supabase/migrations/001_initial_schema.sql` 的内容
4. 点击 Run

### 2.4 重启开发服务器

```bash
# Ctrl+C 停止服务器
# 然后重新启动
pnpm dev
```

---

## 三、基础使用

### 3.1 Dashboard 页面

访问首页，你会看到:
- **4个KPI卡片**: 新增关注、微信引流、已发推文、爆款尝试
- **7天趋势图**: 曝光量和互动率
- **Top推文表格**: 按曝光排序
- **今日清单**: 每日任务

**快速操作**:
- 点击"微信引流"卡片的 `+` 按钮增加计数
- 勾选今日清单的任务
- 导出/导入 JSON 数据

### 3.2 内容管理页 (开发中)

访问 [/content](http://localhost:3000/content)

**当前功能**:
- Idea 收集箱
- 草稿列表
- 模板管理

**未来功能** (升级后):
- AI 一键生成 A/B/EN 变体
- 批量生成推文
- 定时发布

### 3.3 数据追踪页 (开发中)

访问 [/data](http://localhost:3000/data)

**当前功能**:
- 手动录入推文数据

**未来功能** (升级后):
- Twitter API 自动同步
- CSV 批量导入
- 数据可视化分析

---

## 四、数据导入导出

### 4.1 导出数据

在 Dashboard 页面:
1. 点击右上角 "导出 JSON"
2. 数据会下载为 `tmatrix-export-YYYY-MM-DD.json`

### 4.2 导入数据

在 Dashboard 页面:
1. 点击右上角 "导入 JSON"
2. 选择之前导出的 JSON 文件
3. 数据会自动恢复

**⚠️ 注意**: 导入会覆盖当前数据！

---

## 五、常见问题

### Q1: 启动后页面空白？

**原因**: 环境变量未配置

**解决**:
1. 检查 `.env.local` 是否存在
2. 暂时注释掉 Supabase 相关代码
3. 或完成 Supabase 配置

### Q2: 数据清除后丢失？

**原因**: 当前数据存储在 LocalStorage

**解决**:
- 定期导出数据备份
- 或完成 Supabase 配置（云端存储）

### Q3: 如何添加新模板？

当前版本:
1. 编辑 `lib/store.ts`
2. 在 `initialData.templates` 添加新模板

升级后:
- 在 UI 界面直接添加

### Q4: 如何测试 AI 功能？

需要先完成升级到 Phase 2:
1. 配置 `OPENAI_API_KEY`
2. 实现 AI 生成 API
3. 在内容管理页使用

---

## 六、下一步

### 6.1 如果你是开发者

继续阅读:
- **[开发指南](DEVELOPMENT.md)** - 详细开发流程
- **[技术架构](ARCHITECTURE.md)** - 系统架构设计
- **[升级方案](UPGRADE_PLAN.md)** - 从原型到生产

### 6.2 如果你是运营者

继续阅读:
- **[运营战略](../STRATEGY.md)** - Twitter 矩阵运营战略
- **[爆款模板](../templates/viral-templates.md)** - 5个爆款模板

### 6.3 开始升级

按照 [UPGRADE_PLAN.md](UPGRADE_PLAN.md) 的 Phase 1-4:
1. **Phase 1**: Supabase 集成 (4天)
2. **Phase 2**: AI + Twitter API (6天)
3. **Phase 3**: 功能完善 (5天)
4. **Phase 4**: 优化上线 (4天)

---

## 七、获取帮助

- **GitHub Issues**: [提交问题](https://github.com/sit-in/tmatrix/issues)
- **Twitter**: [@sitinme](https://twitter.com/sitinme)
- **微信**: 257735

---

**快速命令参考**

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 数据库
pnpm db:migrate       # 运行迁移
pnpm db:reset         # 重置数据库

# 部署
vercel --prod         # 部署到 Vercel
```

---

**现在开始使用 TMatrix Lite，系统化地增长你的 Twitter!**

---

END OF DOCUMENT
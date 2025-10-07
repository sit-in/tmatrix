# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-10-07

### 🎯 **重大变更: 回退到单用户MVP**

**决策原因**: 多用户功能引入了大量技术债和复杂性，但没有RLS安全策略。为了代码质量和稳定性，回退到单用户MVP版本。

### ✅ Added
- 创建统一的类型定义系统 (`lib/types.ts`)
- 添加环境变量验证（Supabase URL和Key）
- 创建单用户数据库schema (`lib/supabase/schema-single-user.sql`)
- 添加部署指南 (`DEPLOY.md`)
- 添加本CHANGELOG文件

### 🔄 Changed
- **统一命名规范**: 全部改为snake_case（与数据库一致）
  - `draftId` → `draft_id`
  - `postedAt` → `posted_at`
  - `estFollows` → `est_follows`
  - `linkClicks` → `link_clicks`
  - 等等...
- 简化 `lib/store-supabase.ts` - 移除所有user_email相关逻辑
- 更新 `app/page.tsx` - 删除UserSwitcher组件
- 更新 `app/content/page.tsx` - 修复字段命名
- 更新 `app/data/page.tsx` - 修复字段命名

### 🗑️ Removed
- 删除旧的 `lib/store.ts`（已被store-supabase.ts替代）
- 删除所有测试脚本和临时测试文件
  - `test-conversion.mjs`
  - `test-supabase.mjs`
  - `tests/` 目录及所有测试文件
- 删除 `components/user-switcher.tsx`
- 删除数据库中的user_email字段（通过新schema）
- 删除localStorage相关代码

### 🐛 Fixed
- 修复TypeScript编译错误（命名不一致导致）
- 修复daily_tasks表的goal字段默认值
- 修复importData功能（现在真正导入到Supabase）

### 📝 Documentation
- 更新README - 明确标注单用户MVP状态
- 更新安装步骤 - 指向正确的SQL文件
- 添加当前限制和未来规划说明

### 🏗️ Architecture
- **代码质量提升**:
  - 移除技术债（两个store并存的问题）
  - 统一命名规范
  - 完整的TypeScript类型覆盖
- **数据层简化**:
  - 单一数据源（Supabase）
  - 移除LocalStorage混用
  - 清晰的CRUD操作

---

## [0.1.0] - 2025-09-30

### 🎉 Initial Release

- Dashboard页面（KPI展示、趋势图、Top推文）
- 内容管理页面（Idea收集、模板管理、草稿创建）
- 数据追踪页面（指标录入、CSV导入）
- LocalStorage数据持久化
- Zustand状态管理
- shadcn/ui组件库

### ⚠️ Known Issues (v0.1.0)
- 数据存储在LocalStorage（刷新缓存会丢失）
- 命名规范不统一（camelCase和snake_case混用）
- 存在两个store文件（技术债）

---

## Versioning

版本号遵循 [Semantic Versioning](https://semver.org/):
- **MAJOR** (主版本): 不兼容的API变更
- **MINOR** (次版本): 向后兼容的功能新增
- **PATCH** (修订版本): 向后兼容的问题修复

---

## 下一个版本规划

### [0.3.0] - 计划中
- [ ] Toast错误提示系统
- [ ] Loading Skeleton优化
- [ ] 数据导入/导出优化
- [ ] 完整的E2E测试

### [1.0.0] - 未来版本
- [ ] 用户认证系统
- [ ] 多用户支持（RLS策略）
- [ ] AI内容生成
- [ ] Twitter API集成
- [ ] 性能优化（React Query）

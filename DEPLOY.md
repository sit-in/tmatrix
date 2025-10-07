# TMatrix 部署指南 - 单用户MVP版本

## 🚀 快速部署（30分钟）

### Step 1: 创建Supabase数据库 (10分钟)

1. **登录Supabase**
   ```
   https://supabase.com/dashboard
   ```

2. **创建项目**（如果还没有）
   - Project Name: `tmatrix-mvp`
   - Database Password: 保存好密码
   - Region: Hong Kong (或离你最近的区域)

3. **执行SQL创建表**
   - 进入项目 → SQL Editor
   - 粘贴 `lib/supabase/schema-single-user.sql` 的内容
   - 点击 RUN 执行

4. **获取API Keys**
   - Settings → API
   - 复制以下内容：
     - `Project URL` → 这是你的 `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public` key → 这是你的 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: 本地测试 (5分钟)

```bash
# 1. 确保.env.local已配置
cat .env.local
# 应该包含:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 2. 启动开发服务器
pnpm dev

# 3. 打开浏览器测试
open http://localhost:3000

# 4. 测试清单:
# ✅ Dashboard能打开
# ✅ 点击"微信引流"的+按钮，数字会增加
# ✅ 刷新页面，数据还在（说明Supabase连接成功）
```

### Step 3: 部署到Vercel (15分钟)

```bash
# 1. 提交代码
git add .
git commit -m "feat: 单用户MVP版本完成 - 删除多用户功能，统一snake_case命名"
git push

# 2. 安装Vercel CLI（如果没有）
npm i -g vercel

# 3. 登录Vercel
vercel login

# 4. 部署
vercel --prod

# 5. 在部署过程中，添加环境变量:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 4: 验证线上环境 (5分钟)

```bash
# 1. 访问你的生产URL
# Vercel会显示: https://your-project.vercel.app

# 2. 测试清单:
# ✅ Dashboard加载正常
# ✅ 点击按钮有反应
# ✅ 刷新后数据还在
# ✅ Chrome DevTools Console 没有红色错误
```

---

## ⚠️ 当前版本说明

### ✅ 已实现
- Dashboard数据展示
- Supabase数据持久化
- 手动录入推文数据
- 数据导出/导入
- 环境变量验证

### ❌ 暂未实现
- ❌ 多用户支持（单用户MVP）
- ❌ AI内容生成
- ❌ Twitter API自动同步
- ❌ 用户认证系统
- ❌ Toast错误提示

### 🔧 已知限制
1. **单用户使用** - 所有人看到同一份数据
2. **需手动录入** - 暂无Twitter API集成
3. **无错误反馈** - 操作失败时没有Toast提示

---

## 🐛 常见问题

### 问题1: 构建失败 - "Missing env"
```
解决: 检查.env.local文件是否存在且配置正确
```

### 问题2: Dashboard显示"加载中..."不消失
```
解决:
1. 打开Chrome DevTools Console查看错误
2. 检查Supabase URL和KEY是否正确
3. 确认数据库表已创建
```

### 问题3: 点击按钮没反应
```
解决:
1. 查看Console是否有错误
2. 确认Supabase连接正常
3. 检查数据库表结构是否正确
```

---

## 📞 需要帮助？

如果部署过程中遇到问题：
1. 检查这个文件的常见问题
2. 查看浏览器Console的错误信息
3. 在GitHub Issues提问（附上错误截图）

---

**部署成功后，记得在README中更新生产环境URL！** 🎉

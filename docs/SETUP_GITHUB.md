# GitHub 仓库设置指南

## 步骤1: 创建GitHub仓库

1. 访问 https://github.com/new
2. 填写信息：
   - Repository name: `tmatrix`
   - Description: `TMatrix Lite - Twitter 内容管理与数据分析工具`
   - Visibility: **Private** (私有)
   - ❌ 不要勾选 "Add a README file"
   - ❌ 不要添加 .gitignore
   - ❌ 不要选择 license

3. 点击 "Create repository"

## 步骤2: 推送代码

在终端执行以下命令:

```bash
# 1. 确认你在项目目录
cd /Users/sitin/Documents/千里会/code/website/tmatrix

# 2. 检查git状态（应该已经有一个commit）
git log --oneline

# 3. 添加远程仓库
git remote add origin https://github.com/sit-in/tmatrix.git

# 4. 推送代码
git push -u origin main
```

## 步骤3: 验证

1. 刷新 https://github.com/sit-in/tmatrix
2. 应该能看到所有文件
3. 确认 STRATEGY.md 和 docs/UPGRADE_PLAN.md 都在

## 常见问题

### 如果提示需要认证

**方法1: 使用 GitHub Personal Access Token**

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选权限: `repo` (全部)
4. 生成token并复制

推送时输入:
- Username: `sit-in`
- Password: `粘贴你的token`

**方法2: 使用 SSH (推荐)**

```bash
# 1. 生成SSH密钥（如果没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 3. 添加到GitHub
# 访问 https://github.com/settings/ssh/new
# 粘贴公钥

# 4. 更改远程地址为SSH
git remote set-url origin git@github.com:sit-in/tmatrix.git

# 5. 推送
git push -u origin main
```

### 如果报错 "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/sit-in/tmatrix.git
```

---

**完成后回来告诉我，继续下一步。**
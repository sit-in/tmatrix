-- TMatrix 单用户MVP版本数据库Schema
-- 创建日期: 2025-10-07
-- 说明: 简化版schema，移除user_email字段，专注单用户使用

-- ============= 清理旧表（如果需要重建） =============
-- DROP TABLE IF EXISTS metrics CASCADE;
-- DROP TABLE IF EXISTS drafts CASCADE;
-- DROP TABLE IF EXISTS daily_tasks CASCADE;
-- DROP TABLE IF EXISTS ideas CASCADE;
-- DROP TABLE IF EXISTS templates CASCADE;

-- ============= 创建表 =============

-- 1. 草稿表
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  lang TEXT DEFAULT 'zh' CHECK (lang IN ('zh', 'en')),
  variant TEXT DEFAULT 'A' CHECK (variant IN ('A', 'B', 'EN')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted')),
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  idea_id TEXT,
  template_id TEXT
);

-- 2. 指标表
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  est_follows INTEGER DEFAULT 0,
  bookmarks INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 每日任务表
CREATE TABLE IF NOT EXISTS daily_tasks (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_count INTEGER DEFAULT 0,
  goal JSONB NOT NULL DEFAULT '{"tweets": 2, "interactions": 20}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Idea表
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK (source_type IN ('text', 'link')),
  source TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 模板表
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('zh', 'en')),
  category TEXT NOT NULL CHECK (category IN ('case', 'tools', 'experience', 'data', 'engage')),
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============= 创建索引 =============

CREATE INDEX IF NOT EXISTS idx_drafts_status ON drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_posted_at ON drafts(posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_draft_id ON metrics(draft_id);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date DESC);

CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_tags ON ideas USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_lang ON templates(lang);

-- ============= 插入初始数据 =============

-- 插入默认模板
INSERT INTO templates (id, title, lang, category, variables, body, created_at) VALUES
  ('tpl_case_zh', '赚钱案例（中文）', 'zh', 'case',
   '[{"name":"tool","description":"使用的工具"},{"name":"days","description":"天数"},{"name":"amount","description":"金额"},{"name":"step1","description":"步骤1"},{"name":"step2","description":"步骤2"},{"name":"step3","description":"步骤3"},{"name":"kw","description":"关键词"}]'::jsonb,
   '我用 {{tool}} 做了 {{days}} 天，收入 ${{amount}}。流程：1) {{step1}} 2) {{step2}} 3) {{step3}} 想拿 SOP 留言「{{kw}}」。',
   NOW()),
  ('tpl_tools_zh', '工具清单（中文）', 'zh', 'tools',
   '[{"name":"n","description":"工具数量"},{"name":"list","description":"工具列表"},{"name":"hours","description":"节省时间"}]'::jsonb,
   '{{n}} 个我每天用的 AI 工具：\n{{list}}\n每个都能省下 {{hours}} 小时/周。需要教程留「教程」。',
   NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例Idea
INSERT INTO ideas (id, source_type, source, tags, created_at) VALUES
  ('idea_example_1', 'text', '用 RPA 批量清洗商品图', ARRAY['RPA', '电商'], NOW())
ON CONFLICT (id) DO NOTHING;

-- ============= 完成 =============
-- 执行完成后可以运行以下语句验证:
-- SELECT 'drafts' as table_name, count(*) as count FROM drafts
-- UNION ALL
-- SELECT 'metrics', count(*) FROM metrics
-- UNION ALL
-- SELECT 'daily_tasks', count(*) FROM daily_tasks
-- UNION ALL
-- SELECT 'ideas', count(*) FROM ideas
-- UNION ALL
-- SELECT 'templates', count(*) FROM templates;

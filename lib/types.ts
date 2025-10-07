/**
 * TMatrix 类型定义 - 单用户MVP版本
 *
 * 命名规范: 统一使用snake_case（与Supabase保持一致）
 */

export interface Draft {
  id: string
  content: string
  lang: 'zh' | 'en'
  variant: 'A' | 'B' | 'EN'
  status: 'draft' | 'scheduled' | 'posted'
  posted_at?: string
  created_at?: string
  idea_id?: string
  template_id?: string
  is_viral_attempt?: boolean
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
  bookmarks?: number
  link_clicks?: number
}

export interface DailyTask {
  id: string
  date: string
  items: { text: string; done: boolean }[]
  lead_count: number
  goal: { tweets: number; interactions: number }
}

export interface Idea {
  id: string
  source_type: 'text' | 'link'
  source: string
  tags: string[]
  created_at?: string
}

export interface Template {
  id: string
  title: string
  lang: 'zh' | 'en'
  category: 'case' | 'tools' | 'experience' | 'data' | 'engage'
  variables: Array<{ name: string; description: string }>
  body: string
  created_at?: string
}

// ============= 工具函数 =============

export const calculateEngagementRate = (metric: Metric): number => {
  if (metric.impressions === 0) return 0
  return ((metric.likes + metric.replies + metric.reposts) / metric.impressions) * 100
}

export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

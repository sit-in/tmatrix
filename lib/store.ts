"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// 类型定义
export interface Template {
  id: string
  title: string
  lang: "zh" | "en"
  category: string
  variables: Record<string, string>
  body: string
}

export interface Idea {
  id: string
  sourceType: "link" | "text"
  source: string
  tags: string[]
  createdAt: string
}

export interface Draft {
  id: string
  ideaId?: string
  templateId?: string
  lang: "zh" | "en"
  variant: "A" | "B" | "EN"
  content: string
  status: "draft" | "scheduled" | "posted"
  scheduledAt?: string
  postedAt?: string
  isViralAttempt?: boolean
}

export interface Metric {
  id: string
  draftId: string
  date: string
  impressions: number
  likes: number
  replies: number
  reposts: number
  bookmarks: number
  linkClicks: number
  estFollows: number
}

export interface DailyTask {
  id: string
  date: string
  items: { text: string; done: boolean }[]
  goal: { tweets: number; interactions: number }
}

interface AppState {
  templates: Template[]
  ideas: Idea[]
  drafts: Draft[]
  metrics: Metric[]
  dailyTasks: DailyTask[]
  todayLeadCount: number

  // Actions
  addTemplate: (template: Template) => void
  updateTemplate: (id: string, template: Partial<Template>) => void
  deleteTemplate: (id: string) => void

  addIdea: (idea: Idea) => void
  updateIdea: (id: string, idea: Partial<Idea>) => void
  deleteIdea: (id: string) => void

  addDraft: (draft: Draft) => void
  updateDraft: (id: string, draft: Partial<Draft>) => void
  deleteDraft: (id: string) => void

  addMetric: (metric: Metric) => void
  updateMetric: (id: string, metric: Partial<Metric>) => void
  deleteMetric: (id: string) => void

  updateDailyTask: (date: string, task: Partial<DailyTask>) => void
  incrementLeadCount: () => void

  exportData: () => string
  importData: (jsonString: string) => void
}

// 初始数据
const initialData = {
  templates: [
    {
      id: "tpl_case_zh",
      title: "赚钱案例（中文）",
      lang: "zh" as const,
      category: "case",
      variables: {
        tool: "string",
        days: "number",
        amount: "number",
        step1: "string",
        step2: "string",
        step3: "string",
        kw: "string",
      },
      body: "我用 {{tool}} 做了 {{days}} 天，收入 ${{amount}}。流程：1) {{step1}} 2) {{step2}} 3) {{step3}} 想拿 SOP 留言「{{kw}}」。",
    },
    {
      id: "tpl_tools_zh",
      title: "工具清单（中文）",
      lang: "zh" as const,
      category: "tools",
      variables: {
        n: "number",
        list: "string",
        hours: "number",
      },
      body: "{{n}} 个我每天用的 AI 工具：\n{{list}}\n每个都能省下 {{hours}} 小时/周。需要教程留「教程」。",
    },
  ],
  ideas: [
    {
      id: "idea_1",
      sourceType: "text" as const,
      source: "用 RPA 批量清洗商品图",
      tags: ["RPA", "电商"],
      createdAt: "2025-09-30",
    },
  ],
  drafts: [
    {
      id: "d1",
      ideaId: "idea_1",
      templateId: "tpl_case_zh",
      lang: "zh" as const,
      variant: "A" as const,
      content: "示例内容A",
      status: "draft" as const,
    },
    {
      id: "d2",
      ideaId: "idea_1",
      templateId: "tpl_case_zh",
      lang: "zh" as const,
      variant: "B" as const,
      content: "示例内容B",
      status: "scheduled" as const,
      scheduledAt: "2025-10-01T20:00",
    },
    {
      id: "d3",
      ideaId: "idea_1",
      templateId: "tpl_case_zh",
      lang: "en" as const,
      variant: "EN" as const,
      content: "Sample EN",
      status: "posted" as const,
      postedAt: "2025-09-29T20:00",
    },
  ],
  metrics: [
    {
      id: "m1",
      draftId: "d3",
      date: "2025-09-30",
      impressions: 12000,
      likes: 180,
      replies: 22,
      reposts: 40,
      bookmarks: 15,
      linkClicks: 90,
      estFollows: 24,
    },
  ],
  dailyTasks: [
    {
      id: "t20250930",
      date: "2025-09-30",
      items: [
        { text: "Publish 2 tweets", done: false },
        { text: "20 interactions", done: false },
        { text: "Pin/Review CTA", done: true },
      ],
      goal: { tweets: 2, interactions: 20 },
    },
  ],
  todayLeadCount: 0,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, template],
        })),

      updateTemplate: (id, template) =>
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, ...template } : t)),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      addIdea: (idea) =>
        set((state) => ({
          ideas: [...state.ideas, idea],
        })),

      updateIdea: (id, idea) =>
        set((state) => ({
          ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...idea } : i)),
        })),

      deleteIdea: (id) =>
        set((state) => ({
          ideas: state.ideas.filter((i) => i.id !== id),
        })),

      addDraft: (draft) =>
        set((state) => ({
          drafts: [...state.drafts, draft],
        })),

      updateDraft: (id, draft) =>
        set((state) => ({
          drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...draft } : d)),
        })),

      deleteDraft: (id) =>
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
        })),

      addMetric: (metric) =>
        set((state) => ({
          metrics: [...state.metrics, metric],
        })),

      updateMetric: (id, metric) =>
        set((state) => ({
          metrics: state.metrics.map((m) => (m.id === id ? { ...m, ...metric } : m)),
        })),

      deleteMetric: (id) =>
        set((state) => ({
          metrics: state.metrics.filter((m) => m.id !== id),
        })),

      updateDailyTask: (date, task) =>
        set((state) => {
          const existing = state.dailyTasks.find((t) => t.date === date)
          if (existing) {
            return {
              dailyTasks: state.dailyTasks.map((t) => (t.date === date ? { ...t, ...task } : t)),
            }
          } else {
            return {
              dailyTasks: [
                ...state.dailyTasks,
                {
                  id: `t${date.replace(/-/g, "")}`,
                  date,
                  ...task,
                } as DailyTask,
              ],
            }
          }
        }),

      incrementLeadCount: () =>
        set((state) => ({
          todayLeadCount: state.todayLeadCount + 1,
        })),

      exportData: () => {
        const state = get()
        return JSON.stringify(
          {
            templates: state.templates,
            ideas: state.ideas,
            drafts: state.drafts,
            metrics: state.metrics,
            dailyTasks: state.dailyTasks,
            todayLeadCount: state.todayLeadCount,
          },
          null,
          2,
        )
      },

      importData: (jsonString) => {
        try {
          const data = JSON.parse(jsonString)
          set({
            templates: data.templates || [],
            ideas: data.ideas || [],
            drafts: data.drafts || [],
            metrics: data.metrics || [],
            dailyTasks: data.dailyTasks || [],
            todayLeadCount: data.todayLeadCount || 0,
          })
        } catch (error) {
          console.error("导入数据失败:", error)
        }
      },
    }),
    {
      name: "tmatrix-storage",
    },
  ),
)

// 辅助函数
export const calculateEngagementRate = (metric: Metric): number => {
  if (metric.impressions === 0) return 0
  return ((metric.likes + metric.replies + metric.reposts) / metric.impressions) * 100
}

export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

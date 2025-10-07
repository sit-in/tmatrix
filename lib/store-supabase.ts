"use client"

import { create } from 'zustand'
import { supabase } from './supabase'
import type { Draft, Metric, DailyTask, Idea, Template } from './types'
import { calculateEngagementRate, generateId } from './types'

// 重新导出工具函数
export { calculateEngagementRate, generateId }

// ============= Store定义 =============

interface AppState {
  // 状态
  drafts: Draft[]
  metrics: Metric[]
  dailyTasks: DailyTask[]
  ideas: Idea[]
  templates: Template[]
  todayLeadCount: number
  isLoading: boolean

  // Drafts Actions
  fetchDrafts: () => Promise<void>
  addDraft: (draft: Omit<Draft, 'created_at'>) => Promise<void>
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>
  deleteDraft: (id: string) => Promise<void>

  // Metrics Actions
  fetchMetrics: () => Promise<void>
  addMetric: (metric: Metric) => Promise<void>
  updateMetric: (id: string, updates: Partial<Metric>) => Promise<void>
  deleteMetric: (id: string) => Promise<void>

  // DailyTasks Actions
  fetchDailyTasks: () => Promise<void>
  updateDailyTask: (date: string, updates: Partial<DailyTask>) => Promise<void>
  incrementLeadCount: () => Promise<void>

  // Ideas Actions
  fetchIdeas: () => Promise<void>
  addIdea: (idea: Omit<Idea, 'created_at'>) => Promise<void>
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>

  // Templates Actions
  fetchTemplates: () => Promise<void>
  addTemplate: (template: Omit<Template, 'created_at'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>

  // 工具函数
  exportData: () => string
  importData: (jsonString: string) => Promise<void>
  fetchAllData: () => Promise<void>
}

export const useStore = create<AppState>((set, get) => ({
  // ============= 初始状态 =============
  drafts: [],
  metrics: [],
  dailyTasks: [],
  ideas: [],
  templates: [],
  todayLeadCount: 0,
  isLoading: false,

  // ============= Drafts =============
  fetchDrafts: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ drafts: data || [], isLoading: false })
    } catch (error) {
      console.error('Fetch drafts error:', error)
      set({ isLoading: false })
    }
  },

  addDraft: async (draft) => {
    try {
      const { error } = await supabase.from('drafts').insert(draft)
      if (error) throw error
      await get().fetchDrafts()
    } catch (error) {
      console.error('Add draft error:', error)
      throw error
    }
  },

  updateDraft: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('drafts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await get().fetchDrafts()
    } catch (error) {
      console.error('Update draft error:', error)
      throw error
    }
  },

  deleteDraft: async (id) => {
    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await get().fetchDrafts()
    } catch (error) {
      console.error('Delete draft error:', error)
      throw error
    }
  },

  // ============= Metrics =============
  fetchMetrics: async () => {
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      set({ metrics: data || [] })
    } catch (error) {
      console.error('Fetch metrics error:', error)
    }
  },

  addMetric: async (metric) => {
    try {
      const { error } = await supabase.from('metrics').insert(metric)
      if (error) throw error
      await get().fetchMetrics()
    } catch (error) {
      console.error('Add metric error:', error)
      throw error
    }
  },

  updateMetric: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('metrics')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await get().fetchMetrics()
    } catch (error) {
      console.error('Update metric error:', error)
      throw error
    }
  },

  deleteMetric: async (id) => {
    try {
      const { error } = await supabase
        .from('metrics')
        .delete()
        .eq('id', id)

      if (error) throw error
      await get().fetchMetrics()
    } catch (error) {
      console.error('Delete metric error:', error)
      throw error
    }
  },

  // ============= DailyTasks =============
  fetchDailyTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)

      if (error) throw error
      set({ dailyTasks: data || [] })

      // 更新今日引流计数
      const today = new Date().toISOString().split('T')[0]
      const todayTask = data?.find((t: DailyTask) => t.date === today)
      set({ todayLeadCount: todayTask?.lead_count || 0 })
    } catch (error) {
      console.error('Fetch daily tasks error:', error)
    }
  },

  updateDailyTask: async (date, updates) => {
    try {
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
          items: updates.items || [],
          lead_count: updates.lead_count || 0,
          goal: updates.goal || { tweets: 2, interactions: 20 }
        })
      }

      await get().fetchDailyTasks()
    } catch (error) {
      console.error('Update daily task error:', error)
      throw error
    }
  },

  incrementLeadCount: async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: task, error: fetchError } = await supabase
        .from('daily_tasks')
        .select('lead_count, items')
        .eq('date', today)
        .single()

      if (fetchError) {
        // 如果今日任务不存在,创建一个
        const { error: insertError } = await supabase.from('daily_tasks').insert({
          id: `t${today.replace(/-/g, '')}`,
          date: today,
          items: [
            { text: '发布 2 条推文', done: false },
            { text: '完成 20 次互动', done: false },
            { text: '置顶/检查 CTA', done: false }
          ],
          lead_count: 1,
          goal: { tweets: 2, interactions: 20 }
        })
        if (insertError) throw insertError

        set({ todayLeadCount: 1 })
        await get().fetchDailyTasks()
        return
      }

      const newCount = (task?.lead_count || 0) + 1

      const { error: updateError } = await supabase
        .from('daily_tasks')
        .update({ lead_count: newCount })
        .eq('date', today)

      if (updateError) throw updateError

      set({ todayLeadCount: newCount })
      await get().fetchDailyTasks()
    } catch (error) {
      console.error('Increment lead count error:', error)
      throw error
    }
  },

  // ============= Ideas =============
  fetchIdeas: async () => {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ ideas: data || [] })
    } catch (error) {
      console.error('Fetch ideas error:', error)
    }
  },

  addIdea: async (idea) => {
    try {
      const { error } = await supabase.from('ideas').insert(idea)
      if (error) throw error
      await get().fetchIdeas()
    } catch (error) {
      console.error('Add idea error:', error)
      throw error
    }
  },

  updateIdea: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await get().fetchIdeas()
    } catch (error) {
      console.error('Update idea error:', error)
      throw error
    }
  },

  deleteIdea: async (id) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id)

      if (error) throw error
      await get().fetchIdeas()
    } catch (error) {
      console.error('Delete idea error:', error)
      throw error
    }
  },

  // ============= Templates =============
  fetchTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ templates: data || [] })
    } catch (error) {
      console.error('Fetch templates error:', error)
    }
  },

  addTemplate: async (template) => {
    try {
      const { error } = await supabase.from('templates').insert(template)
      if (error) throw error
      await get().fetchTemplates()
    } catch (error) {
      console.error('Add template error:', error)
      throw error
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await get().fetchTemplates()
    } catch (error) {
      console.error('Update template error:', error)
      throw error
    }
  },

  deleteTemplate: async (id) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      await get().fetchTemplates()
    } catch (error) {
      console.error('Delete template error:', error)
      throw error
    }
  },

  // ============= 工具函数 =============
  fetchAllData: async () => {
    const { fetchDrafts, fetchMetrics, fetchDailyTasks, fetchIdeas, fetchTemplates } = get()
    await Promise.all([
      fetchDrafts(),
      fetchMetrics(),
      fetchDailyTasks(),
      fetchIdeas(),
      fetchTemplates()
    ])
  },

  exportData: () => {
    const state = get()
    return JSON.stringify(
      {
        drafts: state.drafts,
        metrics: state.metrics,
        dailyTasks: state.dailyTasks,
        ideas: state.ideas,
        templates: state.templates,
      },
      null,
      2
    )
  },

  importData: async (jsonString) => {
    try {
      const data = JSON.parse(jsonString)

      // 批量插入数据
      const promises = []

      if (data.drafts?.length) {
        promises.push(supabase.from('drafts').insert(data.drafts))
      }
      if (data.metrics?.length) {
        promises.push(supabase.from('metrics').insert(data.metrics))
      }
      if (data.dailyTasks?.length) {
        promises.push(supabase.from('daily_tasks').insert(data.dailyTasks))
      }
      if (data.ideas?.length) {
        promises.push(supabase.from('ideas').insert(data.ideas))
      }
      if (data.templates?.length) {
        promises.push(supabase.from('templates').insert(data.templates))
      }

      await Promise.all(promises)
      await get().fetchAllData()

      return '导入成功'
    } catch (error) {
      console.error('导入数据失败:', error)
      throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  },
}))

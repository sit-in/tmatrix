"use client"

import type React from "react"

import { useStore, calculateEngagementRate } from "@/lib/store-supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import {
  TrendingUp,
  MessageSquare,
  FileText,
  Zap,
  Plus,
  Download,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function DashboardPage() {
  const {
    metrics,
    drafts,
    dailyTasks,
    todayLeadCount,
    isLoading,
    fetchMetrics,
    fetchDrafts,
    fetchDailyTasks,
    incrementLeadCount,
    updateDailyTask,
    exportData,
    importData
  } = useStore()

  // 加载数据
  useEffect(() => {
    fetchMetrics()
    fetchDrafts()
    fetchDailyTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [leadInput, setLeadInput] = useState("")
  const today = format(new Date(), "yyyy-MM-dd")

  // 获取今日任务
  const todayTask = useMemo(() => {
    let task = dailyTasks.find((t) => t.date === today)
    if (!task) {
      task = {
        id: `t${today.replace(/-/g, "")}`,
        date: today,
        items: [
          { text: "发布 2 条推文", done: false },
          { text: "完成 20 次互动", done: false },
          { text: "置顶/检查 CTA", done: false },
        ],
        lead_count: 0,
        goal: { tweets: 2, interactions: 20 }
      }
    }
    // 确保goal存在
    if (!task.goal) {
      task.goal = { tweets: 2, interactions: 20 }
    }
    return task
  }, [dailyTasks, today])

  // 计算过去7天的数据
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd")
      days.push(date)
    }
    return days
  }, [])

  // KPI 1: 新增关注（本周）
  const newFollowersThisWeek = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    return metrics.filter((m) => new Date(m.date) >= weekStart).reduce((sum, m) => sum + m.est_follows, 0)
  }, [metrics])

  // KPI 3: 已发布推文（过去7天）
  const tweetsPosted = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    return drafts.filter((d) => d.status === "posted" && d.posted_at && new Date(d.posted_at) >= weekStart).length
  }, [drafts])

  // KPI 4: 爆款尝试（过去7天，impressions > 10000 或手动标记）
  const viralAttempts = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    const recentDrafts = drafts.filter((d) => {
      if (!d.posted_at) return false
      const postedDate = new Date(d.posted_at)
      return postedDate >= weekStart
    })

    return recentDrafts.filter((d) => {
      if (d.is_viral_attempt) return true
      const metric = metrics.find((m) => m.draft_id === d.id)
      if (!metric) return false
      const isViralCategory = d.template_id?.includes("case") || d.template_id?.includes("tools")
      return isViralCategory && metric.impressions > 10000
    }).length
  }, [drafts, metrics])

  // 7天趋势数据
  const trendData = useMemo(() => {
    return last7Days.map((date) => {
      const dayMetrics = metrics.filter((m) => m.date === date)
      const totalImpressions = dayMetrics.reduce((sum, m) => sum + m.impressions, 0)
      const avgEngagement =
        dayMetrics.length > 0
          ? dayMetrics.reduce((sum, m) => sum + calculateEngagementRate(m), 0) / dayMetrics.length
          : 0

      return {
        date: format(new Date(date), "MM/dd", { locale: zhCN }),
        impressions: totalImpressions,
        engagementRate: Number(avgEngagement.toFixed(2)),
      }
    })
  }, [last7Days, metrics])

  // Top 推文（过去7天）
  const topTweets = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    const recentMetrics = metrics.filter((m) => new Date(m.date) >= weekStart)

    return recentMetrics
      .map((m) => {
        const draft = drafts.find((d) => d.id === m.draft_id)
        return {
          ...m,
          draft,
          engagementRate: calculateEngagementRate(m),
        }
      })
      .filter((m) => m.draft)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 5)
  }, [metrics, drafts])

  // 处理任务勾选
  const handleTaskToggle = (index: number) => {
    const newItems = [...todayTask.items]
    newItems[index].done = !newItems[index].done
    updateDailyTask(today, { items: newItems })
  }

  // 计算进度
  const progress = useMemo(() => {
    const completed = todayTask.items.filter((i) => i.done).length
    return (completed / todayTask.items.length) * 100
  }, [todayTask])

  // 导出数据
  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tmatrix-export-${format(new Date(), "yyyy-MM-dd")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      importData(content)
    }
    reader.readAsText(file)
  }

  // Loading状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      {/* 顶部标题 + 操作按钮 */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">实时追踪你的 Twitter 增长数据</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="apple-hover"
            >
              <Download className="h-4 w-4 mr-2" />
              导出数据
            </Button>
            <Button variant="ghost" size="sm" asChild className="apple-hover">
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                导入数据
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI 卡片 - 4 列网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: 新增关注 */}
        <div className="glass dark:glass-dark apple-shadow apple-hover rounded-3xl p-6 animate-fade-in-up">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-2xl gradient-apple-blue">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-4xl font-semibold mb-1">{newFollowersThisWeek}</div>
          <p className="text-sm text-muted-foreground">新增关注</p>
          <p className="text-xs text-muted-foreground/60 mt-1">本周累计</p>
        </div>

        {/* KPI 2: 微信引流 */}
        <div className="glass dark:glass-dark apple-shadow apple-hover rounded-3xl p-6 animate-fade-in-up delay-100">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-2xl gradient-apple-purple">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-4xl font-semibold">{todayLeadCount}</div>
            <Button
              size="sm"
              onClick={incrementLeadCount}
              className="h-8 w-8 p-0 rounded-full apple-shadow-sm hover:apple-shadow"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">微信引流</p>
          <p className="text-xs text-muted-foreground/60 mt-1">今日录入</p>
        </div>

        {/* KPI 3: 已发推文 */}
        <div className="glass dark:glass-dark apple-shadow apple-hover rounded-3xl p-6 animate-fade-in-up delay-200">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-2xl gradient-apple-green">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-4xl font-semibold mb-1">{tweetsPosted}</div>
          <p className="text-sm text-muted-foreground">已发推文</p>
          <p className="text-xs text-muted-foreground/60 mt-1">过去 7 天</p>
        </div>

        {/* KPI 4: 爆款尝试 */}
        <div className="glass dark:glass-dark apple-shadow apple-hover rounded-3xl p-6 animate-fade-in-up delay-300">
          <div className="flex items-start justify-between mb-6">
            <div className="p-3 rounded-2xl gradient-apple-orange">
              <Zap className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-4xl font-semibold mb-1">{viralAttempts}</div>
          <p className="text-sm text-muted-foreground">爆款尝试</p>
          <p className="text-xs text-muted-foreground/60 mt-1">&gt;10k 曝光</p>
        </div>
      </div>

      {/* 中间区域：图表和清单 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 7天趋势图 */}
        <div className="lg:col-span-2 glass dark:glass-dark apple-shadow-lg rounded-3xl p-8 animate-fade-in-up delay-400">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">7 天趋势</h2>
            <p className="text-sm text-muted-foreground">曝光量与互动率双轴展示</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--chart-1))"
                name="曝光量"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="engagementRate"
                stroke="hsl(var(--chart-2))"
                name="互动率 %"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 今日清单 */}
        <div className="glass dark:glass-dark apple-shadow-lg rounded-3xl p-8 animate-fade-in-up delay-400">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">今日清单</h2>
            <p className="text-sm text-muted-foreground">
              {todayTask.goal.tweets} 条推文 · {todayTask.goal.interactions} 次互动
            </p>
          </div>
          <div className="space-y-3 mb-6">
            {todayTask.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Checkbox id={`task-${index}`} checked={item.done} onCheckedChange={() => handleTaskToggle(index)} />
                <label
                  htmlFor={`task-${index}`}
                  className={`text-sm font-medium leading-none cursor-pointer flex-1 ${
                    item.done ? "line-through opacity-50" : ""
                  }`}
                >
                  {item.text}
                </label>
              </div>
            ))}
          </div>
          <div className="space-y-3 p-4 bg-muted/20 rounded-2xl">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>完成进度</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-apple-blue transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top 推文表格 */}
      <div className="glass dark:glass-dark apple-shadow-lg rounded-3xl p-8 animate-fade-in-up delay-400">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-1">Top 推文</h2>
          <p className="text-sm text-muted-foreground">过去 7 天按曝光量排序</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">日期</th>
                <th className="pb-4 text-left text-sm font-medium text-muted-foreground">变体</th>
                <th className="pb-4 text-right text-sm font-medium text-muted-foreground">曝光量</th>
                <th className="pb-4 text-right text-sm font-medium text-muted-foreground">互动率</th>
                <th className="pb-4 text-right text-sm font-medium text-muted-foreground">新增关注</th>
              </tr>
            </thead>
            <tbody>
              {topTweets.map((tweet) => (
                <tr
                  key={tweet.id}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 text-sm">
                    {format(new Date(tweet.date), "MM/dd", { locale: zhCN })}
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-medium bg-muted px-3 py-1.5 rounded-full">
                      {tweet.draft?.lang.toUpperCase()}-{tweet.draft?.variant}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-medium text-right">
                    {tweet.impressions.toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm font-medium">{tweet.engagementRate.toFixed(2)}%</span>
                      {tweet.engagementRate > 2 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium text-right">+{tweet.est_follows}</td>
                </tr>
              ))}
              {topTweets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

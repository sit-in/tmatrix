"use client"

import type React from "react"

import { useStore, calculateEngagementRate } from "@/lib/store"
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
import { useMemo, useState } from "react"
import { format, subDays } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function DashboardPage() {
  const { metrics, drafts, dailyTasks, todayLeadCount, incrementLeadCount, updateDailyTask, exportData, importData } =
    useStore()

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
        goal: { tweets: 2, interactions: 20 },
      }
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
    return metrics.filter((m) => new Date(m.date) >= weekStart).reduce((sum, m) => sum + m.estFollows, 0)
  }, [metrics])

  // KPI 3: 已发布推文（过去7天）
  const tweetsPosted = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    return drafts.filter((d) => d.status === "posted" && d.postedAt && new Date(d.postedAt) >= weekStart).length
  }, [drafts])

  // KPI 4: 爆款尝试（过去7天，impressions > 10000 或手动标记）
  const viralAttempts = useMemo(() => {
    const weekStart = subDays(new Date(), 7)
    const recentDrafts = drafts.filter((d) => {
      if (!d.postedAt) return false
      const postedDate = new Date(d.postedAt)
      return postedDate >= weekStart
    })

    return recentDrafts.filter((d) => {
      if (d.isViralAttempt) return true
      const metric = metrics.find((m) => m.draftId === d.id)
      if (!metric) return false
      const isViralCategory = d.templateId?.includes("case") || d.templateId?.includes("tools")
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
        const draft = drafts.find((d) => d.id === m.draftId)
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

  return (
    <div className="space-y-6">
      {/* 顶部操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出 JSON
        </Button>
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            导入 JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </Button>
      </div>

      {/* KPI 卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新增关注</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newFollowersThisWeek}</div>
            <p className="text-xs text-muted-foreground">本周累计</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">微信引流</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{todayLeadCount}</div>
              <Button size="sm" variant="ghost" onClick={incrementLeadCount} className="h-6 w-6 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">今日手动录入</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已发推文</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tweetsPosted}</div>
            <p className="text-xs text-muted-foreground">过去 7 天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">爆款尝试</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viralAttempts}</div>
            <p className="text-xs text-muted-foreground">过去 7 天 (&gt;10k 曝光)</p>
          </CardContent>
        </Card>
      </div>

      {/* 中间区域：图表和清单 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 7天趋势图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7 天趋势</CardTitle>
            <CardDescription>曝光量与互动率</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
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
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="engagementRate"
                  stroke="hsl(var(--chart-2))"
                  name="互动率 %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 今日清单 */}
        <Card>
          <CardHeader>
            <CardTitle>今日清单</CardTitle>
            <CardDescription>
              目标：{todayTask.goal.tweets} 条推文 / {todayTask.goal.interactions} 次互动
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {todayTask.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`task-${index}`} checked={item.done} onCheckedChange={() => handleTaskToggle(index)} />
                  <label
                    htmlFor={`task-${index}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                      item.done ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {item.text}
                  </label>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>完成进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 推文表格 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 推文（7天）</CardTitle>
          <CardDescription>按曝光量排序</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">日期</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">变体</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">曝光量</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">互动率</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">新增关注</th>
                </tr>
              </thead>
              <tbody>
                {topTweets.map((tweet) => (
                  <tr
                    key={tweet.id}
                    className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 text-sm">{format(new Date(tweet.date), "MM/dd", { locale: zhCN })}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                          {tweet.draft?.lang.toUpperCase()}-{tweet.draft?.variant}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium">{tweet.impressions.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{tweet.engagementRate.toFixed(2)}%</span>
                        {tweet.engagementRate > 2 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium">+{tweet.estFollows}</td>
                  </tr>
                ))}
                {topTweets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

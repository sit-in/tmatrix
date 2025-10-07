"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useStore, generateId, calculateEngagementRate } from "@/lib/store-supabase"
import type { Metric } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Plus, Download, Upload, ArrowUpDown } from "lucide-react"
import { format, subDays } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function DataPage() {
  const { metrics, drafts, templates, addMetric, updateMetric } = useStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState("")
  const [metricDate, setMetricDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [impressions, setImpressions] = useState("")
  const [likes, setLikes] = useState("")
  const [replies, setReplies] = useState("")
  const [reposts, setReposts] = useState("")
  const [bookmarks, setBookmarks] = useState("")
  const [linkClicks, setLinkClicks] = useState("")
  const [estFollows, setEstFollows] = useState("")

  const [sortField, setSortField] = useState<keyof Metric>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [dateFilter, setDateFilter] = useState("all")

  // 过滤和排序指标
  const filteredMetrics = useMemo(() => {
    let filtered = [...metrics]

    // 日期过滤
    if (dateFilter !== "all") {
      const days = Number.parseInt(dateFilter)
      const startDate = subDays(new Date(), days)
      filtered = filtered.filter((m) => new Date(m.date) >= startDate)
    }

    // 排序
    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? 0
      const bVal = b[sortField] ?? 0
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [metrics, sortField, sortOrder, dateFilter])

  // 添加指标
  const handleAddMetric = () => {
    if (!selectedDraft || !impressions) return

    const impressionsNum = Number.parseInt(impressions)
    const likesNum = Number.parseInt(likes) || 0
    const repliesNum = Number.parseInt(replies) || 0
    const repostsNum = Number.parseInt(reposts) || 0
    const bookmarksNum = Number.parseInt(bookmarks) || 0
    const linkClicksNum = Number.parseInt(linkClicks) || 0

    // 计算预估关注
    const calculatedEstFollows = estFollows ? Number.parseInt(estFollows) : Math.round(impressionsNum * 0.01 * 0.2)

    const metric: Metric = {
      id: generateId("metric"),
      draft_id: selectedDraft,
      date: metricDate,
      impressions: impressionsNum,
      likes: likesNum,
      replies: repliesNum,
      reposts: repostsNum,
      bookmarks: bookmarksNum,
      link_clicks: linkClicksNum,
      est_follows: calculatedEstFollows,
    }

    addMetric(metric)

    // 重置表单
    setSelectedDraft("")
    setImpressions("")
    setLikes("")
    setReplies("")
    setReposts("")
    setBookmarks("")
    setLinkClicks("")
    setEstFollows("")
    setIsAddDialogOpen(false)
  }

  // 导出 CSV
  const handleExportCSV = () => {
    const headers = [
      "日期",
      "草稿ID",
      "变体",
      "曝光量",
      "点赞",
      "回复",
      "转发",
      "收藏",
      "链接点击",
      "互动率%",
      "新增关注",
    ]
    const rows = filteredMetrics.map((m) => {
      const draft = drafts.find((d) => d.id === m.draft_id)
      const variant = draft ? `${draft.lang.toUpperCase()}-${draft.variant}` : "未知"
      return [
        m.date,
        m.draft_id,
        variant,
        m.impressions,
        m.likes,
        m.replies,
        m.reposts,
        m.bookmarks,
        m.link_clicks,
        calculateEngagementRate(m).toFixed(2),
        m.est_follows,
      ]
    })

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `metrics-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入 CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split("\n").slice(1) // 跳过标题行

      lines.forEach((line) => {
        if (!line.trim()) return
        const [date, draftId, , impressions, likes, replies, reposts, bookmarks, linkClicks, , estFollows] =
          line.split(",")

        const metric: Metric = {
          id: generateId("metric"),
          draft_id: draftId.trim(),
          date: date.trim(),
          impressions: Number.parseInt(impressions),
          likes: Number.parseInt(likes),
          replies: Number.parseInt(replies),
          reposts: Number.parseInt(reposts),
          bookmarks: Number.parseInt(bookmarks),
          link_clicks: Number.parseInt(linkClicks),
          est_follows: Number.parseInt(estFollows),
        }

        addMetric(metric)
      })
    }
    reader.readAsText(file)
  }

  // 图表数据：过去14天曝光量
  const impressionsChartData = useMemo(() => {
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd")
      last14Days.push(date)
    }

    return last14Days.map((date) => {
      const dayMetrics = metrics.filter((m) => m.date === date)
      const total = dayMetrics.reduce((sum, m) => sum + m.impressions, 0)
      return {
        date: format(new Date(date), "MM/dd", { locale: zhCN }),
        impressions: total,
      }
    })
  }, [metrics])

  // 图表数据：互动率趋势
  const engagementChartData = useMemo(() => {
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd")
      last14Days.push(date)
    }

    return last14Days.map((date) => {
      const dayMetrics = metrics.filter((m) => m.date === date)
      const avgEngagement =
        dayMetrics.length > 0
          ? dayMetrics.reduce((sum, m) => sum + calculateEngagementRate(m), 0) / dayMetrics.length
          : 0
      return {
        date: format(new Date(date), "MM/dd", { locale: zhCN }),
        engagementRate: Number(avgEngagement.toFixed(2)),
      }
    })
  }, [metrics])

  // 图表数据：按分类的关注贡献
  const categoryContributionData = useMemo(() => {
    const categoryMap = new Map<string, number>()

    metrics.forEach((m) => {
      const draft = drafts.find((d) => d.id === m.draft_id)
      if (!draft) return

      const template = templates.find((t) => t.id === draft.template_id)
      const category = template?.category || "未知"

      categoryMap.set(category, (categoryMap.get(category) || 0) + m.est_follows)
    })

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }))
  }, [metrics, drafts, templates])

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

  return (
    <div className="space-y-6">
      {/* 录入指标表单 */}
      <Card>
        <CardHeader>
          <CardTitle>录入指标</CardTitle>
          <CardDescription>为已发布的推文添加数据</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加指标
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>添加推文指标</DialogTitle>
                <DialogDescription>选择草稿并填写数据</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>选择草稿</Label>
                    <Select value={selectedDraft} onValueChange={setSelectedDraft}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择草稿" />
                      </SelectTrigger>
                      <SelectContent>
                        {drafts
                          .filter((d) => d.status === "posted")
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.lang.toUpperCase()}-{d.variant}: {d.content.slice(0, 30)}...
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>日期</Label>
                    <Input type="date" value={metricDate} onChange={(e) => setMetricDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>曝光量 *</Label>
                    <Input
                      type="number"
                      placeholder="12000"
                      value={impressions}
                      onChange={(e) => setImpressions(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>点赞</Label>
                    <Input type="number" placeholder="180" value={likes} onChange={(e) => setLikes(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>回复</Label>
                    <Input
                      type="number"
                      placeholder="22"
                      value={replies}
                      onChange={(e) => setReplies(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>转发</Label>
                    <Input
                      type="number"
                      placeholder="40"
                      value={reposts}
                      onChange={(e) => setReposts(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>收藏</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={bookmarks}
                      onChange={(e) => setBookmarks(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>链接点击</Label>
                    <Input
                      type="number"
                      placeholder="90"
                      value={linkClicks}
                      onChange={(e) => setLinkClicks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>新增关注（可选，留空自动计算）</Label>
                  <Input
                    type="number"
                    placeholder="自动计算：曝光量 × 0.01 × 0.2"
                    value={estFollows}
                    onChange={(e) => setEstFollows(e.target.value)}
                  />
                </div>

                <Button onClick={handleAddMetric} className="w-full">
                  保存指标
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 指标表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>指标表格</CardTitle>
              <CardDescription>查看和管理所有推文数据</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部时间</SelectItem>
                  <SelectItem value="7">过去 7 天</SelectItem>
                  <SelectItem value="14">过去 14 天</SelectItem>
                  <SelectItem value="30">过去 30 天</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                导出 CSV
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  导入 CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th
                    className="pb-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("date")
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }}
                  >
                    日期 <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">变体</th>
                  <th
                    className="pb-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => {
                      setSortField("impressions")
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }}
                  >
                    曝光量 <ArrowUpDown className="inline h-3 w-3" />
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">点赞</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">回复</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">转发</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">收藏</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">链接点击</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">互动率</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">新增关注</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.map((metric) => {
                  const draft = drafts.find((d) => d.id === metric.draft_id)
                  const engagementRate = calculateEngagementRate(metric)

                  return (
                    <tr key={metric.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 text-sm">{format(new Date(metric.date), "MM/dd", { locale: zhCN })}</td>
                      <td className="py-3">
                        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                          {draft ? `${draft.lang.toUpperCase()}-${draft.variant}` : "未知"}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-medium">{metric.impressions.toLocaleString()}</td>
                      <td className="py-3 text-sm">{metric.likes}</td>
                      <td className="py-3 text-sm">{metric.replies}</td>
                      <td className="py-3 text-sm">{metric.reposts}</td>
                      <td className="py-3 text-sm">{metric.bookmarks}</td>
                      <td className="py-3 text-sm">{metric.link_clicks}</td>
                      <td className="py-3 text-sm font-medium">{engagementRate.toFixed(2)}%</td>
                      <td className="py-3 text-sm font-medium">+{metric.est_follows}</td>
                    </tr>
                  )
                })}
                {filteredMetrics.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 曝光量柱状图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>曝光量趋势</CardTitle>
            <CardDescription>过去 14 天</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={impressionsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="impressions" fill="hsl(var(--chart-1))" name="曝光量" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 分类贡献饼图 */}
        <Card>
          <CardHeader>
            <CardTitle>分类贡献</CardTitle>
            <CardDescription>新增关注来源</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryContributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryContributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 互动率折线图 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>互动率趋势</CardTitle>
            <CardDescription>过去 14 天平均互动率</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
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
      </div>
    </div>
  )
}

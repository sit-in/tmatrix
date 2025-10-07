"use client"

import { useState, useMemo } from "react"
import { useStore, generateId } from "@/lib/store-supabase"
import type { Template, Idea, Draft } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, FileText, Lightbulb, Copy, Calendar, Trash2, RefreshCw, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function ContentPage() {
  const { templates, ideas, drafts, addIdea, addDraft, updateDraft, deleteDraft, deleteIdea } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [newIdeaSource, setNewIdeaSource] = useState("")
  const [newIdeaType, setNewIdeaType] = useState<"text" | "link">("text")
  const [newIdeaTags, setNewIdeaTags] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [quickTemplate, setQuickTemplate] = useState("")
  const [quickVariables, setQuickVariables] = useState("")

  // 过滤草稿
  const filteredDrafts = useMemo(() => {
    let filtered = drafts
    if (activeTab !== "all") {
      filtered = drafts.filter((d) => d.status === activeTab)
    }
    return filtered.sort((a, b) => {
      const dateA = a.posted_at || a.created_at || ""
      const dateB = b.posted_at || b.created_at || ""
      return dateB.localeCompare(dateA)
    })
  }, [drafts, activeTab])

  // 搜索模板
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [templates, searchQuery])

  // 添加想法
  const handleAddIdea = () => {
    if (!newIdeaSource.trim()) return

    const idea: Idea = {
      id: generateId("idea"),
      source_type: newIdeaType,
      source: newIdeaSource,
      tags: newIdeaTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      created_at: format(new Date(), "yyyy-MM-dd"),
    }

    addIdea(idea)
    setNewIdeaSource("")
    setNewIdeaTags("")
  }

  // 从想法创建草稿
  const handleUseIdea = (idea: Idea) => {
    const draft: Draft = {
      id: generateId("draft"),
      idea_id: idea.id,
      lang: "zh",
      variant: "A",
      content: idea.source,
      status: "draft",
    }
    addDraft(draft)
  }

  // 生成变体
  const handleGenerateVariants = (template: Template, variables: Record<string, string>) => {
    let body = template.body
    Object.entries(variables).forEach(([key, value]) => {
      body = body.replace(new RegExp(`{{${key}}}`, "g"), value)
    })

    const variants: Array<{ lang: "zh" | "en"; variant: "A" | "B" | "EN"; content: string }> = [
      { lang: "zh", variant: "A", content: body },
      { lang: "zh", variant: "B", content: body.replace("流程", "步骤").replace("想拿", "需要") },
      { lang: "en", variant: "EN", content: translateToEnglish(body) },
    ]

    variants.forEach((v) => {
      const draft: Draft = {
        id: generateId("draft"),
        template_id: template.id,
        lang: v.lang,
        variant: v.variant,
        content: v.content,
        status: "draft",
      }
      addDraft(draft)
    })

    setSelectedTemplate(null)
    setTemplateVariables({})
  }

  // 简单的翻译函数（实际应用中应使用真实的翻译API）
  const translateToEnglish = (text: string): string => {
    return text
      .replace("我用", "I used")
      .replace("做了", "for")
      .replace("天", "days")
      .replace("收入", "earned")
      .replace("流程", "Process")
      .replace("想拿", "DM")
      .replace("留言", "for")
  }

  // 快速生成
  const handleQuickGenerate = () => {
    if (!quickTemplate) return

    const template = templates.find((t) => t.id === quickTemplate)
    if (!template) return

    try {
      const variables = quickVariables ? JSON.parse(quickVariables) : {}
      handleGenerateVariants(template, variables)
      setQuickTemplate("")
      setQuickVariables("")
    } catch (error) {
      console.error("变量解析失败:", error)
    }
  }

  // 改写草稿
  const handleRewrite = (draft: Draft) => {
    const rewritten = draft.content.replace("流程", "步骤").replace("想拿", "需要").replace("留言", "评论")

    updateDraft(draft.id, { content: rewritten })
  }

  // 复制草稿
  const handleCopy = (draft: Draft) => {
    const newDraft: Draft = {
      ...draft,
      id: generateId("draft"),
      status: "draft",
    }
    addDraft(newDraft)
  }

  return (
    <div className="space-y-6">
      {/* 快速创作器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            快速创作
          </CardTitle>
          <CardDescription>选择模板并填写变量，一键生成三个变体</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={quickTemplate} onValueChange={setQuickTemplate}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择模板" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder='变量 JSON: {"tool":"Zapier","days":"30",...}'
              value={quickVariables}
              onChange={(e) => setQuickVariables(e.target.value)}
              className="flex-1 font-mono text-sm"
            />

            <Button onClick={handleQuickGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              生成变体
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 三列布局 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左列：想法收集箱 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              想法收集箱
            </CardTitle>
            <CardDescription>记录灵感和素材</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 添加想法表单 */}
            <div className="space-y-2">
              <Select value={newIdeaType} onValueChange={(v) => setNewIdeaType(v as "text" | "link")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">文本</SelectItem>
                  <SelectItem value="link">链接</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="输入想法或链接..."
                value={newIdeaSource}
                onChange={(e) => setNewIdeaSource(e.target.value)}
                rows={3}
              />

              <Input
                placeholder="标签（逗号分隔）"
                value={newIdeaTags}
                onChange={(e) => setNewIdeaTags(e.target.value)}
              />

              <Button onClick={handleAddIdea} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                添加想法
              </Button>
            </div>

            {/* 想法列表 */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {ideas.map((idea) => (
                <Card key={idea.id} className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm line-clamp-3">{idea.source}</p>
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(idea.created_at!), "MM/dd", { locale: zhCN })}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleUseIdea(idea)}>
                          <FileText className="h-3 w-3 mr-1" />
                          用作草稿
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteIdea(idea.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 中列：模板库 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              模板库
            </CardTitle>
            <CardDescription>选择模板生成内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 模板列表 */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTemplates.map((template) => (
                <Dialog key={template.id}>
                  <DialogTrigger asChild>
                    <Card className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {template.lang.toUpperCase()}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{template.title}</DialogTitle>
                      <DialogDescription>填写变量并生成三个变体（中文A、中文B、英文）</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* 变量输入 */}
                      <div className="space-y-2">
                        {Object.keys(template.variables).map((key) => (
                          <div key={key}>
                            <label className="text-sm font-medium">{key}</label>
                            <Input
                              placeholder={`输入 ${key}...`}
                              value={templateVariables[key] || ""}
                              onChange={(e) =>
                                setTemplateVariables({
                                  ...templateVariables,
                                  [key]: e.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>

                      {/* 预览 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">预览</label>
                        <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                          {Object.entries(templateVariables).reduce(
                            (body, [key, value]) => body.replace(new RegExp(`{{${key}}}`, "g"), value),
                            template.body,
                          )}
                        </div>
                      </div>

                      <Button onClick={() => handleGenerateVariants(template, templateVariables)} className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        生成三个变体
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 右列：草稿看板 */}
        <Card>
          <CardHeader>
            <CardTitle>草稿看板</CardTitle>
            <CardDescription>管理和编辑草稿</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="draft">草稿</TabsTrigger>
                <TabsTrigger value="scheduled">已排期</TabsTrigger>
                <TabsTrigger value="posted">已发布</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-2 max-h-[500px] overflow-y-auto mt-4">
                {filteredDrafts.map((draft) => (
                  <Card key={draft.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {draft.lang.toUpperCase()}-{draft.variant}
                        </Badge>
                        <Badge
                          variant={
                            draft.status === "posted"
                              ? "default"
                              : draft.status === "scheduled"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {draft.status === "posted" ? "已发布" : draft.status === "scheduled" ? "已排期" : "草稿"}
                        </Badge>
                      </div>

                      <p className="text-sm line-clamp-3">{draft.content}</p>

                      {(draft.created_at || draft.posted_at) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(draft.posted_at || draft.created_at!), "MM/dd HH:mm", { locale: zhCN })}
                        </div>
                      )}

                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleRewrite(draft)}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCopy(draft)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Select value={draft.status} onValueChange={(v) => updateDraft(draft.id, { status: v as any })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">草稿</SelectItem>
                            <SelectItem value="scheduled">已排期</SelectItem>
                            <SelectItem value="posted">已发布</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => deleteDraft(draft.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredDrafts.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无草稿</div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

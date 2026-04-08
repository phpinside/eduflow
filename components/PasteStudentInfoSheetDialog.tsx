"use client"

import * as React from "react"
import type { UseFormReturn } from "react-hook-form"
import { ClipboardPaste, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  parseStudentInfoSheet,
  type ParsedStudentInfoSheet,
} from "@/lib/parse-student-info-sheet"
export type PasteStudentInfoFieldMap = Partial<
  Record<keyof ParsedStudentInfoSheet, string>
>

type PasteStudentInfoSheetDialogProps = {
  /** Dynamic field names (formFieldMap) require a loose setValue signature */
  form: UseFormReturn<Record<string, unknown>>
  showSubjectGrade?: boolean
  subjects: readonly string[]
  grades: readonly string[]
  genders: readonly string[]
  /** Map parser output keys to different react-hook-form field names */
  formFieldMap?: PasteStudentInfoFieldMap
}

export function PasteStudentInfoSheetDialog({
  form,
  showSubjectGrade = true,
  subjects,
  grades,
  genders,
  formFieldMap = {},
}: PasteStudentInfoSheetDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")

  const handleParse = () => {
    const parsed = parseStudentInfoSheet(pasteText, subjects, grades, genders)

    if (!parsed.studentName && !parsed.parentPhone) {
      toast.error("未能识别到有效信息，请确认粘贴内容格式正确")
      return
    }

    const set = (parsedKey: keyof ParsedStudentInfoSheet, value: string) => {
      if (!value) return
      const formKey = formFieldMap[parsedKey] ?? parsedKey
      form.setValue(formKey, value)
    }

    set("studentName", parsed.studentName)
    set("gender", parsed.gender)
    set("region", parsed.region)
    set("school", parsed.school)
    set("lastExamScore", parsed.lastExamScore)
    set("examMaxScore", parsed.examMaxScore)
    set("otherSubjectsAvg", parsed.otherSubjectsAvg)
    set("textbookVersion", parsed.textbookVersion)
    set("schoolProgress", parsed.schoolProgress)
    set("tutoringHistory", parsed.tutoringHistory)
    set("parentPhone", parsed.parentPhone)
    set("campusName", parsed.campusName)
    set("campusAccount", parsed.campusAccount)
    set("remarks", parsed.remarks)
    if (showSubjectGrade) {
      set("subject", parsed.subject)
      set("grade", parsed.grade)
    }

    setOpen(false)
    setPasteText("")
    toast.success("信息已自动填充，请核对后提交")
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="gap-2 bg-indigo-500 text-white shadow-md ring-2 ring-indigo-300 ring-offset-1 transition-all hover:bg-indigo-600 hover:shadow-lg hover:ring-indigo-400"
      >
        <ClipboardPaste className="h-4 w-4" />
        粘贴信息单
        <Sparkles className="h-3.5 w-3.5 opacity-80" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5 text-indigo-500" />
              粘贴学生信息单
            </DialogTitle>
            <DialogDescription>
              粘贴后点击「解析并填充」，系统将自动识别字段并填入表单
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="试试粘贴 学生体验课信息单，可快速识别信息，自动填充表单"
              className="min-h-[220px] resize-none font-mono text-sm leading-relaxed"
            />
            {pasteText ? (
              <p className="mt-2 text-xs text-muted-foreground">
                已输入 {pasteText.length} 个字符
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setPasteText("")
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!pasteText.trim()}
              onClick={handleParse}
              className="gap-2 bg-indigo-500 text-white hover:bg-indigo-600"
            >
              <Sparkles className="h-4 w-4" />
              解析并填充表单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

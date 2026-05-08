"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { getStoredOrders, getStoredUsers, getStoredSubjects } from "@/lib/storage"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderType, Role, type Order, type User, type Subject } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import {
    ChevronDown,
    FilterX,
    FileText,
    MessageSquare,
    ClipboardCheck,
    Users,
    UserSquare2,
    BookMarked,
    Timer,
    UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

const VALID_STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"]

interface StudentCenterRow {
    rowId: string
    studentAccount: string
    studentName: string
    subject: string
    orderType: OrderType
    grade: string
    totalHours: number
    remainingHours: number
    tutorName: string
    managerName: string
    studentId?: string
    orderId?: string
}

export default function TeamStudentsPage() {
    const { user, currentRole } = useAuth()

    const [orders, setOrders] = React.useState<Order[]>([])
    const [users, setUsers] = React.useState<User[]>([])
    const [subjects, setSubjects] = React.useState<Subject[]>([])

    const [accountFilter, setAccountFilter] = React.useState("")
    const [nameFilter, setNameFilter] = React.useState("")
    const [subjectFilter, setSubjectFilter] = React.useState("all")
    const [typeFilter, setTypeFilter] = React.useState<"all" | OrderType>("all")
    const [gradeFilter, setGradeFilter] = React.useState("all")
    const [remainMinFilter, setRemainMinFilter] = React.useState("")
    const [remainMaxFilter, setRemainMaxFilter] = React.useState("")
    const [tutorNameFilter, setTutorNameFilter] = React.useState("")
    const [managerNameFilter, setManagerNameFilter] = React.useState("")
    const [filtersExpanded, setFiltersExpanded] = React.useState(true)

    const [page, setPage] = React.useState(1)

    React.useEffect(() => {
        setOrders(getStoredOrders())
        setUsers(getStoredUsers())
        setSubjects(getStoredSubjects())
    }, [])

    const userMap = React.useMemo(() => {
        const map = new Map<string, User>()
        users.forEach(u => map.set(u.id, u))
        return map
    }, [users])

    const allRows = React.useMemo((): StudentCenterRow[] => {
        if (!user) return []

        const filtered = orders.filter(o => VALID_STATUSES.includes(o.status))

        return filtered.map(order => {
            const student = mockStudents.find(s => s.id === order.studentId)
            const tutor = order.assignedTeacherId ? userMap.get(order.assignedTeacherId) : undefined
            const manager = order.managerId ? userMap.get(order.managerId) : undefined

            return {
                rowId: order.id,
                studentAccount: order.studentAccount ?? "",
                studentName: student?.name ?? "未知学员",
                subject: order.subject,
                orderType: order.type,
                grade: order.grade,
                totalHours: order.totalHours,
                remainingHours: order.remainingHours,
                tutorName: tutor?.name ?? "—",
                managerName: manager?.name ?? "—",
                studentId: student?.id,
                orderId: order.id,
            }
        })
    }, [user, orders, userMap])

    const filteredRows = React.useMemo(() => {
        let rows = allRows

        if (accountFilter.trim()) {
            rows = rows.filter(r => r.studentAccount.includes(accountFilter.trim()))
        }
        if (nameFilter.trim()) {
            rows = rows.filter(r => r.studentName.includes(nameFilter.trim()))
        }
        if (subjectFilter && subjectFilter !== "all") {
            rows = rows.filter(r => r.subject === subjectFilter)
        }
        if (typeFilter && typeFilter !== "all") {
            rows = rows.filter(r => r.orderType === typeFilter)
        }
        if (gradeFilter && gradeFilter !== "all") {
            rows = rows.filter(r => r.grade === gradeFilter)
        }
        if (remainMinFilter.trim() !== "") {
            const min = parseFloat(remainMinFilter)
            if (!isNaN(min)) rows = rows.filter(r => r.remainingHours >= min)
        }
        if (remainMaxFilter.trim() !== "") {
            const max = parseFloat(remainMaxFilter)
            if (!isNaN(max)) rows = rows.filter(r => r.remainingHours <= max)
        }
        if (tutorNameFilter.trim()) {
            rows = rows.filter(r => r.tutorName.includes(tutorNameFilter.trim()))
        }
        if (managerNameFilter.trim()) {
            rows = rows.filter(r => r.managerName.includes(managerNameFilter.trim()))
        }

        return rows
    }, [
        allRows,
        accountFilter, nameFilter, subjectFilter, typeFilter,
        gradeFilter, remainMinFilter, remainMaxFilter,
        tutorNameFilter, managerNameFilter,
    ])

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

    const paginatedRows = React.useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredRows.slice(start, start + PAGE_SIZE)
    }, [filteredRows, page])

    React.useEffect(() => { setPage(1) }, [
        accountFilter, nameFilter, subjectFilter, typeFilter,
        gradeFilter, remainMinFilter, remainMaxFilter,
        tutorNameFilter, managerNameFilter,
    ])

    const availableGrades = React.useMemo(() => {
        const grades = new Set<string>()
        allRows.forEach(r => { if (r.grade) grades.add(r.grade) })
        return Array.from(grades).sort()
    }, [allRows])

    const enabledSubjects = React.useMemo(
        () => subjects.filter(s => s.enabled),
        [subjects]
    )

    const hasActiveFilters =
        accountFilter || nameFilter ||
        subjectFilter !== "all" || typeFilter !== "all" ||
        gradeFilter !== "all" || remainMinFilter || remainMaxFilter ||
        tutorNameFilter || managerNameFilter

    const resetFilters = () => {
        setAccountFilter("")
        setNameFilter("")
        setSubjectFilter("all")
        setTypeFilter("all")
        setGradeFilter("all")
        setRemainMinFilter("")
        setRemainMaxFilter("")
        setTutorNameFilter("")
        setManagerNameFilter("")
    }

    if (!user) return <div>请先登录</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">团队学员</h1>
                <p className="text-sm text-muted-foreground">
                    共找到 <span className="font-semibold text-foreground">{filteredRows.length}</span> 条学员记录
                </p>
            </div>

            {/* 检索区域（可折叠） */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div
                    className={cn(
                        "flex items-center justify-between gap-2 bg-muted/30 px-4 py-2",
                        filtersExpanded && "border-b"
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setFiltersExpanded((e) => !e)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-0.5 pr-1 text-left outline-none ring-offset-background hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-expanded={filtersExpanded}
                        aria-controls="team-students-filters-panel"
                    >
                        <ChevronDown
                            className={cn(
                                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                !filtersExpanded && "-rotate-90"
                            )}
                            aria-hidden
                        />
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span id="team-students-filters-heading" className="text-sm font-semibold leading-none">
                                筛选条件
                            </span>
                            {!filtersExpanded && hasActiveFilters ? (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                                    有条件生效
                                </Badge>
                            ) : null}
                        </div>
                    </button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1 px-2.5 text-xs"
                        onClick={(e) => {
                            e.stopPropagation()
                            resetFilters()
                        }}
                        disabled={!hasActiveFilters}
                        title={hasActiveFilters ? "清空下方所有筛选项" : "当前无筛选条件"}
                    >
                        <FilterX className="h-3.5 w-3.5" />
                        重置筛选
                    </Button>
                </div>

                <div
                    id="team-students-filters-panel"
                    role="region"
                    aria-labelledby="team-students-filters-heading"
                    hidden={!filtersExpanded}
                >
                    <div className="p-5 space-y-5">
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <UserSquare2 className="h-3 w-3" />
                            学员信息
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Input
                                placeholder="学员 G账号"
                                value={accountFilter}
                                onChange={e => setAccountFilter(e.target.value)}
                                className="bg-background font-mono text-sm"
                                autoComplete="off"
                            />
                            <Input
                                placeholder="学员姓名"
                                value={nameFilter}
                                onChange={e => setNameFilter(e.target.value)}
                                className="bg-background"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <BookMarked className="h-3 w-3" />
                            课程
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="bg-background w-full">
                                    <SelectValue placeholder="学科" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部学科</SelectItem>
                                    {enabledSubjects.map(s => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={v => setTypeFilter(v as "all" | OrderType)}>
                                <SelectTrigger className="bg-background w-full">
                                    <SelectValue placeholder="课程类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部类型</SelectItem>
                                    <SelectItem value={OrderType.TRIAL}>试课</SelectItem>
                                    <SelectItem value={OrderType.REGULAR}>正式课</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                <SelectTrigger className="bg-background w-full">
                                    <SelectValue placeholder="年级" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部年级</SelectItem>
                                    {availableGrades.map(g => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Timer className="h-3 w-3" />
                            剩余课时区间
                            <span className="font-normal opacity-70">（留空则不限制）</span>
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-md">
                            <Input
                                type="number"
                                inputMode="decimal"
                                placeholder="最小剩余课时 ≥"
                                value={remainMinFilter}
                                onChange={e => setRemainMinFilter(e.target.value)}
                                className="bg-background"
                                min={0}
                                step={0.5}
                            />
                            <span className="flex h-9 shrink-0 items-center justify-center px-2 text-sm text-muted-foreground">
                                至
                            </span>
                            <Input
                                type="number"
                                inputMode="decimal"
                                placeholder="最大剩余课时 ≤"
                                value={remainMaxFilter}
                                onChange={e => setRemainMaxFilter(e.target.value)}
                                className="bg-background"
                                min={0}
                                step={0.5}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <UserCog className="h-3 w-3" />
                            伴学教练
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                placeholder="教练姓名"
                                value={tutorNameFilter}
                                onChange={e => setTutorNameFilter(e.target.value)}
                                className="bg-background"
                                autoComplete="off"
                            />
                            <Input
                                placeholder="学管姓名"
                                value={managerNameFilter}
                                onChange={e => setManagerNameFilter(e.target.value)}
                                className="bg-background"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md bg-white dark:bg-gray-950 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[130px]">学员G账号</TableHead>
                            <TableHead className="w-[110px]">学员姓名</TableHead>
                            <TableHead className="w-[80px]">学科</TableHead>
                            <TableHead className="w-[90px]">课程类型</TableHead>
                            <TableHead className="w-[90px]">年级</TableHead>
                            <TableHead className="w-[90px] text-center">总计课时</TableHead>
                            <TableHead className="w-[90px] text-center">剩余课时</TableHead>
                            <TableHead className="w-[110px]">伴学教练</TableHead>
                            <TableHead className="w-[100px]">学管</TableHead>
                            <TableHead className="text-right w-[220px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map(row => (
                                <TableRow key={row.rowId} className="hover:bg-muted/50">
                                    <TableCell>
                                        {row.orderId ? (
                                            <Link
                                                href={`/students-center/${row.orderId}`}
                                                className="text-xs font-mono text-primary hover:underline"
                                            >
                                                {row.studentAccount || "—"}
                                            </Link>
                                        ) : (
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {row.studentAccount || "—"}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {row.orderId ? (
                                            <Link
                                                href={`/students-center/${row.orderId}`}
                                                className="font-medium text-sm text-primary hover:underline"
                                            >
                                                {row.studentName}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-sm">{row.studentName}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">{row.subject}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[11px] px-1.5 py-0",
                                                row.orderType === OrderType.TRIAL
                                                    ? "border-sky-400 text-sky-600 bg-sky-50"
                                                    : "border-emerald-400 text-emerald-700 bg-emerald-50"
                                            )}
                                        >
                                            {row.orderType === OrderType.TRIAL ? "试课" : "正式课"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{row.grade}</TableCell>
                                    <TableCell className="text-center font-medium text-sm">
                                        {row.totalHours}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "font-semibold text-sm",
                                            row.remainingHours <= 5
                                                ? "text-destructive"
                                                : "text-primary"
                                        )}>
                                            {row.remainingHours}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm">{row.tutorName}</TableCell>
                                    <TableCell className="text-sm">{row.managerName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-nowrap justify-end gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-muted-foreground/25 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                                asChild
                                            >
                                                <Link
                                                    href={`/teaching-feedback/plan-search?studentName=${encodeURIComponent(row.studentName)}&studentAccount=${encodeURIComponent(row.studentAccount)}&subject=${encodeURIComponent(row.subject)}&grade=${encodeURIComponent(row.grade)}`}
                                                >
                                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                                    规划书检索
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 shadow-md ring-2 ring-primary/25 font-semibold"
                                                asChild
                                            >
                                                <Link
                                                    href={`/teaching-feedback/feedback-search?studentName=${encodeURIComponent(row.studentName)}&studentAccount=${encodeURIComponent(row.studentAccount)}&subject=${encodeURIComponent(row.subject)}&grade=${encodeURIComponent(row.grade)}`}
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                                    课后反馈检索
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 bg-indigo-400 text-white shadow-sm hover:bg-indigo-500/90 dark:bg-indigo-400 dark:hover:bg-indigo-500/90"
                                                asChild
                                            >
                                                <Link
                                                    href={`/teaching-feedback/assessment-search?studentName=${encodeURIComponent(row.studentName)}&studentAccount=${encodeURIComponent(row.studentAccount)}&subject=${encodeURIComponent(row.subject)}&grade=${encodeURIComponent(row.grade)}`}
                                                >
                                                    <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                                                    阶段性测评检索
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                                        <Users className="h-8 w-8 opacity-30" />
                                        <p className="text-sm">没有找到符合条件的学员</p>
                                        {hasActiveFilters && (
                                            <Button variant="link" size="sm" onClick={resetFilters}>
                                                清除筛选条件
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} 条，共 {filteredRows.length} 条
                    </span>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    )
}

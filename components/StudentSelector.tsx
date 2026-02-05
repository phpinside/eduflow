"use client"

import * as React from "react"
import { Check, ChevronsUpDown, User, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { STUDENTS_MOCK } from "@/lib/mock-data"

interface StudentSelectorProps {
  onSelect: (student: typeof STUDENTS_MOCK[0]) => void
}

export function StudentSelector({ onSelect }: StudentSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const students = STUDENTS_MOCK

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value
            ? students.find((student) => student.id === value)?.name
            : "从档案中选择学生..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索姓名..." />
          <CommandList>
            <CommandEmpty>未找到学生.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.name}
                  onSelect={() => {
                    setValue(student.id === value ? "" : student.id)
                    setOpen(false)
                    onSelect(student)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.phone || student.parentPhone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

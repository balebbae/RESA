"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarSeparator,
} from "@/components/resa/sidebar-core/sidebar"
import { DatePicker } from "./calendar/date-picker"
import { ScheduleList } from "./schedules/schedule-list"
import { SidebarFooterActions } from "./footer/sidebar-footer-actions"
import { useCalendars } from "./hooks/use-calendars"

/**
 * Right sidebar component - Refactored and modularized
 * - Extracted date picker to calendar sub-feature
 * - Extracted schedules to schedules sub-feature
 * - Extracted footer actions to footer sub-feature
 * - Uses useCalendars hook for data management
 */
export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { calendars } = useCalendars()

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <ScheduleList calendars={calendars} />
      </SidebarContent>
      <SidebarFooterActions />
    </Sidebar>
  )
}

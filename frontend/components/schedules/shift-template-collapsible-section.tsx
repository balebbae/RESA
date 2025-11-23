"use client"

import * as React from "react"
import { forwardRef, useImperativeHandle } from "react"
import { ChevronRight, Calendar } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useShiftTemplateContext } from "@/contexts/shift-template-context"
import { formatTimeToHHMM } from "@/lib/calendar/date-utils"
import type { ShiftTemplate } from "@/types/shift-template"

interface ShiftTemplateCollapsibleSectionProps {
  restaurantId: number | null
}

export interface ShiftTemplateCollapsibleSectionRef {
  refetch: () => void
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * Collapsible section for shift templates
 * Displays shift templates in a collapsible sidebar section
 */
export const ShiftTemplateCollapsibleSection = forwardRef<
  ShiftTemplateCollapsibleSectionRef,
  ShiftTemplateCollapsibleSectionProps
>(function ShiftTemplateCollapsibleSection({
  restaurantId,
}, ref) {
  // Use context instead of hook to avoid duplicate API calls
  const { shiftTemplates, refetch } = useShiftTemplateContext()

  // Expose refetch method to parent component
  useImperativeHandle(ref, () => ({
    refetch,
  }))

  // Show message when no restaurant is selected
  if (!restaurantId) {
    return (
      <>
        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="text-sidebar-foreground text-sm">
            Shift Templates
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Select a workplace to view shift templates
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-0" />
      </>
    )
  }

  return (
    <>
      {/* Shift Templates Section */}
      <SidebarGroup className="py-0">
        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm hover:cursor-pointer"
          >
            <CollapsibleTrigger>
              Shift Templates{" "}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {shiftTemplates.length === 0 ? (
                  <div className="px-2 py-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No shift templates yet
                    </p>
                  </div>
                ) : (
                  shiftTemplates.map((template) => {
                    const roleNames = template.roles?.map(r => r.name).join(", ") || "No roles"
                    const displayName = template.name || `Template #${template.id}`

                    return (
                      <SidebarMenuItem key={template.id}>
                        <div className="flex items-center w-full gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-medium">
                              {displayName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {DAYS_OF_WEEK[template.day_of_week]} • {formatTimeToHHMM(template.start_time)} - {formatTimeToHHMM(template.end_time)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {roleNames}
                            </span>
                          </div>
                        </div>
                      </SidebarMenuItem>
                    )
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
      <SidebarSeparator className="mx-0" />
    </>
  )
})

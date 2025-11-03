"use client"

import { SidebarLeft } from "@/components/resa/sidebar-left/sidebar-left"
import { SidebarRight } from "@/components/resa/sidebar-right/sidebar-right"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/resa/sidebar-core/sidebar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { RestaurantProvider } from "@/lib/restaurant-context"
import {
  useWeekNavigation,
  formatWeekRange,
  WeekNavigationProvider
} from "@/components/resa/schedule/contexts/week-navigation-context"
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core"
import {
  ScheduleDragDropProvider,
  useScheduleDragDrop,
} from "@/components/resa/schedule/contexts/schedule-drag-drop-context"
import type { EmployeeDragData, TimeSlotDropData } from "@/components/resa/schedule/types/schedule"

/**
 * Protected layout for authenticated routes
 * All pages within (resa) route group require authentication
 */
export default function ResaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Preserve the intended destination for redirect after login
      const currentPath = window.location.pathname
      const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, isLoading, router])

  // Show nothing while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // User is authenticated, render the protected content
  return (
    <RestaurantProvider>
      <ScheduleDragDropProvider>
        <SidebarProvider>
          <DndContextWrapper>
            <SidebarLeft />
            <SidebarInset>
              <WeekNavigationProvider>
                <ResaHeader />
                <div className="flex-1 overflow-hidden">
                  {children}
                </div>
              </WeekNavigationProvider>
            </SidebarInset>
            <SidebarRight />
          </DndContextWrapper>
        </SidebarProvider>
      </ScheduleDragDropProvider>
    </RestaurantProvider>
  )
}

/**
 * Wrapper component that provides DndContext for drag-and-drop functionality
 * This must be inside ScheduleDragDropProvider to access the context
 */
function DndContextWrapper({ children }: { children: React.ReactNode }) {
  const { activeDragData, setActiveDragData, getShiftCreationHandler } = useScheduleDragDrop();

  const handleDragStart = (event: DragStartEvent) => {
    const dragData = event.active.data.current as EmployeeDragData;
    if (dragData?.type === 'employee') {
      setActiveDragData(dragData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null);

    const { active, over } = event;

    if (!over) return;

    const dragData = active.data.current as EmployeeDragData;
    const dropData = over.data.current as TimeSlotDropData;

    // Verify we're dragging an employee to a time slot
    if (dragData?.type === 'employee' && dropData?.type === 'timeslot') {
      // Call the shift creation handler registered by the calendar
      const handler = getShiftCreationHandler();
      if (handler) {
        handler(dragData, dropData);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveDragData(null);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeDragData ? (
          <div
            className="px-3 py-2 rounded-lg shadow-lg border-2 cursor-grabbing"
            style={{
              backgroundColor: activeDragData.employeeColor,
              borderColor: activeDragData.employeeColor,
              opacity: 0.9,
            }}
          >
            <div className="text-sm font-semibold text-gray-900">
              {activeDragData.employeeName}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Header component that conditionally shows week navigation
 * when WeekNavigationProvider is available (on schedule pages)
 */
function ResaHeader() {
  const weekNav = useWeekNavigation();

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border">
      <div className="flex flex-1 items-center justify-between px-3">
        {/* Left side */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  Workplaces
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side - Week navigation (conditionally rendered) */}
        {weekNav && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {formatWeekRange(weekNav.currentWeek)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={weekNav.goToPrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={weekNav.goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

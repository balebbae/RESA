"use client";

import { SidebarLeft } from "@/components/layout/sidebar-left";
import { SidebarRight } from "@/components/layout/sidebar-right";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelRight,
} from "lucide-react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { RestaurantProvider } from "@/contexts/restaurant-context";
import {
  useWeekNavigation,
  WeekNavigationProvider,
} from "@/contexts/week-navigation-context";
import { ShiftTemplateProvider } from "@/contexts/shift-template-context";

/**
 * Protected layout for authenticated routes
 * All pages within (resa) route group require authentication
 */
export default function ResaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  useEffect(() => {
    // Wait for auth state to load
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Preserve the intended destination for redirect after login
      const currentPath = window.location.pathname;
      const redirectUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return (
    <RestaurantProvider>
      <ShiftTemplateProvider>
        <SidebarProvider className="!h-svh !min-h-0">
          <WeekNavigationProvider>
            <SidebarLeft />
            <SidebarInset>
              <ResaHeader
                rightSidebarOpen={rightSidebarOpen}
                setRightSidebarOpen={setRightSidebarOpen}
              />
              <div className="flex flex-col flex-1 min-h-0">{children}</div>
            </SidebarInset>
            <SidebarProvider
              open={rightSidebarOpen}
              onOpenChange={setRightSidebarOpen}
              className="w-auto !min-h-svh"
            >
              <SidebarRight side="right" collapsible="offcanvas" />
            </SidebarProvider>
          </WeekNavigationProvider>
        </SidebarProvider>
      </ShiftTemplateProvider>
    </RestaurantProvider>
  );
}

/**
 * Header component that conditionally shows week navigation
 * when WeekNavigationProvider is available (on schedule pages)
 */
function ResaHeader({
  rightSidebarOpen,
  setRightSidebarOpen,
}: {
  rightSidebarOpen?: boolean;
  setRightSidebarOpen?: (open: boolean) => void;
}) {
  const weekNav = useWeekNavigation();
  const { open: leftSidebarOpen, setOpen: setLeftOpen } = useSidebar();

  // Close left sidebar on window resize if screen is small
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && leftSidebarOpen) {
        setLeftOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [leftSidebarOpen, setLeftOpen]);

  // Get current month and year
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border">
      <div className="flex flex-1 items-center justify-between px-3">
        {/* Left side */}
        <div className="flex items-center gap-2">
          <SidebarTrigger
            onClick={() => {
              // If opening left sidebar on small screen, close right sidebar
              if (
                !leftSidebarOpen &&
                window.innerWidth < 1024 &&
                setRightSidebarOpen
              ) {
                setRightSidebarOpen(false);
              }
            }}
          />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1 text-lg  font-semibold">
                  {monthYear}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side - Week navigation (conditionally rendered) */}
        {weekNav && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8">
              Week
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-8">
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={weekNav.goToPrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={weekNav.goToNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator
              orientation="vertical"
              className=" data-[orientation=vertical]:h-4 ml-2"
            />
            {setRightSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const newState = !rightSidebarOpen;
                  setRightSidebarOpen(newState);
                  if (newState && window.innerWidth < 1024) {
                    setLeftOpen(false);
                  }
                }}
              >
                <PanelRight className="size-4" />
                <span className="sr-only">Toggle Right Sidebar</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

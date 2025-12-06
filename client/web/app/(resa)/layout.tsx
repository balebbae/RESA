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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

import { useEffect } from "react";
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
              <ResaHeader />
              <div className="flex flex-col flex-1 min-h-0">{children}</div>
            </SidebarInset>
            <SidebarRight />
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
function ResaHeader() {
  const weekNav = useWeekNavigation();

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
          <SidebarTrigger />
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

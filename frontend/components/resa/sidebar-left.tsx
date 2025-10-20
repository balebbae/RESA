"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Command,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/ui/nav-main"
import { NavWorkspaces } from "@/components/resa/nav-workspaces"
import { TeamSwitcher } from "@/components/ui/team-switcher"
import { getApiBase } from "@/lib/api"
import { fetchWithAuth } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "./nav-user"


// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
}

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [workplaces, setWorkplaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch restaurants and convert to workplaces format
  const fetchWorkplaces = async () => {
    try {
      setIsLoading(true)
      const apiUrl = `${getApiBase()}/restaurants`
      console.log("Fetching workplaces from:", apiUrl)

      const res = await fetchWithAuth(apiUrl)

      if (!res.ok) {
        throw new Error(`Failed to fetch restaurants (${res.status})`)
      }

      const data = await res.json()
      console.log("Raw API response:", data)

      const restaurantList = Array.isArray(data) ? data : (data.data || [])
      console.log("Parsed restaurant list:", restaurantList)

      // Convert restaurants to workplaces format
      const convertedWorkplaces = restaurantList
        .filter((restaurant: any) => restaurant && restaurant.id) // Filter out invalid entries
        .map((restaurant: any) => ({
          id: restaurant.id,
          name: restaurant.name || "Unnamed Restaurant",
          emoji: "🏢",
          pages: [],
        }))

      console.log("Converted workplaces:", convertedWorkplaces)
      setWorkplaces(convertedWorkplaces)
    } catch (err: any) {
      console.error("Error fetching workplaces:", err)
      setWorkplaces([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkplaces()
  }, [])

  const handleWorkplaceCreated = (restaurant: any) => {
    console.log("Workplace created/updated:", restaurant)
    // Refetch workplaces instead of full page reload for better UX
    fetchWorkplaces()
  }

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavWorkspaces
          workplaces={workplaces}
          onWorkplaceCreated={handleWorkplaceCreated}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

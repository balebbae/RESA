import * as React from "react"
import { Plus } from "lucide-react"

import { Employees } from "@/components/resa/employees"
import { DatePicker } from "@/components/resa/date-picker"
import { NavUser } from "@/components/resa/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  employees: [
    {
      name: "Cooks",
      items: ["John Doe", "Jane Smith", "Mike Johnson"],
    },
    {
      name: "Servers",
      items: ["Alice Johnson", "Bob Smith", "Charlie Davis"],
    },
    {
      name: "Bartenders",
      items: ["Alice Johnson", "Bob Smith", "Charlie Davis"],
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Employees employees={data.employees} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus />
              <span>Create Employee</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

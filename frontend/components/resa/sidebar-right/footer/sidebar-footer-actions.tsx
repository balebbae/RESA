import { Plus } from "lucide-react"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/resa/sidebar-core/sidebar"

/**
 * Footer actions for right sidebar
 * Currently contains "New Employee" button
 */
export function SidebarFooterActions() {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Plus />
            <span>New Employee</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}

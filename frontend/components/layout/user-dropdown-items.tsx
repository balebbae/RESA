"use client"

import {
  LogOut,
  Settings,
} from "lucide-react"
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"

/**
 * User dropdown menu items
 * Extracted from nav-user for better organization
 */
export function UserDropdownItems() {
  const { logout } = useAuth()

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem className="hover:cursor-pointer">
          <Settings />
          Settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={logout} className="hover:cursor-pointer">
        <LogOut />
        Log out
      </DropdownMenuItem>
    </>
  )
}

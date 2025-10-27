import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import type { User } from "@/components/resa/sidebar-left/types/user"

interface UserAvatarProps {
  user: User
  className?: string
}

/**
 * Reusable user avatar component
 * Extracted from nav-user for better reusability
 */
export function UserAvatar({ user, className = "h-8 w-8 rounded-lg" }: UserAvatarProps) {
  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="rounded-lg">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  )
}

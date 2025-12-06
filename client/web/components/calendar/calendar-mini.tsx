import { Calendar } from "@/components/ui/calendar";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

interface DatePickerProps {
  currentWeek?: string; // YYYY-MM-DD format (Sunday)
}

export function DatePicker({ currentWeek }: DatePickerProps) {
  return (
    <SidebarGroup className="pb-0 px-0">
      <SidebarGroupContent>
        <Calendar
          currentWeek={currentWeek}
          className="[&_[role=gridcell].bg-accent]:bg-[#f04843] [&_[role=gridcell].bg-accent]:text-sidebar-primary-foreground [&_[role=gridcell]]:w-[33px]"
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

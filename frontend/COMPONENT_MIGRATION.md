# Frontend Component Reorganization Migration Plan

## Overview

This document provides a comprehensive, phase-by-phase plan to reorganize the RESA frontend codebase from a messy feature-based component structure to a clean, type-based organization.

**Current Problems:**

- Components scattered across `resa/sidebar-left/`, `resa/sidebar-right/`, `resa/schedule/`
- Types duplicated in 3+ locations (`sidebar-left/types/`, `sidebar-right/types/`, `schedule/types/`)
- Hooks distributed across 7+ different directories
- Contexts buried in component subdirectories
- Deep nesting makes imports verbose and hard to maintain

**Migration Goals:**

- Reorganize components by type: `layout/`, `calendar/`, feature modules
- Consolidate all types into single `types/` directory
- Consolidate all hooks into single `hooks/` directory
- Extract contexts to dedicated `contexts/` directory
- Maintain functionality while improving structure
- Update all import paths correctly

---

## Phase 1: Create New Directory Structure

### Description

Set up the new directory structure before moving any files. This ensures we have clear destinations for all components and prevents confusion during migration.

### Actions

Create the following directories:

```bash
# Component directories
mkdir -p components/layout
mkdir -p components/calendar
mkdir -p components/employees
mkdir -p components/roles
mkdir -p components/schedules
mkdir -p components/workspaces

# Root-level directories
mkdir -p types
mkdir -p contexts
mkdir -p utils

# Note: hooks/ already exists with 1 file
```

### Validation

- Verify all directories created successfully
- Ensure no naming conflicts with existing files

---

## Phase 2: Consolidate Type Definitions

### Description

Move all TypeScript type definitions from scattered locations into a centralized `types/` directory. This eliminates duplication and creates a single source of truth for all types.

### Current Type Locations

```
components/resa/sidebar-left/types/
  ├── google-places.ts
  ├── user.ts
  └── workspace.ts

components/resa/sidebar-right/types/
  ├── calendar.ts
  ├── employee.ts
  ├── role.ts
  └── shift-template.ts

components/resa/schedule/types/
  └── schedule.ts
```

### File Moves

| Source                                                  | Destination               |
| ------------------------------------------------------- | ------------------------- |
| `components/resa/sidebar-left/types/google-places.ts`   | `types/google-places.ts`  |
| `components/resa/sidebar-left/types/user.ts`            | `types/user.ts`           |
| `components/resa/sidebar-left/types/workspace.ts`       | `types/workspace.ts`      |
| `components/resa/sidebar-right/types/calendar.ts`       | `types/calendar.ts`       |
| `components/resa/sidebar-right/types/employee.ts`       | `types/employee.ts`       |
| `components/resa/sidebar-right/types/role.ts`           | `types/role.ts`           |
| `components/resa/sidebar-right/types/shift-template.ts` | `types/shift-template.ts` |
| `components/resa/schedule/types/schedule.ts`            | `types/schedule.ts`       |

### New Types to Create

- `types/auth.ts` - Extract auth-related types from `lib/auth.tsx`
- `types/api.ts` - Common API response types (error responses, pagination, etc.)

### Import Updates Required

All files importing from old type locations need updates:

**Before:**

```typescript
import { Employee } from "@/components/resa/sidebar-right/types/employee";
import { Workspace } from "@/components/resa/sidebar-left/types/workspace";
```

**After:**

```typescript
import { Employee } from "@/types/employee";
import { Workspace } from "@/types/workspace";
```

### Validation

- All 8 type files moved successfully
- No duplicate type definitions remain
- TypeScript compiler shows no errors for type imports

---

## Phase 3: Consolidate React Contexts

### Description

Extract React context providers from component directories into a dedicated `contexts/` directory. This makes contexts easier to find and import.

### Current Context Locations

```
components/resa/schedule/contexts/
  ├── schedule-drag-drop-context.tsx
  ├── shift-template-context.tsx
  └── week-navigation-context.tsx
```

### File Moves

| Source                                                             | Destination                               |
| ------------------------------------------------------------------ | ----------------------------------------- |
| `components/resa/schedule/contexts/schedule-drag-drop-context.tsx` | `contexts/schedule-drag-drop-context.tsx` |
| `components/resa/schedule/contexts/shift-template-context.tsx`     | `contexts/shift-template-context.tsx`     |
| `components/resa/schedule/contexts/week-navigation-context.tsx`    | `contexts/week-navigation-context.tsx`    |

### Optional: Additional Context Extraction

Consider moving these from `lib/` to `contexts/`:

- `lib/restaurant-context.tsx` → `contexts/restaurant-context.tsx`
- Extract auth context from `lib/auth.tsx` → `contexts/auth-context.tsx`

### Import Updates Required

**Before:**

```typescript
import { useScheduleDragDrop } from "@/components/resa/schedule/contexts/schedule-drag-drop-context";
```

**After:**

```typescript
import { useScheduleDragDrop } from "@/contexts/schedule-drag-drop-context";
```

### Layout Updates

Update `app/(resa)/layout.tsx` to import providers from new location:

```typescript
import { ScheduleDragDropProvider } from "@/contexts/schedule-drag-drop-context";
import { ShiftTemplateProvider } from "@/contexts/shift-template-context";
import { WeekNavigationProvider } from "@/contexts/week-navigation-context";
```

### Validation

- All 3 context files moved
- Provider imports in layout.tsx updated
- Context consumers updated to new import paths
- App still renders without errors

---

## Phase 4: Consolidate Custom Hooks

### Description

Move all custom React hooks from scattered component subdirectories into a single top-level `hooks/` directory. This makes hooks reusable and easier to discover.

### Current Hook Locations

```
hooks/
  └── use-mobile.ts (already exists)

components/resa/schedule/hooks/
  └── use-schedule.tsx

components/resa/sidebar-left/hooks/
  ├── use-google-maps.tsx
  ├── use-workplaces.tsx
  ├── use-workspace-delete.tsx
  └── use-workspace-form.tsx

components/resa/sidebar-right/hooks/
  └── use-calendars.tsx

components/resa/sidebar-right/employees/hooks/
  ├── use-employee-delete.tsx
  ├── use-employee-form.tsx
  └── use-employees.tsx

components/resa/sidebar-right/roles/hooks/
  ├── use-role-delete.tsx
  ├── use-role-form.tsx
  └── use-roles.tsx

components/resa/sidebar-right/schedules/hooks/
  ├── use-shift-template-form.tsx
  └── use-shift-templates.tsx
```

### File Moves

| Source                                                                      | Destination                         |
| --------------------------------------------------------------------------- | ----------------------------------- |
| `components/resa/schedule/hooks/use-schedule.tsx`                           | `hooks/use-schedule.tsx`            |
| `components/resa/sidebar-left/hooks/use-google-maps.tsx`                    | `hooks/use-google-maps.tsx`         |
| `components/resa/sidebar-left/hooks/use-workplaces.tsx`                     | `hooks/use-workplaces.tsx`          |
| `components/resa/sidebar-left/hooks/use-workspace-delete.tsx`               | `hooks/use-workspace-delete.tsx`    |
| `components/resa/sidebar-left/hooks/use-workspace-form.tsx`                 | `hooks/use-workspace-form.tsx`      |
| `components/resa/sidebar-right/hooks/use-calendars.tsx`                     | `hooks/use-calendars.tsx`           |
| `components/resa/sidebar-right/employees/hooks/use-employee-delete.tsx`     | `hooks/use-employee-delete.tsx`     |
| `components/resa/sidebar-right/employees/hooks/use-employee-form.tsx`       | `hooks/use-employee-form.tsx`       |
| `components/resa/sidebar-right/employees/hooks/use-employees.tsx`           | `hooks/use-employees.tsx`           |
| `components/resa/sidebar-right/roles/hooks/use-role-delete.tsx`             | `hooks/use-role-delete.tsx`         |
| `components/resa/sidebar-right/roles/hooks/use-role-form.tsx`               | `hooks/use-role-form.tsx`           |
| `components/resa/sidebar-right/roles/hooks/use-roles.tsx`                   | `hooks/use-roles.tsx`               |
| `components/resa/sidebar-right/schedules/hooks/use-shift-template-form.tsx` | `hooks/use-shift-template-form.tsx` |
| `components/resa/sidebar-right/schedules/hooks/use-shift-templates.tsx`     | `hooks/use-shift-templates.tsx`     |

### New Hooks to Create

Consider creating these utility hooks:

- `hooks/use-calendar-view.ts` - Manage calendar view state (week/day/month)
- `hooks/use-selected-date.ts` - Manage selected date from mini calendar
- `hooks/use-auth.ts` - Extract from `lib/auth.tsx` for cleaner separation

### Import Updates Required

**Before:**

```typescript
import { useEmployees } from "@/components/resa/sidebar-right/employees/hooks/use-employees";
import { useWorkplaces } from "@/components/resa/sidebar-left/hooks/use-workplaces";
```

**After:**

```typescript
import { useEmployees } from "@/hooks/use-employees";
import { useWorkplaces } from "@/hooks/use-workplaces";
```

### Validation

- All 15+ hooks moved to `hooks/` directory
- All hook imports updated across codebase
- No duplicate hook definitions
- All hooks still functional

---

## Phase 5: Reorganize Layout Components

### Description

Extract all sidebar and app shell components into `components/layout/`. This creates a clear separation between layout concerns and feature components.

### Current Layout Component Locations

```
components/resa/
  ├── app-sidebar.tsx
  ├── sidebar-core/
  │   └── sidebar.tsx
  ├── sidebar-left/
  │   ├── sidebar-left.tsx
  │   └── user/
  │       ├── user-avatar.tsx
  │       ├── user-dropdown-items.tsx
  │       └── user-menu.tsx
  └── sidebar-right/
      ├── sidebar-right.tsx
      └── footer/
          └── sidebar-footer-actions.tsx
```

### File Moves

| Source                                                            | Destination                                    |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `components/resa/app-sidebar.tsx`                                 | `components/layout/app-sidebar.tsx`            |
| `components/resa/sidebar-core/sidebar.tsx`                        | `components/layout/sidebar.tsx`                |
| `components/resa/sidebar-left/sidebar-left.tsx`                   | `components/layout/left-sidebar.tsx`           |
| `components/resa/sidebar-right/sidebar-right.tsx`                 | `components/layout/right-sidebar.tsx`          |
| `components/resa/sidebar-left/user/user-menu.tsx`                 | `components/layout/user-menu.tsx`              |
| `components/resa/sidebar-left/user/user-avatar.tsx`               | `components/layout/user-avatar.tsx`            |
| `components/resa/sidebar-left/user/user-dropdown-items.tsx`       | `components/layout/user-dropdown-items.tsx`    |
| `components/resa/sidebar-right/footer/sidebar-footer-actions.tsx` | `components/layout/sidebar-footer-actions.tsx` |

### New Components to Consider

- `components/layout/app-shell.tsx` - Main authenticated app wrapper combining all sidebars
- `components/layout/top-nav.tsx` - Top navigation bar (if needed)

### Import Updates Required

**Before:**

```typescript
import { AppSidebar } from "@/components/resa/app-sidebar";
import { Sidebar } from "@/components/resa/sidebar-core/sidebar";
```

**After:**

```typescript
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
```

### Special Considerations

- Update `app/(resa)/layout.tsx` to import from new locations
- Ensure sidebar state management still works correctly
- Verify responsive behavior maintained

### Validation

- All layout components moved
- Sidebar functionality works correctly
- Mobile/desktop views render properly
- User menu, navigation intact

---

## Phase 6: Reorganize Calendar Components

### Description

Consolidate all calendar-related components into `components/calendar/`. This includes the main weekly calendar, mini calendar, time grids, and shift cards.

### Current Calendar Component Locations

```
components/resa/schedule/
  ├── weekly-calendar.tsx
  ├── calendar/
  │   ├── calendar-grid.tsx
  │   ├── calendar-header.tsx
  │   ├── day-header.tsx
  │   ├── time-column.tsx
  │   └── time-slot-cell.tsx
  └── shifts/
      └── shift-card.tsx

components/resa/sidebar-right/calendar/
  └── date-picker.tsx

components/resa/
  └── date-picker.tsx
```

### File Moves

| Source                                                   | Destination                                  | Notes                           |
| -------------------------------------------------------- | -------------------------------------------- | ------------------------------- |
| `components/resa/schedule/weekly-calendar.tsx`           | `components/calendar/calendar-week-view.tsx` | Renamed for clarity             |
| `components/resa/schedule/calendar/calendar-grid.tsx`    | `components/calendar/calendar-grid.tsx`      |                                 |
| `components/resa/schedule/calendar/calendar-header.tsx`  | `components/calendar/calendar-header.tsx`    | Week navigation, "Today" button |
| `components/resa/schedule/calendar/day-header.tsx`       | `components/calendar/day-header.tsx`         |                                 |
| `components/resa/schedule/calendar/time-column.tsx`      | `components/calendar/time-column.tsx`        | Y-axis hours grid               |
| `components/resa/schedule/calendar/time-slot-cell.tsx`   | `components/calendar/time-slot-cell.tsx`     | Individual time slots           |
| `components/resa/schedule/shifts/shift-card.tsx`         | `components/calendar/shift-card.tsx`         | Schedule block                  |
| `components/resa/sidebar-right/calendar/date-picker.tsx` | `components/calendar/calendar-mini.tsx`      | Renamed - mini calendar widget  |
| `components/resa/date-picker.tsx`                        | `components/calendar/date-picker.tsx`        | Generic date picker             |

### Import Updates Required

**Before:**

```typescript
import { WeeklyCalendar } from "@/components/resa/schedule/weekly-calendar";
import { CalendarGrid } from "@/components/resa/schedule/calendar/calendar-grid";
import { ShiftCard } from "@/components/resa/schedule/shifts/shift-card";
```

**After:**

```typescript
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { ShiftCard } from "@/components/calendar/shift-card";
```

### Component Relationships

```
calendar-week-view.tsx (main component)
├── calendar-header.tsx (week navigation)
├── calendar-grid.tsx (main grid)
│   ├── day-header.tsx (column headers)
│   ├── time-column.tsx (left time axis)
│   └── time-slot-cell.tsx (individual cells)
│       └── shift-card.tsx (draggable shift blocks)
└── calendar-mini.tsx (sidebar mini calendar)
```

### Validation

- All calendar components moved
- Calendar renders correctly
- Drag-and-drop functionality works
- Week navigation functional
- Mini calendar in sidebar works

---

## Phase 7: Reorganize Employee Feature Components

### Description

Move all employee management components into `components/employees/`. This creates a dedicated module for all employee-related UI.

### Current Employee Component Locations

```
components/resa/sidebar-right/employees/
  ├── employee-collapsible-section.tsx
  ├── employee-delete-dialog.tsx
  ├── employee-detail-sheet.tsx
  ├── employee-empty-state.tsx
  ├── employee-form-dialog.tsx
  ├── employee-list-item.tsx
  └── employee-list.tsx
```

### File Moves

| Source                                                                     | Destination                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------- |
| `components/resa/sidebar-right/employees/employee-collapsible-section.tsx` | `components/employees/employee-collapsible-section.tsx` |
| `components/resa/sidebar-right/employees/employee-delete-dialog.tsx`       | `components/employees/employee-delete-dialog.tsx`       |
| `components/resa/sidebar-right/employees/employee-detail-sheet.tsx`        | `components/employees/employee-detail-sheet.tsx`        |
| `components/resa/sidebar-right/employees/employee-empty-state.tsx`         | `components/employees/employee-empty-state.tsx`         |
| `components/resa/sidebar-right/employees/employee-form-dialog.tsx`         | `components/employees/employee-form-dialog.tsx`         |
| `components/resa/sidebar-right/employees/employee-list-item.tsx`           | `components/employees/employee-list-item.tsx`           |
| `components/resa/sidebar-right/employees/employee-list.tsx`                | `components/employees/employee-list.tsx`                |

### Note

The employee hooks were already moved in Phase 4 to `hooks/`:

- `use-employees.tsx`
- `use-employee-form.tsx`
- `use-employee-delete.tsx`

### Import Updates Required

**Before:**

```typescript
import { EmployeeList } from "@/components/resa/sidebar-right/employees/employee-list";
import { EmployeeFormDialog } from "@/components/resa/sidebar-right/employees/employee-form-dialog";
```

**After:**

```typescript
import { EmployeeList } from "@/components/employees/employee-list";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
```

### Component Dependencies

These components will need updated imports for:

- Type imports: `@/types/employee`
- Hook imports: `@/hooks/use-employees`, etc.
- UI component imports: `@/components/ui/*`

### Validation

- All employee components moved
- Employee CRUD operations work
- List, forms, dialogs render correctly
- Empty states display properly

---

## Phase 8: Reorganize Role Feature Components

### Description

Move all role management components into `components/roles/`. This creates a dedicated module for all role-related UI.

### Current Role Component Locations

```
components/resa/sidebar-right/roles/
  ├── role-collapsible-section.tsx
  ├── role-delete-dialog.tsx
  ├── role-detail-sheet.tsx
  └── role-form-dialog.tsx
```

### File Moves

| Source                                                             | Destination                                     |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `components/resa/sidebar-right/roles/role-collapsible-section.tsx` | `components/roles/role-collapsible-section.tsx` |
| `components/resa/sidebar-right/roles/role-delete-dialog.tsx`       | `components/roles/role-delete-dialog.tsx`       |
| `components/resa/sidebar-right/roles/role-detail-sheet.tsx`        | `components/roles/role-detail-sheet.tsx`        |
| `components/resa/sidebar-right/roles/role-form-dialog.tsx`         | `components/roles/role-form-dialog.tsx`         |

### Additional Role-Related Components

Don't forget the role legend in the left sidebar:
| Source | Destination |
|--------|-------------|
| `components/resa/sidebar-left/legend/role-legend.tsx` | `components/roles/role-legend.tsx` |

### Note

The role hooks were already moved in Phase 4 to `hooks/`:

- `use-roles.tsx`
- `use-role-form.tsx`
- `use-role-delete.tsx`

### Import Updates Required

**Before:**

```typescript
import { RoleFormDialog } from "@/components/resa/sidebar-right/roles/role-form-dialog";
import { RoleLegend } from "@/components/resa/sidebar-left/legend/role-legend";
```

**After:**

```typescript
import { RoleFormDialog } from "@/components/roles/role-form-dialog";
import { RoleLegend } from "@/components/roles/role-legend";
```

### Component Dependencies

These components will need updated imports for:

- Type imports: `@/types/role`
- Hook imports: `@/hooks/use-roles`, etc.
- Style utilities: may need to move `utils/role-colors.ts` to `lib/styles/`

### Validation

- All role components moved
- Role CRUD operations work
- Color coding displays correctly
- Legend renders in left sidebar

---

## Phase 9: Reorganize Schedule Feature Components

### Description

Move all schedule/shift template management components into `components/schedules/`. This is separate from calendar UI - these are the management interfaces for creating schedule templates.

### Current Schedule Component Locations

```
components/resa/sidebar-right/schedules/
  ├── schedule-list.tsx
  ├── shift-template-collapsible-section.tsx
  └── shift-template-form-dialog.tsx
```

### File Moves

| Source                                                                           | Destination                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `components/resa/sidebar-right/schedules/schedule-list.tsx`                      | `components/schedules/schedule-list.tsx`                      |
| `components/resa/sidebar-right/schedules/shift-template-collapsible-section.tsx` | `components/schedules/shift-template-collapsible-section.tsx` |
| `components/resa/sidebar-right/schedules/shift-template-form-dialog.tsx`         | `components/schedules/shift-template-form-dialog.tsx`         |

### Note

The schedule hooks were already moved in Phase 4 to `hooks/`:

- `use-shift-templates.tsx`
- `use-shift-template-form.tsx`
- `use-schedule.tsx`

### Import Updates Required

**Before:**

```typescript
import { ShiftTemplateFormDialog } from "@/components/resa/sidebar-right/schedules/shift-template-form-dialog";
import { ScheduleList } from "@/components/resa/sidebar-right/schedules/schedule-list";
```

**After:**

```typescript
import { ShiftTemplateFormDialog } from "@/components/schedules/shift-template-form-dialog";
import { ScheduleList } from "@/components/schedules/schedule-list";
```

### Distinction from Calendar Components

- `components/calendar/*` - Visual calendar UI (week view, grid, time slots)
- `components/schedules/*` - Schedule management UI (templates, lists, forms)

### Validation

- All schedule components moved
- Shift template creation works
- Schedule list displays correctly
- Forms submit properly

---

## Phase 10: Reorganize Workspace Feature Components

### Description

Move all workspace (restaurant location) management components into `components/workspaces/`. This handles the restaurant selection and management UI.

### Current Workspace Component Locations

```
components/resa/sidebar-left/workspaces/
  ├── components/
  │   └── places-autocomplete-input.tsx
  ├── workspace-delete-dialog.tsx
  ├── workspace-empty-state.tsx
  ├── workspace-form-dialog.tsx
  ├── workspace-icon.tsx
  ├── workspace-list-item.tsx
  └── workspace-list.tsx
```

### File Moves

| Source                                                                             | Destination                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `components/resa/sidebar-left/workspaces/workspace-delete-dialog.tsx`              | `components/workspaces/workspace-delete-dialog.tsx`   |
| `components/resa/sidebar-left/workspaces/workspace-empty-state.tsx`                | `components/workspaces/workspace-empty-state.tsx`     |
| `components/resa/sidebar-left/workspaces/workspace-form-dialog.tsx`                | `components/workspaces/workspace-form-dialog.tsx`     |
| `components/resa/sidebar-left/workspaces/workspace-icon.tsx`                       | `components/workspaces/workspace-icon.tsx`            |
| `components/resa/sidebar-left/workspaces/workspace-list-item.tsx`                  | `components/workspaces/workspace-list-item.tsx`       |
| `components/resa/sidebar-left/workspaces/workspace-list.tsx`                       | `components/workspaces/workspace-list.tsx`            |
| `components/resa/sidebar-left/workspaces/components/places-autocomplete-input.tsx` | `components/workspaces/places-autocomplete-input.tsx` |

### Note

The workspace hooks were already moved in Phase 4 to `hooks/`:

- `use-workplaces.tsx`
- `use-workspace-form.tsx`
- `use-workspace-delete.tsx`
- `use-google-maps.tsx`

### Import Updates Required

**Before:**

```typescript
import { WorkspaceList } from "@/components/resa/sidebar-left/workspaces/workspace-list";
import { PlacesAutocompleteInput } from "@/components/resa/sidebar-left/workspaces/components/places-autocomplete-input";
```

**After:**

```typescript
import { WorkspaceList } from "@/components/workspaces/workspace-list";
import { PlacesAutocompleteInput } from "@/components/workspaces/places-autocomplete-input";
```

### Component Dependencies

These components will need updated imports for:

- Type imports: `@/types/workspace`, `@/types/google-places`
- Hook imports: `@/hooks/use-workplaces`, `@/hooks/use-google-maps`
- Context imports: `@/contexts/restaurant-context` (if moved)

### Validation

- All workspace components moved
- Workspace CRUD operations work
- Google Places autocomplete works
- Restaurant selection functional

---

## Phase 11: Reorganize Utility Functions

### Description

Consolidate utility functions from `components/resa/schedule/utils/` into a better organized structure in `lib/` or create a new top-level `utils/` directory.

### Current Utility Locations

```
components/resa/schedule/utils/
  ├── employee-colors.ts
  ├── role-colors.ts
  ├── shift-utils.ts
  └── time-utils.ts
```

### Organize in lib/ subdirectories

```
lib/
  ├── calendar/
  │   ├── date-utils.ts (from time-utils.ts)
  │   └── shift-utils.ts
  └── styles/
      ├── employee-colors.ts
      └── role-colors.ts
```

### Recommended: (lib/)

| Source                                              | Destination                     |
| --------------------------------------------------- | ------------------------------- |
| `components/resa/schedule/utils/time-utils.ts`      | `lib/calendar/date-utils.ts`    |
| `components/resa/schedule/utils/shift-utils.ts`     | `lib/calendar/shift-utils.ts`   |
| `components/resa/schedule/utils/employee-colors.ts` | `lib/styles/employee-colors.ts` |
| `components/resa/schedule/utils/role-colors.ts`     | `lib/styles/role-colors.ts`     |

### Import Updates Required

**Before:**

```typescript
import { getTimeSlots } from "@/components/resa/schedule/utils/time-utils";
import { getRoleColor } from "@/components/resa/schedule/utils/role-colors";
```

**After:**

```typescript
import { getTimeSlots } from "@/lib/calendar/date-utils";
import { getRoleColor } from "@/lib/styles/role-colors";
```

### Validation

- All utility files moved
- Calendar date calculations work
- Color schemes display correctly
- No broken utility imports

---

## Phase 12: Update All Import Paths

### Description

Systematically update all import statements across the codebase to reflect the new file locations. This is the most critical phase - missing even one import will break the build.

### Import Categories to Update

#### 1. Type Imports

**Pattern:** `@/components/resa/*/types/*` → `@/types/*`

Files affected: ~50+ files

```typescript
// Before
import type { Employee } from "@/components/resa/sidebar-right/types/employee";

// After
import type { Employee } from "@/types/employee";
```

#### 2. Hook Imports

**Pattern:** `@/components/resa/*/hooks/*` → `@/hooks/*`

Files affected: ~30+ files

```typescript
// Before
import { useEmployees } from "@/components/resa/sidebar-right/employees/hooks/use-employees";

// After
import { useEmployees } from "@/hooks/use-employees";
```

#### 3. Context Imports

**Pattern:** `@/components/resa/schedule/contexts/*` → `@/contexts/*`

Files affected: ~10+ files

```typescript
// Before
import { useWeekNavigation } from "@/components/resa/schedule/contexts/week-navigation-context";

// After
import { useWeekNavigation } from "@/contexts/week-navigation-context";
```

#### 4. Layout Component Imports

**Pattern:** `@/components/resa/sidebar-*/*` → `@/components/layout/*`

Files affected: ~15+ files

```typescript
// Before
import { AppSidebar } from "@/components/resa/app-sidebar";
import { UserMenu } from "@/components/resa/sidebar-left/user/user-menu";

// After
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
```

#### 5. Calendar Component Imports

**Pattern:** `@/components/resa/schedule/*` → `@/components/calendar/*`

Files affected: ~20+ files

```typescript
// Before
import { WeeklyCalendar } from "@/components/resa/schedule/weekly-calendar";

// After
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
```

#### 6. Feature Module Imports

**Pattern:** `@/components/resa/sidebar-right/{feature}/*` → `@/components/{feature}/*`

Files affected: ~40+ files

```typescript
// Before
import { EmployeeList } from "@/components/resa/sidebar-right/employees/employee-list";
import { RoleFormDialog } from "@/components/resa/sidebar-right/roles/role-form-dialog";

// After
import { EmployeeList } from "@/components/employees/employee-list";
import { RoleFormDialog } from "@/components/roles/role-form-dialog";
```

#### 7. Utility Imports

**Pattern:** `@/components/resa/schedule/utils/*` → `@/lib/*`

Files affected: ~15+ files

```typescript
// Before
import { formatTime } from "@/components/resa/schedule/utils/time-utils";
import { getRoleColor } from "@/components/resa/schedule/utils/role-colors";

// After
import { formatTime } from "@/lib/calendar/date-utils";
import { getRoleColor } from "@/lib/styles/role-colors";
```

### Files That Need Import Updates

#### App Router Files (~8 files)

- `app/(resa)/layout.tsx` - Heavy imports from sidebars, contexts, providers
- `app/(resa)/home/page.tsx` - Calendar component imports
- Other route files

#### Component Files (~133 files)

- All components in `components/layout/`
- All components in `components/calendar/`
- All components in `components/employees/`
- All components in `components/roles/`
- All components in `components/schedules/`
- All components in `components/workspaces/`
- Marketing components (minimal changes)
- UI components (likely no changes)

#### Hook Files (~15 files)

- All files in `hooks/` that import types or other hooks

#### Context Files (~3 files)

- All files in `contexts/` that import types or hooks

#### Library Files (~5 files)

- Files in `lib/` that import from components

### Systematic Approach

1. **Start with leaf nodes** (components with no dependencies on other custom components)

   - UI primitives (already in `components/ui/`)
   - Utility functions
   - Type definitions

2. **Move to mid-level components** (components that import utilities and types)

   - Individual list items
   - Form fields
   - Display components

3. **Finish with top-level components** (components that compose other components)

   - Dialogs and sheets
   - Lists and sections
   - Sidebar components
   - Calendar views
   - Layout files

4. **Finally update route files** (files that import from components)
   - Page components
   - Layout components

### Tools for Mass Updates

Use VS Code Find and Replace with regex:

```regex
Find:    @/components/resa/sidebar-right/employees/(.+)
Replace: @/components/employees/$1

Find:    @/components/resa/sidebar-right/types/(.+)
Replace: @/types/$1

Find:    @/components/resa/schedule/utils/time-utils
Replace: @/lib/calendar/date-utils
```

### Validation After Each Batch

- Run TypeScript compiler: `npx tsc --noEmit`
- Check for unresolved imports
- Fix errors before moving to next batch

---

## Phase 13: Clean Up Empty Directories

### Description

Remove all empty directories left behind from the migration. This prevents confusion and keeps the project structure clean.

### Directories to Remove

```bash
# Old component directories (should be empty after migration)
rm -rf components/resa/sidebar-left/types
rm -rf components/resa/sidebar-left/hooks
rm -rf components/resa/sidebar-left/user
rm -rf components/resa/sidebar-left/workspaces/components
rm -rf components/resa/sidebar-left/workspaces
rm -rf components/resa/sidebar-left/legend
rm -rf components/resa/sidebar-left

rm -rf components/resa/sidebar-right/calendar
rm -rf components/resa/sidebar-right/employees/hooks
rm -rf components/resa/sidebar-right/employees
rm -rf components/resa/sidebar-right/footer
rm -rf components/resa/sidebar-right/hooks
rm -rf components/resa/sidebar-right/roles/hooks
rm -rf components/resa/sidebar-right/roles
rm -rf components/resa/sidebar-right/schedules/hooks
rm -rf components/resa/sidebar-right/schedules
rm -rf components/resa/sidebar-right/types
rm -rf components/resa/sidebar-right

rm -rf components/resa/schedule/calendar
rm -rf components/resa/schedule/contexts
rm -rf components/resa/schedule/hooks
rm -rf components/resa/schedule/shifts
rm -rf components/resa/schedule/types
rm -rf components/resa/schedule/utils
rm -rf components/resa/schedule

rm -rf components/resa/sidebar-core

# Finally remove the resa directory itself
rm -rf components/resa
```

### Verification Before Deletion

Before removing each directory, verify it's empty:

```bash
# Check if directory is empty
ls -la components/resa/sidebar-left/types

# Should show only . and ..
```

### Final Directory Structure Verification

After cleanup, `components/` should look like:

```
components/
├── calendar/          # ✓ Calendar UI components
├── employees/         # ✓ Employee management
├── layout/            # ✓ Sidebars and app shell
├── marketing/         # ✓ Marketing pages
├── roles/             # ✓ Role management
├── schedules/         # ✓ Schedule management
├── ui/                # ✓ ShadCN primitives
└── workspaces/        # ✓ Workspace management
```

---

## Phase 14: Testing & Validation

### Description

Comprehensive testing to ensure all functionality works correctly after the migration. This phase catches any missed imports or broken functionality.

### Build Validation

```bash
# Clean build
rm -rf .next
npm run build
```

**Expected result:** Build succeeds with no errors

**Common errors to watch for:**

- `Cannot find module '@/components/resa/...'` - Missed import update
- `Module not found: Can't resolve '@/types/...'` - Type file not moved
- TypeScript errors about missing types - Type import path incorrect

### Development Server Testing

```bash
npm run dev
```

**Test checklist:**

#### Authentication & Layout

- [ ] App loads without console errors
- [ ] Login page renders
- [ ] Authentication flow works
- [ ] Protected routes redirect correctly
- [ ] Left sidebar renders
- [ ] Right sidebar renders
- [ ] User menu displays
- [ ] User avatar shows

#### Workspace Management

- [ ] Workspace list displays
- [ ] Can create new workspace
- [ ] Google Places autocomplete works
- [ ] Can edit workspace
- [ ] Can delete workspace
- [ ] Can switch between workspaces

#### Employee Management

- [ ] Employee list displays
- [ ] Can add new employee
- [ ] Can edit employee
- [ ] Can delete employee
- [ ] Employee form validation works
- [ ] Employee detail sheet opens

#### Role Management

- [ ] Role list displays
- [ ] Can create new role
- [ ] Can edit role
- [ ] Can delete role
- [ ] Role colors display correctly
- [ ] Role legend shows in left sidebar

#### Schedule/Shift Template Management

- [ ] Shift template list displays
- [ ] Can create shift template
- [ ] Can edit shift template
- [ ] Can assign roles to templates
- [ ] Template form validation works

#### Calendar Features

- [ ] Weekly calendar renders
- [ ] Time grid displays correctly
- [ ] Day headers show
- [ ] Can navigate between weeks
- [ ] "Today" button works
- [ ] Shift cards display on calendar
- [ ] Can drag and drop employees
- [ ] Mini calendar in right sidebar works
- [ ] Date selection updates main calendar

#### Visual Checks

- [ ] No layout shifts or broken styling
- [ ] Colors (employee/role) display correctly
- [ ] Icons render properly
- [ ] Responsive design works (mobile/tablet)
- [ ] Dark mode works (if implemented)

### TypeScript Validation

```bash
# Type checking without emitting files
npx tsc --noEmit
```

**Expected result:** No TypeScript errors

### Lint Validation

```bash
npm run lint
```

**Expected result:** No linting errors (or only pre-existing ones)

### Browser Console Checks

Open browser DevTools and check for:

- [ ] No console errors
- [ ] No console warnings (except expected ones)
- [ ] No failed network requests
- [ ] No React hydration errors

### Import Path Spot Checks

Randomly verify several files have correct import paths:

```bash
# Check a layout component
cat components/layout/left-sidebar.tsx | grep "import"

# Check a calendar component
cat components/calendar/calendar-week-view.tsx | grep "import"

# Check a hook
cat hooks/use-employees.tsx | grep "import"

# Check the main layout
cat app/\(resa\)/layout.tsx | grep "import"
```

All imports should use new paths (no `@/components/resa/`)

### Performance Checks

- [ ] App feels responsive
- [ ] No significant performance degradation
- [ ] Fast refresh (HMR) still works
- [ ] Build time similar to before

---

## Phase 15: Documentation Updates

### Description

Update project documentation to reflect the new structure. This helps developers understand the new organization.

### Files to Update

#### 1. Update CLAUDE.md

Add new frontend structure section:

```markdown
### Frontend Structure (Updated)
```

frontend/
├── app/ # Next.js App Router
│ ├── (auth)/ # Authentication routes
│ ├── (marketing)/ # Marketing pages
│ └── (resa)/ # Protected app routes
├── components/
│ ├── calendar/ # Calendar UI components
│ ├── employees/ # Employee management
│ ├── layout/ # App shell, sidebars
│ ├── marketing/ # Marketing components
│ ├── roles/ # Role management
│ ├── schedules/ # Schedule management
│ ├── ui/ # ShadCN primitives
│ └── workspaces/ # Workspace management
├── contexts/ # React context providers
├── hooks/ # Custom React hooks
├── lib/ # Utilities and helpers
│ ├── calendar/ # Date/time utilities
│ └── styles/ # Color utilities
└── types/ # TypeScript type definitions

```

```

Document import patterns:

````markdown
### Import Patterns

**Types:**

```typescript
import type { Employee } from "@/types/employee";
import type { Role } from "@/types/role";
```
````

**Hooks:**

```typescript
import { useEmployees } from "@/hooks/use-employees";
import { useRoles } from "@/hooks/use-roles";
```

**Contexts:**

```typescript
import { useWeekNavigation } from "@/contexts/week-navigation-context";
```

**Components:**

```typescript
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { EmployeeList } from "@/components/employees/employee-list";
import { LeftSidebar } from "@/components/layout/left-sidebar";
```

````

#### 2. Create Component Directory README

Create `components/README.md`:

```markdown
# Components Directory

## Structure

- **calendar/** - Calendar and scheduling UI components
  - Weekly calendar view, time grids, shift cards

- **employees/** - Employee management interface
  - Lists, forms, dialogs for CRUD operations

- **layout/** - Application shell and layout components
  - Sidebars, navigation, user menu

- **marketing/** - Public-facing marketing components
  - Hero, features, CTAs

- **roles/** - Role management interface
  - Role CRUD, color management, legend

- **schedules/** - Schedule template management
  - Shift templates, schedule lists

- **ui/** - ShadCN UI primitive components
  - Buttons, forms, dialogs, etc. (do not edit manually)

- **workspaces/** - Workspace (restaurant) management
  - Workspace selection, CRUD, Google Places integration

## Import Examples

[Add examples here]
````

#### 3. Update README.md

Add migration notes:

```markdown
## Project Structure

The frontend follows a type-based component organization:

- Components organized by UI concern (layout, calendar) and feature (employees, roles)
- Centralized types in `/types`
- Centralized hooks in `/hooks`
- Centralized contexts in `/contexts`

See `COMPONENT_MIGRATION.md` for migration history.
```

### Create Migration History Document

This file (COMPONENT_MIGRATION.md) serves as the historical record. Add a completion section:

```markdown
## Migration Completion

**Date Completed:** [Date]
**Migrated By:** [Name]
**Build Status:** ✓ Passing
**Tests:** ✓ All passing

### Files Moved

- 8 type files
- 15 hook files
- 3 context files
- 133+ component files

### Import Paths Updated

- ~200+ import statements updated across codebase

### Final Structure

[Copy final directory tree]
```

---

## Rollback Plan

### If Migration Fails

If you encounter critical issues and need to rollback:

#### 1. Git Rollback (if using Git)

```bash
# See recent commits
git log --oneline -10

# Rollback to commit before migration
git reset --hard <commit-hash-before-migration>

# Force push if already pushed (DANGEROUS)
git push --force
```

#### 2. Manual Rollback

If you created a backup:

```bash
# Restore from backup
rm -rf frontend/
cp -r frontend-backup/ frontend/
```

#### 3. Incremental Rollback

If only certain phases failed, rollback those phases:

```bash
# Example: Rollback type consolidation
git checkout HEAD -- types/
git checkout HEAD -- components/resa/*/types/
```

### Prevention

**Before starting migration:**

```bash
# Create a backup
cp -r frontend/ frontend-backup/

# Or create a git branch
git checkout -b component-migration
git commit -m "Checkpoint before migration"
```

**During migration:**

- Commit after each completed phase
- Test after each phase before proceeding
- Keep detailed notes of what was moved

---

## Execution Strategy

### Recommended Order

1. **Phase 1** - Create directories (5 minutes)
2. **Phase 2** - Consolidate types (30 minutes)
   - Move files
   - Update imports
   - Test build
3. **Phase 3** - Consolidate contexts (20 minutes)
   - Move files
   - Update imports
   - Test build
4. **Phase 4** - Consolidate hooks (45 minutes)
   - Move files
   - Update imports
   - Test build
5. **Phase 5** - Layout components (30 minutes)
6. **Phase 6** - Calendar components (30 minutes)
7. **Phase 7** - Employee components (20 minutes)
8. **Phase 8** - Role components (20 minutes)
9. **Phase 9** - Schedule components (15 minutes)
10. **Phase 10** - Workspace components (20 minutes)
11. **Phase 11** - Utilities (15 minutes)
12. **Phase 12** - Update remaining imports (1-2 hours)
13. **Phase 13** - Clean up empty dirs (10 minutes)
14. **Phase 14** - Testing (1 hour)
15. **Phase 15** - Documentation (30 minutes)

**Total estimated time:** 6-8 hours

### Git Strategy

```bash
# Create feature branch
git checkout -b refactor/reorganize-components

# Commit after each phase
git add .
git commit -m "refactor: consolidate type definitions (Phase 2)"

# When complete
git push origin refactor/reorganize-components
# Create PR for review
```

### Team Coordination

- Communicate migration schedule to team
- Avoid concurrent feature work during migration
- Consider doing migration in off-hours
- Have team member review import path changes

---

## Success Criteria

Migration is complete when:

- [x] All files moved to new locations
- [x] All import paths updated
- [x] `npm run build` succeeds with no errors
- [x] `npm run dev` runs without errors
- [x] All features functional (see Phase 14 checklist)
- [x] No TypeScript errors (`npx tsc --noEmit`)
- [x] No ESLint errors (`npm run lint`)
- [x] No console errors in browser
- [x] Empty directories cleaned up
- [x] Documentation updated
- [x] Changes committed to Git
- [x] Team notified of new structure

---

## Post-Migration

### Benefits Achieved

After migration, you should have:

1. **Cleaner component organization**

   - Components grouped by type/concern
   - Easier to find related components
   - Reduced nesting depth

2. **Centralized types**

   - Single source of truth for type definitions
   - No duplicate types
   - Easier to maintain consistency

3. **Centralized hooks**

   - All custom hooks in one place
   - Better discoverability
   - Easier to prevent duplication

4. **Clearer imports**

   - Shorter import paths
   - More semantic (`@/types/employee` vs `@/components/resa/sidebar-right/types/employee`)
   - Easier to refactor

5. **Better separation of concerns**
   - Layout vs. features vs. UI primitives
   - Calendar UI vs. schedule management
   - Contexts separate from components

### Ongoing Maintenance

**When adding new components:**

- Types go in `types/`
- Hooks go in `hooks/`
- Contexts go in `contexts/`
- Components go in appropriate feature directory

**When adding new features:**

- Create feature directory in `components/` if needed
- Keep components flat within feature directory
- Don't recreate nested hooks/types folders

**Import pattern conventions:**

```typescript
// Always use absolute imports with @
import { Employee } from "@/types/employee";
import { useEmployees } from "@/hooks/use-employees";

// Not relative imports
import { Employee } from "../../types/employee";
```

---

## Appendix: File Inventory

### Complete File Move Mapping

[This section contains comprehensive before/after paths for every file moved during migration]

#### Types (8 files)

```
components/resa/sidebar-left/types/google-places.ts
  → types/google-places.ts

components/resa/sidebar-left/types/user.ts
  → types/user.ts

components/resa/sidebar-left/types/workspace.ts
  → types/workspace.ts

components/resa/sidebar-right/types/calendar.ts
  → types/calendar.ts

components/resa/sidebar-right/types/employee.ts
  → types/employee.ts

components/resa/sidebar-right/types/role.ts
  → types/role.ts

components/resa/sidebar-right/types/shift-template.ts
  → types/shift-template.ts

components/resa/schedule/types/schedule.ts
  → types/schedule.ts
```

#### Contexts (3 files)

```
components/resa/schedule/contexts/schedule-drag-drop-context.tsx
  → contexts/schedule-drag-drop-context.tsx

components/resa/schedule/contexts/shift-template-context.tsx
  → contexts/shift-template-context.tsx

components/resa/schedule/contexts/week-navigation-context.tsx
  → contexts/week-navigation-context.tsx
```

#### Hooks (14 files)

```
components/resa/schedule/hooks/use-schedule.tsx
  → hooks/use-schedule.tsx

components/resa/sidebar-left/hooks/use-google-maps.tsx
  → hooks/use-google-maps.tsx

components/resa/sidebar-left/hooks/use-workplaces.tsx
  → hooks/use-workplaces.tsx

components/resa/sidebar-left/hooks/use-workspace-delete.tsx
  → hooks/use-workspace-delete.tsx

components/resa/sidebar-left/hooks/use-workspace-form.tsx
  → hooks/use-workspace-form.tsx

components/resa/sidebar-right/hooks/use-calendars.tsx
  → hooks/use-calendars.tsx

components/resa/sidebar-right/employees/hooks/use-employee-delete.tsx
  → hooks/use-employee-delete.tsx

components/resa/sidebar-right/employees/hooks/use-employee-form.tsx
  → hooks/use-employee-form.tsx

components/resa/sidebar-right/employees/hooks/use-employees.tsx
  → hooks/use-employees.tsx

components/resa/sidebar-right/roles/hooks/use-role-delete.tsx
  → hooks/use-role-delete.tsx

components/resa/sidebar-right/roles/hooks/use-role-form.tsx
  → hooks/use-role-form.tsx

components/resa/sidebar-right/roles/hooks/use-roles.tsx
  → hooks/use-roles.tsx

components/resa/sidebar-right/schedules/hooks/use-shift-template-form.tsx
  → hooks/use-shift-template-form.tsx

components/resa/sidebar-right/schedules/hooks/use-shift-templates.tsx
  → hooks/use-shift-templates.tsx
```

#### Layout Components (8 files)

```
components/resa/app-sidebar.tsx
  → components/layout/app-sidebar.tsx

components/resa/sidebar-core/sidebar.tsx
  → components/layout/sidebar.tsx

components/resa/sidebar-left/sidebar-left.tsx
  → components/layout/left-sidebar.tsx

components/resa/sidebar-right/sidebar-right.tsx
  → components/layout/right-sidebar.tsx

components/resa/sidebar-left/user/user-menu.tsx
  → components/layout/user-menu.tsx

components/resa/sidebar-left/user/user-avatar.tsx
  → components/layout/user-avatar.tsx

components/resa/sidebar-left/user/user-dropdown-items.tsx
  → components/layout/user-dropdown-items.tsx

components/resa/sidebar-right/footer/sidebar-footer-actions.tsx
  → components/layout/sidebar-footer-actions.tsx
```

#### Calendar Components (9 files)

```
components/resa/schedule/weekly-calendar.tsx
  → components/calendar/calendar-week-view.tsx

components/resa/schedule/calendar/calendar-grid.tsx
  → components/calendar/calendar-grid.tsx

components/resa/schedule/calendar/calendar-header.tsx
  → components/calendar/calendar-header.tsx

components/resa/schedule/calendar/day-header.tsx
  → components/calendar/day-header.tsx

components/resa/schedule/calendar/time-column.tsx
  → components/calendar/time-column.tsx

components/resa/schedule/calendar/time-slot-cell.tsx
  → components/calendar/time-slot-cell.tsx

components/resa/schedule/shifts/shift-card.tsx
  → components/calendar/shift-card.tsx

components/resa/sidebar-right/calendar/date-picker.tsx
  → components/calendar/calendar-mini.tsx

components/resa/date-picker.tsx
  → components/calendar/date-picker.tsx
```

#### Employee Components (7 files)

```
components/resa/sidebar-right/employees/employee-collapsible-section.tsx
  → components/employees/employee-collapsible-section.tsx

components/resa/sidebar-right/employees/employee-delete-dialog.tsx
  → components/employees/employee-delete-dialog.tsx

components/resa/sidebar-right/employees/employee-detail-sheet.tsx
  → components/employees/employee-detail-sheet.tsx

components/resa/sidebar-right/employees/employee-empty-state.tsx
  → components/employees/employee-empty-state.tsx

components/resa/sidebar-right/employees/employee-form-dialog.tsx
  → components/employees/employee-form-dialog.tsx

components/resa/sidebar-right/employees/employee-list-item.tsx
  → components/employees/employee-list-item.tsx

components/resa/sidebar-right/employees/employee-list.tsx
  → components/employees/employee-list.tsx
```

#### Role Components (5 files)

```
components/resa/sidebar-right/roles/role-collapsible-section.tsx
  → components/roles/role-collapsible-section.tsx

components/resa/sidebar-right/roles/role-delete-dialog.tsx
  → components/roles/role-delete-dialog.tsx

components/resa/sidebar-right/roles/role-detail-sheet.tsx
  → components/roles/role-detail-sheet.tsx

components/resa/sidebar-right/roles/role-form-dialog.tsx
  → components/roles/role-form-dialog.tsx

components/resa/sidebar-left/legend/role-legend.tsx
  → components/roles/role-legend.tsx
```

#### Schedule Components (3 files)

```
components/resa/sidebar-right/schedules/schedule-list.tsx
  → components/schedules/schedule-list.tsx

components/resa/sidebar-right/schedules/shift-template-collapsible-section.tsx
  → components/schedules/shift-template-collapsible-section.tsx

components/resa/sidebar-right/schedules/shift-template-form-dialog.tsx
  → components/schedules/shift-template-form-dialog.tsx
```

#### Workspace Components (7 files)

```
components/resa/sidebar-left/workspaces/workspace-delete-dialog.tsx
  → components/workspaces/workspace-delete-dialog.tsx

components/resa/sidebar-left/workspaces/workspace-empty-state.tsx
  → components/workspaces/workspace-empty-state.tsx

components/resa/sidebar-left/workspaces/workspace-form-dialog.tsx
  → components/workspaces/workspace-form-dialog.tsx

components/resa/sidebar-left/workspaces/workspace-icon.tsx
  → components/workspaces/workspace-icon.tsx

components/resa/sidebar-left/workspaces/workspace-list-item.tsx
  → components/workspaces/workspace-list-item.tsx

components/resa/sidebar-left/workspaces/workspace-list.tsx
  → components/workspaces/workspace-list.tsx

components/resa/sidebar-left/workspaces/components/places-autocomplete-input.tsx
  → components/workspaces/places-autocomplete-input.tsx
```

#### Utility Files (4 files)

```
components/resa/schedule/utils/time-utils.ts
  → lib/calendar/date-utils.ts

components/resa/schedule/utils/shift-utils.ts
  → lib/calendar/shift-utils.ts

components/resa/schedule/utils/employee-colors.ts
  → lib/styles/employee-colors.ts

components/resa/schedule/utils/role-colors.ts
  → lib/styles/role-colors.ts
```

---

**Total Files to Move:** 68 files
**Estimated Import Updates:** 200+ import statements

---

## Questions or Issues?

If you encounter problems during migration:

1. Check the TypeScript errors carefully - they often point to missed imports
2. Use VS Code's "Find All References" to locate all usages of a moved file
3. Test incrementally - don't move everything at once
4. Keep Git commits small and focused on one phase at a time
5. When in doubt, refer back to this document for the correct paths

Good luck with your migration! 🚀

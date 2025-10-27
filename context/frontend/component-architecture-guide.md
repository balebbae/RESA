# Component Architecture Guide

This document outlines the architectural patterns and folder structure used in the RESA frontend application for organizing complex, feature-rich components.

## Philosophy

The architecture follows these core principles:

1. **Feature-based Organization** - Group related code by feature rather than by technical concern
2. **Separation of Concerns** - Keep business logic, UI logic, and presentation separate
3. **Single Responsibility** - Each component/hook/type file should have one clear purpose
4. **Reusability** - Extract common patterns into reusable pieces
5. **Discoverability** - Folder structure should make it easy to find what you're looking for

## Folder Structure Pattern

When building a complex feature or component system, use this structure:

```
components/[domain]/[feature-name]/
├── core/                       # Core primitives & base components
│   ├── [feature]-base.tsx
│   └── [feature]-primitives.tsx
│
├── [sub-feature-1]/           # Feature subdivisions (e.g., user, workspaces)
│   ├── [component].tsx
│   ├── [component-part].tsx
│   └── [component-variant].tsx
│
├── [sub-feature-2]/
│   ├── [component].tsx
│   └── [related-component].tsx
│
├── hooks/                     # Custom hooks for business logic
│   ├── use-[feature-data].tsx
│   ├── use-[feature-form].tsx
│   └── use-[feature-action].tsx
│
├── types/                     # TypeScript definitions
│   ├── [entity].ts
│   └── [interfaces].ts
│
├── utils/                     # Utility functions (optional)
│   └── [helper-functions].ts
│
└── layout/                    # Layout components (optional)
    └── [layout-wrapper].tsx
```

## Real-World Example: Split Sidebar Architecture

The sidebar implementation demonstrates both modular organization AND feature splitting:

### Overview
The application has left and right sidebars that share common primitives but have distinct features. They are organized as three separate features:

```
components/resa/
├── sidebar-core/                      # Shared primitives for both sidebars
│   └── sidebar.tsx                    # Base components (SidebarProvider, etc.)
│
├── sidebar-left/                      # Left sidebar feature
│   ├── user/
│   │   ├── user-menu.tsx
│   │   ├── user-avatar.tsx
│   │   └── user-dropdown-items.tsx
│   │
│   ├── workspaces/
│   │   ├── workspace-list.tsx
│   │   ├── workspace-list-item.tsx
│   │   ├── workspace-empty-state.tsx
│   │   ├── workspace-form-dialog.tsx
│   │   ├── workspace-delete-dialog.tsx
│   │   └── workspace-icon.tsx
│   │
│   ├── hooks/
│   │   ├── use-workplaces.tsx
│   │   ├── use-workspace-form.tsx
│   │   └── use-workspace-delete.tsx
│   │
│   ├── types/
│   │   ├── workspace.ts
│   │   └── user.ts
│   │
│   └── sidebar-left.tsx               # Main component
│
└── sidebar-right/                     # Right sidebar feature
    ├── calendar/
    │   └── date-picker.tsx
    │
    ├── schedules/
    │   └── schedule-list.tsx
    │
    ├── footer/
    │   └── sidebar-footer-actions.tsx
    │
    ├── hooks/
    │   └── use-calendars.tsx
    │
    ├── types/
    │   └── calendar.ts
    │
    └── sidebar-right.tsx              # Main component
```

### Why Split?
1. **Independence**: Each sidebar can evolve separately
2. **Clarity**: Clear ownership and responsibility
3. **Shared Core**: Common primitives reduce duplication
4. **Scalability**: Easy to add more sidebar features

## Decision Matrix: Where to Put What

### Creating a New Component

**Ask yourself these questions:**

| Question | Answer | Action |
|----------|--------|--------|
| Is this a base primitive? | Yes | Put in `core/` |
| Does it belong to an existing sub-feature? | Yes | Put in that sub-feature folder |
| Is it a new distinct sub-feature? | Yes | Create new folder at root level |
| Is it reusable UI with no business logic? | Yes | Extract to separate file in same folder |
| Is it a state variant (empty, loading, error)? | Yes | Create separate component file |

### Creating a New Hook

| What does it do? | Where to put it |
|------------------|-----------------|
| Fetches data from API | `hooks/use-[entity-name].tsx` |
| Manages form state | `hooks/use-[entity]-form.tsx` |
| Handles specific action (delete, update) | `hooks/use-[entity]-[action].tsx` |
| UI-only state (open/close, selected) | Keep in component, or extract if reused |

### Creating Types

| Type of definition | Where to put it |
|--------------------|-----------------|
| Entity/data model | `types/[entity-name].ts` |
| Component props | In the same file as component |
| Hook return types | In the same file as hook |
| Shared interfaces | `types/[interface-name].ts` |

## When to Break Down Components

Break a component into smaller pieces when:

1. **File exceeds ~150-200 lines** - Consider extracting logical sections
2. **Multiple responsibilities** - Split by responsibility (e.g., form logic vs. delete logic)
3. **Repeated code patterns** - Extract to reusable component
4. **Complex conditional rendering** - Extract each state into separate component
5. **Reusability opportunity** - Extract if it can be used elsewhere

### Example: Breaking Down a Form

**Before (monolithic):**
```tsx
// workspace-form.tsx (400+ lines)
- Create mode
- Edit mode
- Delete confirmation
- Form validation
- API calls
```

**After (modular):**
```tsx
// workspace-form-dialog.tsx (150 lines)
- Dialog wrapper
- Form UI
- Mode switching

// hooks/use-workspace-form.tsx (130 lines)
- Form state
- Validation
- Create/Edit API calls

// workspace-delete-dialog.tsx (70 lines)
- Delete confirmation UI

// hooks/use-workspace-delete.tsx (50 lines)
- Delete API call
```

## Naming Conventions

### Components
- **Main feature component**: `[feature]-[type].tsx` (e.g., `workspace-list.tsx`)
- **Sub-components**: `[feature]-[part].tsx` (e.g., `workspace-list-item.tsx`)
- **State variants**: `[feature]-[state]-state.tsx` (e.g., `workspace-empty-state.tsx`)
- **Dialogs/Modals**: `[feature]-[type]-dialog.tsx` (e.g., `workspace-form-dialog.tsx`)
- **Reusable UI pieces**: `[feature]-[element].tsx` (e.g., `workspace-icon.tsx`)

### Hooks
- **Data fetching**: `use-[entity-plural].tsx` (e.g., `use-workplaces.tsx`)
- **Form management**: `use-[entity]-form.tsx` (e.g., `use-workspace-form.tsx`)
- **Actions**: `use-[entity]-[action].tsx` (e.g., `use-workspace-delete.tsx`)

### Types
- **Entities**: `[entity].ts` (e.g., `workspace.ts`, `user.ts`)
- **Props interfaces**: `[Component]Props` (e.g., `WorkspaceListProps`)
- **Hook returns**: `Use[Hook]Return` (e.g., `UseWorkspacesReturn`)

## Import Patterns

### Direct Imports (Recommended)
Always use direct file imports with explicit extensions for clarity:

```tsx
// ✅ Good - explicit and clear
import { WorkspaceList } from "@/components/resa/sidebar/workspaces/workspace-list"
import { useWorkplaces } from "@/components/resa/sidebar/hooks/use-workspaces"
import type { Workspace } from "@/components/resa/sidebar/types/workspace"
```

### Barrel Exports (Optional)
For convenience, you can add `index.ts` files, but avoid them if they cause build issues:

```ts
// components/resa/sidebar/workspaces/index.ts
export * from "./workspace-list"
export * from "./workspace-list-item"
```

## Example: Planning a New Feature

Let's say you want to implement a **Schedule Management** feature with calendar views, shift assignments, and employee management.

### Step 1: Identify Sub-Features
- Calendar display
- Shift management
- Employee assignments
- Filters and controls

### Step 2: Plan Folder Structure
```
components/resa/schedule/
├── core/
│   └── schedule-base.tsx              # Base calendar grid, providers
│
├── calendar/
│   ├── calendar-view.tsx              # Main calendar display
│   ├── calendar-day-cell.tsx          # Individual day
│   ├── calendar-week-view.tsx         # Week variant
│   └── calendar-month-view.tsx        # Month variant
│
├── shifts/
│   ├── shift-card.tsx                 # Individual shift display
│   ├── shift-form-dialog.tsx          # Create/edit shifts
│   ├── shift-assign-dialog.tsx        # Assign employees
│   └── shift-list.tsx                 # List view alternative
│
├── employees/
│   ├── employee-selector.tsx          # Employee picker
│   ├── employee-availability.tsx      # Availability display
│   └── employee-card.tsx              # Employee info card
│
├── controls/
│   ├── schedule-filters.tsx           # Filter controls
│   ├── date-navigator.tsx             # Date picker/navigator
│   └── view-switcher.tsx              # Toggle between views
│
├── hooks/
│   ├── use-schedule.tsx               # Fetch schedule data
│   ├── use-shifts.tsx                 # Shift CRUD operations
│   ├── use-shift-form.tsx             # Shift form state
│   ├── use-employee-assignments.tsx   # Assignment logic
│   └── use-schedule-filters.tsx       # Filter state
│
├── types/
│   ├── schedule.ts                    # Schedule entity
│   ├── shift.ts                       # Shift entity
│   ├── assignment.ts                  # Assignment entity
│   └── filters.ts                     # Filter types
│
└── utils/
    ├── date-utils.ts                  # Date manipulation
    └── schedule-calculations.ts       # Business logic utilities
```

### Step 3: Identify Data Flow
1. **Data fetching**: `use-schedule.tsx` fetches schedule + shifts
2. **User actions**: Form dialogs use form hooks
3. **State management**: Each sub-feature manages its own state
4. **Parent coordination**: Main `schedule-view.tsx` coordinates sub-features

## Anti-Patterns to Avoid

### ❌ Don't Do This

**1. Mixing concerns in one file**
```tsx
// ❌ Bad - form + delete + list all in one file
export function WorkspaceManager() {
  // 500+ lines mixing everything
}
```

**2. Deep nesting**
```tsx
// ❌ Bad - too many levels
components/resa/sidebar/workspaces/list/items/single/card/header/
```

**3. Generic naming**
```tsx
// ❌ Bad - unclear purpose
components/resa/sidebar/workspaces/component1.tsx
components/resa/sidebar/workspaces/helper.tsx
```

**4. Logic in UI components**
```tsx
// ❌ Bad - API calls directly in component
export function WorkspaceList() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/workspaces').then(r => r.json()).then(setData)
  }, [])

  return <div>...</div>
}
```

### ✅ Do This Instead

**1. Separate concerns**
```tsx
// ✅ Good - split into focused files
// workspace-list.tsx - just UI
// use-workspaces.tsx - data fetching
// workspace-form-dialog.tsx - form UI
// use-workspace-delete.tsx - delete logic
```

**2. Flat, feature-based structure**
```tsx
// ✅ Good - max 2-3 levels deep
components/resa/sidebar/workspaces/workspace-card.tsx
```

**3. Descriptive naming**
```tsx
// ✅ Good - clear purpose
components/resa/sidebar/workspaces/workspace-list-item.tsx
components/resa/sidebar/workspaces/workspace-empty-state.tsx
```

**4. Extract logic to hooks**
```tsx
// ✅ Good - hook handles logic
export function WorkspaceList() {
  const { workplaces, isLoading, error } = useWorkplaces()

  return <div>...</div>
}
```

## Checklist for New Features

Before starting implementation:

- [ ] Identify main feature and sub-features
- [ ] Plan folder structure (sketch it out)
- [ ] List required entities and types
- [ ] Identify data fetching needs (API endpoints)
- [ ] Determine form requirements (create, edit, delete)
- [ ] Plan state management approach
- [ ] Consider reusable components
- [ ] Think about loading/error/empty states

During implementation:

- [ ] Start with types (`types/` folder)
- [ ] Create data hooks (`hooks/` folder)
- [ ] Build core components
- [ ] Extract reusable pieces as you go
- [ ] Keep files under 200 lines when possible
- [ ] Add TypeScript types throughout
- [ ] Test each piece independently

After implementation:

- [ ] Review for extraction opportunities
- [ ] Check for duplicate code
- [ ] Ensure consistent naming
- [ ] Verify proper imports
- [ ] Document complex logic
- [ ] Consider adding to this guide if pattern is new

## Migration Strategy

When refactoring existing large components:

1. **Create new structure** without deleting old files
2. **Build new components** alongside old ones
3. **Test thoroughly** in isolation
4. **Swap imports** in parent components
5. **Delete old files** only after confirming everything works

## Separating Related Features

Sometimes a single logical concept (like "sidebar") actually represents multiple distinct features that happen to share some commonality. Here's how to decide when and how to split them:

### When to Split Features

Split related features when:

1. **Different Responsibilities** - Each side serves completely different purposes
   - Example: Left sidebar (navigation) vs. Right sidebar (calendar)

2. **Independent Evolution** - Features will change at different rates
   - Example: User menu stable, but workspace list frequently updated

3. **Separate Teams** - Different people will maintain each feature
   - Reduces merge conflicts and ownership confusion

4. **Distinct Data Sources** - Features fetch from different APIs
   - Example: Left sidebar uses `/restaurants`, right sidebar uses `/calendars`

5. **Size Management** - Combined feature exceeds 500-1000 lines
   - Splitting improves navigability and mental model

### How to Split: The Shared Core Pattern

When splitting, identify and extract shared dependencies:

#### Step 1: Identify Shared Code
```
Original sidebar/:
- Core primitives (used by both)  ← SHARED
- User menu (left only)           ← LEFT
- Workspaces (left only)          ← LEFT
- Calendar (right only)           ← RIGHT
- Schedules (right only)          ← RIGHT
```

#### Step 2: Create Shared Core
```bash
# Create shared location
mkdir sidebar-core/

# Move shared primitives
mv sidebar/core/sidebar.tsx → sidebar-core/sidebar.tsx
```

#### Step 3: Split into Features
```bash
# Create separate features
mv sidebar/ → sidebar-left/
mkdir sidebar-right/

# Each imports from shared core
# import { Sidebar } from "@/components/resa/sidebar-core/sidebar"
```

### Example: Sidebar Split

**Before (monolithic):**
```
sidebar/
  ├── core/              ← Used by all
  ├── user/              ← Left only
  ├── workspaces/        ← Left only
  └── calendar/          ← Right only (hypothetical)
```

**After (split with shared core):**
```
sidebar-core/            ← Shared primitives
  └── sidebar.tsx

sidebar-left/            ← Navigation feature
  ├── user/
  ├── workspaces/
  └── sidebar-left.tsx

sidebar-right/           ← Information feature
  ├── calendar/
  ├── schedules/
  └── sidebar-right.tsx
```

### Benefits of This Pattern

✅ **Shared Core**
- Single source of truth for base components
- Consistent behavior across features
- Update once, benefits everywhere

✅ **Independent Features**
- Each can be modified without affecting the other
- Clear boundaries and ownership
- Easier to understand and maintain

✅ **Scalability**
- Easy to add new features (sidebar-top, sidebar-bottom)
- Can extract more shared utilities to core as needed
- Clean import paths make relationships explicit

### Anti-Pattern: Duplication

❌ **Don't Do This:**
```
sidebar-left/
  └── primitives.tsx     ← Duplicate code

sidebar-right/
  └── primitives.tsx     ← Duplicate code
```

✅ **Do This Instead:**
```
sidebar-core/
  └── primitives.tsx     ← Single source

sidebar-left/ (imports from core)
sidebar-right/ (imports from core)
```

## Additional Resources

- [React Component Patterns](https://reactpatterns.com/)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

---

**Last Updated**: 2025-10-24
**Maintained By**: Development Team
**Questions?** Refer to `/components/resa/sidebar-left/` and `/components/resa/sidebar-right/` for reference implementations

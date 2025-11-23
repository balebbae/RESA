# Schedule System Documentation

This document explains the scheduling system in RESA, including the database tables, their relationships, and the complete user flow for creating and publishing employee schedules.

---

## Overview

The RESA scheduling system uses three main database tables that work together to manage employee shifts:

1. **`shift_templates`** - Reusable shift patterns for recurring schedules
2. **`schedules`** - Weekly/periodic schedule containers
3. **`scheduled_shifts`** - Individual shift instances assigned to employees

---

## Database Schema

### 1. shift_templates

**Purpose:** Define reusable shift patterns that repeat weekly (e.g., "Morning Shift every Monday 9am-5pm for Servers and Cooks").

**Schema:**
```sql
CREATE TABLE shift_templates (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NULL,                    -- Optional name like "Morning Shift"
    day_of_week SMALLINT NOT NULL,             -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,                  -- e.g., '09:00'
    end_time TIME NOT NULL,                    -- e.g., '17:00'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table for many-to-many relationship with roles
CREATE TABLE shift_template_roles (
    shift_template_id INT NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (shift_template_id, role_id)
);
```

**Key Features:**
- **Multi-Role Support:** One template can have multiple roles (e.g., Server + Cook)
- **Optional Naming:** Templates can have descriptive names like "Morning Shift" or "Evening Shift"
- **Day-Based:** Templates define which day of the week the shift occurs
- **Reusable:** Templates can be used to quickly generate `scheduled_shifts` for multiple weeks

**Example Use Case:**
```
Template: "Morning Shift"
- Day: Monday (1)
- Time: 09:00 - 17:00
- Roles: [Server, Cook, Dishwasher]
```

---

### 2. schedules

**Purpose:** Container for a specific time period's schedule (typically one week). Acts as the parent for all shifts within that period.

**Schema:**
```sql
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,       -- e.g., '2025-01-20' (Monday)
    end_date DATE NOT NULL,         -- e.g., '2025-01-26' (Sunday)
    published_at TIMESTAMPTZ,       -- NULL if draft, timestamp if published
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Key Features:**
- **Date Range:** Defines the period the schedule covers (flexible, not restricted to weeks)
- **Publication Status:** `published_at` field tracks whether schedule is draft or published
- **Cascading Deletes:** Deleting a schedule deletes all its `scheduled_shifts`

**Lifecycle States:**
1. **Draft:** `published_at` is `NULL` - schedule is being built
2. **Published:** `published_at` has timestamp - schedule is finalized and employees are notified

**Example:**
```
Schedule for week of Jan 20-26, 2025
- Start: 2025-01-20
- End: 2025-01-26
- Published: null (still in draft)
- Contains: 45 scheduled_shifts
```

---

### 3. scheduled_shifts

**Purpose:** Individual shift instances - the actual shifts that employees work on specific dates.

**Schema:**
```sql
CREATE TABLE scheduled_shifts (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    shift_template_id INT REFERENCES shift_templates(id) ON DELETE SET NULL,  -- Optional
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,                      -- Required
    employee_id INT REFERENCES employees(id) ON DELETE SET NULL,              -- Nullable
    shift_date DATE NOT NULL,           -- Specific calendar date (e.g., '2025-01-20')
    start_time TIME NOT NULL,           -- e.g., '09:00'
    end_time TIME NOT NULL,             -- e.g., '17:00'
    notes TEXT,                         -- Optional notes (e.g., "Training at 2pm")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT scheduled_shifts_times_check CHECK (end_time > start_time)
);

-- Indexes for performance
CREATE INDEX idx_scheduled_shifts_shift_date ON scheduled_shifts(shift_date);
CREATE INDEX idx_scheduled_shifts_schedule_id ON scheduled_shifts(schedule_id);
CREATE INDEX idx_scheduled_shifts_employee_id ON scheduled_shifts(employee_id);
```

**Key Features:**
- **Template Link (Optional):** `shift_template_id` references the template used to create the shift (can be NULL for manual shifts)
- **Role Required:** Every shift must have a role (e.g., "Server", "Cook")
- **Employee Optional:** Shifts can be unassigned (`employee_id = NULL`) or assigned to a specific employee
- **Specific Date:** Unlike templates, shifts have a concrete `shift_date` (e.g., "January 20, 2025")
- **Notes Field:** Flexible text field for shift-specific information
- **Validation:** `end_time` must be after `start_time`

**Foreign Key Behaviors:**
- `schedule_id`: `ON DELETE CASCADE` - deleting schedule deletes all its shifts
- `shift_template_id`: `ON DELETE SET NULL` - deleting template doesn't delete shifts
- `role_id`: `ON DELETE RESTRICT` - can't delete role if used in shifts
- `employee_id`: `ON DELETE SET NULL` - deleting employee unassigns their shifts

**Example:**
```
Scheduled Shift #1234
- Schedule: Week of Jan 20-26
- Template: "Morning Shift" (optional reference)
- Role: Server
- Employee: John Doe (ID 7)
- Date: Monday, January 20, 2025
- Time: 09:00 - 17:00
- Notes: "Training session at 2pm"
```

---

## Table Relationships

```
restaurants (1) ──┬─── (many) shift_templates (many) ───┐
                  │                                      │
                  │                                      ├─── (many) shift_template_roles (many) ─── (1) roles
                  │                                      │
                  ├─── (many) schedules (1) ─── (many) scheduled_shifts (many) ───┤
                  │                                                                 │
                  ├─── (many) roles (1) ────────────────────────────────────────────┤
                  │                                                                 │
                  └─── (many) employees (1) ────────────────────────────────────────┘
```

**Key Relationships:**

1. **shift_templates ↔ roles** (Many-to-Many)
   - Junction table: `shift_template_roles`
   - One template can have multiple roles (e.g., Server + Cook)
   - One role can be in multiple templates

2. **schedules → scheduled_shifts** (One-to-Many)
   - One schedule contains many shifts
   - Each shift belongs to exactly one schedule

3. **scheduled_shifts → shift_templates** (Many-to-One, Optional)
   - Shifts created from templates reference the template
   - Manually created shifts have `shift_template_id = NULL`
   - If template is deleted, shift retains its data but loses template reference

4. **scheduled_shifts → roles** (Many-to-One, Required)
   - Every shift must have a role
   - Can't delete a role if it's used in any shifts (`ON DELETE RESTRICT`)

5. **scheduled_shifts → employees** (Many-to-One, Optional)
   - Shifts can be assigned to employees or left unassigned
   - If employee is deleted, their shifts become unassigned

---

## User Flow

### Phase 1: Setup (One-Time Configuration)

**Prerequisites before creating schedules:**

1. **Create Roles**
   ```
   POST /restaurants/{restaurantID}/roles

   Examples:
   - Server
   - Cook
   - Dishwasher
   - Manager
   - Bartender
   ```

2. **Create Employees**
   ```
   POST /restaurants/{restaurantID}/employees

   For each employee:
   - Full name
   - Email
   ```

3. **Assign Roles to Employees**
   ```
   POST /restaurants/{restaurantID}/employees/{employeeID}/roles

   Example: Assign "Server" and "Bartender" roles to Alice
   ```

4. **Create Shift Templates (Optional but Recommended)**
   ```
   POST /restaurants/{restaurantID}/shift-templates

   Example Templates:
   - "Morning Shift": Mon-Fri, 9am-5pm, Roles: [Server, Cook]
   - "Evening Shift": Mon-Fri, 5pm-11pm, Roles: [Server, Cook, Bartender]
   - "Weekend Brunch": Sat-Sun, 10am-3pm, Roles: [Server, Cook]
   ```

---

### Phase 2: Creating a Schedule (Weekly Workflow)

#### Step 1: Create Schedule Container

**Action:** Owner creates a new schedule for a specific time period (typically one week).

```http
POST /restaurants/{restaurantID}/schedules

{
  "start_date": "2025-01-20",  // Monday
  "end_date": "2025-01-26"     // Sunday
}
```

**Result:**
```json
{
  "id": 42,
  "restaurant_id": 5,
  "start_date": "2025-01-20",
  "end_date": "2025-01-26",
  "published_at": null,  // Draft mode
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T10:00:00Z"
}
```

**Status:** Schedule is now in **draft mode** (`published_at = null`)

---

#### Step 2: Populate with Scheduled Shifts

**Option A: Use Shift Templates (Recommended for recurring patterns)**

For each template, create scheduled shifts for the relevant dates:

```http
POST /restaurants/{restaurantID}/schedules/{scheduleID}/shifts

{
  "shift_template_id": 1,           // Reference to "Morning Shift" template
  "role_id": 2,                     // Server
  "employee_id": null,              // Unassigned initially
  "shift_date": "2025-01-20T00:00:00Z",  // Monday
  "start_time": "09:00",
  "end_time": "17:00",
  "notes": null
}
```

**Benefits:**
- Templates provide defaults (day, time, roles)
- Maintains link to template via `shift_template_id`
- Can still customize per-shift (different times, notes, etc.)

**Option B: Create Shifts Manually**

Create shifts from scratch without templates:

```http
POST /restaurants/{restaurantID}/schedules/{scheduleID}/shifts

{
  "shift_template_id": null,        // No template used
  "role_id": 3,                     // Cook
  "employee_id": null,              // Unassigned
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "08:00",
  "end_time": "16:00",
  "notes": "Special catering event"
}
```

**Typical Result:** Schedule now contains 30-50 shifts covering the week across all roles and time slots.

---

#### Step 3: Assign Employees to Shifts

**Action:** Owner assigns specific employees to shifts based on availability, skills, and roles.

**Method 1: During Shift Creation**
Include `employee_id` when creating the shift.

**Method 2: Assign After Creation**
```http
PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign

{
  "employee_id": 7  // Assign to John Doe
}
```

**Method 3: Update Shift**
```http
PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}

{
  "employee_id": 7
}
```

**Important Notes:**
- Employees can only be assigned to shifts with roles they have
- Shifts can remain unassigned (`employee_id = null`) if needed
- Can reassign or unassign at any time

**Unassign Employee:**
```http
DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign
```
Sets `employee_id = null`

---

#### Step 4: Review and Edit

**View All Shifts in Schedule:**
```http
GET /restaurants/{restaurantID}/schedules/{scheduleID}/shifts
```

Returns all shifts ordered by `shift_date` and `start_time`.

**Edit Individual Shifts:**
```http
PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}

{
  "start_time": "10:00",  // Changed from 09:00
  "end_time": "18:00",
  "notes": "Training session at 2pm"
}
```

**Delete Shifts:**
```http
DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}
```

---

#### Step 5: Publish Schedule

**Action:** When schedule is complete and ready to share with employees, owner publishes it.

```http
POST /restaurants/{restaurantID}/schedules/{scheduleID}/publish
```

**What Happens:**
1. `published_at` field is set to current timestamp
2. Schedule transitions from **draft** to **published** state
3. System sends notification emails to all employees with assigned shifts (mentioned in API docs)
4. Employees can now view their official schedule

**Result:**
```json
{
  "id": 42,
  "restaurant_id": 5,
  "start_date": "2025-01-20",
  "end_date": "2025-01-26",
  "published_at": "2025-01-17T14:30:00Z",  // Now published!
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T14:30:00Z"
}
```

**Important:**
- Can only publish once (cannot re-publish a schedule that's already published)
- Returns `400 Bad Request` if attempting to publish already-published schedule

---

#### Step 6: Post-Publication Updates (Optional)

**Schedules can still be modified after publishing:**

- Reassign employees
- Update shift times
- Add/remove shifts
- Add notes

However, the `published_at` timestamp remains unchanged to track original publication date.

---

## Complete User Flow Example

**Scenario:** Restaurant owner creating schedule for week of Jan 20-26, 2025

### Week Before (Setup Phase)

1. ✅ Created roles: Server, Cook, Dishwasher
2. ✅ Added 10 employees
3. ✅ Assigned roles to employees
4. ✅ Created 3 shift templates:
   - Morning: Mon-Fri, 9am-5pm, [Server, Cook]
   - Evening: Mon-Fri, 5pm-11pm, [Server, Cook]
   - Weekend: Sat-Sun, 11am-8pm, [Server, Cook, Dishwasher]

### Monday (Schedule Creation)

**10:00 AM - Create Schedule**
```http
POST /restaurants/5/schedules
{
  "start_date": "2025-01-20",
  "end_date": "2025-01-26"
}
→ Schedule #42 created (draft mode)
```

**10:15 AM - Generate Shifts from Templates**

Owner creates shifts for each day using templates:
- Monday-Friday: Use "Morning" and "Evening" templates
- Saturday-Sunday: Use "Weekend" template

For each template × each applicable day → create 2-3 shifts (one per role)

Result: ~40 unassigned shifts created

**11:00 AM - Manually Add Special Shifts**
```http
POST /restaurants/5/schedules/42/shifts
{
  "shift_template_id": null,
  "role_id": 4,  // Manager
  "shift_date": "2025-01-20T00:00:00Z",
  "start_time": "08:00",
  "end_time": "16:00",
  "notes": "Inventory day"
}
```

Result: 43 shifts total

### Tuesday (Assignment Phase)

**Owner assigns employees based on:**
- Employee availability
- Role qualifications
- Fair distribution of hours
- Experience (e.g., put experienced servers on busy nights)

```http
PATCH /restaurants/5/schedules/42/shifts/101/assign
{ "employee_id": 7 }  // Assign Alice to Monday morning server shift

PATCH /restaurants/5/schedules/42/shifts/102/assign
{ "employee_id": 8 }  // Assign Bob to Monday morning cook shift

... (repeat for all 43 shifts)
```

Result: 41 shifts assigned, 2 left open for flexibility

### Wednesday (Review Phase)

**Owner reviews schedule:**
```http
GET /restaurants/5/schedules/42/shifts
```

**Makes adjustments:**
- Swaps Alice from evening to morning shift (she requested morning)
- Adds note about training for new dishwasher
- Extends cook shift by 1 hour for weekend prep

### Thursday (Publication)

**9:00 AM - Final Review**
Owner does final check of all shifts.

**9:30 AM - Publish**
```http
POST /restaurants/5/schedules/42/publish
```

**What happens:**
1. `published_at` set to `2025-01-16T09:30:00Z`
2. System sends emails to all 9 assigned employees
3. Email contains:
   - Their shifts for the week
   - Date, time, role for each shift
   - Any notes

### Friday (Post-Publication Updates)

**Employee Alice calls in sick for Monday**
Owner reassigns her shift:
```http
PATCH /restaurants/5/schedules/42/shifts/101/assign
{ "employee_id": 9 }  // Reassign to Carol
```

Carol receives update notification.

---

## Key Concepts Explained

### Why Three Tables?

**1. shift_templates** - Efficiency and Consistency
- Avoids recreating same shift pattern every week
- Ensures consistency (all "Morning Shifts" have same times)
- Can update template and apply to future schedules
- Optional - can create schedules without templates

**2. schedules** - Organization and Publication Control
- Groups shifts into logical time periods
- Provides publication workflow (draft → published)
- Allows bulk operations (delete entire schedule)
- Tracks when schedule was finalized (`published_at`)

**3. scheduled_shifts** - Flexibility and Specificity
- Actual concrete shifts employees work
- Can deviate from templates (different time, special notes)
- Can be created without templates (one-off shifts)
- Supports unassigned shifts (coverage gaps)

### Template vs. Scheduled Shift

**Template:**
- Abstract, repeating pattern
- "Every Monday at 9am"
- No specific employee
- No specific date (just day of week)
- No notes

**Scheduled Shift:**
- Concrete instance
- "Monday, January 20, 2025 at 9am"
- Can be assigned to specific employee
- Can have specific notes
- May or may not reference a template

### Draft vs. Published Schedules

**Draft Mode** (`published_at = null`):
- Work in progress
- Not visible to employees
- Can freely add/remove/modify shifts
- No notifications sent

**Published Mode** (`published_at = timestamp`):
- Finalized and official
- Employees notified via email
- Visible to employees
- Can still be updated (but employees already notified)
- Cannot be "un-published"

### Assigned vs. Unassigned Shifts

**Unassigned** (`employee_id = null`):
- Shift exists but no employee scheduled
- Useful for:
  - Creating schedule structure before assignments
  - Showing coverage gaps
  - Allowing employees to pick up shifts
  - On-call or flex positions

**Assigned** (`employee_id = 7`):
- Specific employee scheduled for shift
- Employee receives notifications
- Shows up on employee's personal schedule

---

## Common Patterns and Workflows

### Pattern 1: Template-Driven Scheduling (Most Common)

1. Create templates once (e.g., Morning, Evening, Weekend)
2. Each week: Create new schedule
3. Generate shifts from templates
4. Assign employees
5. Publish

**Pros:** Fast, consistent, repeatable
**Cons:** Less flexibility for irregular schedules

### Pattern 2: Manual Scheduling

1. Create schedule
2. Manually create each shift
3. Assign employees
4. Publish

**Pros:** Maximum flexibility
**Cons:** More time-consuming

### Pattern 3: Hybrid (Recommended)

1. Create templates for regular shifts
2. Create schedule
3. Generate shifts from templates
4. Add manual shifts for special events/needs
5. Customize as needed
6. Assign employees
7. Publish

**Pros:** Balance of efficiency and flexibility

### Pattern 4: Progressive Assignment

1. Create schedule with unassigned shifts
2. Publish to make shifts visible
3. Employees request preferred shifts
4. Owner assigns based on requests
5. Send update notifications

**Pros:** Employee participation
**Cons:** More back-and-forth

---

## API Endpoints Summary

### Shift Templates
- `GET /restaurants/{restaurantID}/shift-templates` - List all templates
- `POST /restaurants/{restaurantID}/shift-templates` - Create template
- `GET /restaurants/{restaurantID}/shift-templates/{templateID}` - Get template
- `PATCH /restaurants/{restaurantID}/shift-templates/{templateID}` - Update template
- `DELETE /restaurants/{restaurantID}/shift-templates/{templateID}` - Delete template

### Schedules
- `GET /restaurants/{restaurantID}/schedules` - List all schedules
- `POST /restaurants/{restaurantID}/schedules` - Create schedule
- `GET /restaurants/{restaurantID}/schedules/{scheduleID}` - Get schedule
- `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}` - Update schedule
- `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}` - Delete schedule
- `POST /restaurants/{restaurantID}/schedules/{scheduleID}/publish` - **Publish schedule**

### Scheduled Shifts
- `GET /restaurants/{restaurantID}/schedules/{scheduleID}/shifts` - List all shifts in schedule
- `POST /restaurants/{restaurantID}/schedules/{scheduleID}/shifts` - Create shift
- `GET /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}` - Get shift
- `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}` - Update shift
- `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}` - Delete shift
- `PATCH /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign` - Assign employee
- `DELETE /restaurants/{restaurantID}/schedules/{scheduleID}/shifts/{shiftID}/assign` - Unassign employee

---

## Data Flow Diagram

```
┌─────────────────────┐
│  shift_templates    │  (Optional, reusable patterns)
│  - Morning Shift    │
│  - Evening Shift    │
│  - Weekend Shift    │
└──────────┬──────────┘
           │
           │ (can reference)
           ▼
┌─────────────────────┐
│     schedules       │  (Weekly containers)
│  Jan 20-26, 2025    │
│  Status: Draft      │──────┐
└─────────────────────┘      │
                             │ (contains)
                             ▼
                   ┌─────────────────────┐
                   │  scheduled_shifts   │  (Individual shifts)
                   │  - Mon 9am-5pm      │
                   │  - Tue 9am-5pm      │
                   │  - Wed 5pm-11pm     │
                   │  ... (40 shifts)    │
                   └──────────┬──────────┘
                              │
                              │ (assigned to)
                              ▼
                        ┌──────────┐
                        │employees │
                        │  Alice   │
                        │  Bob     │
                        │  Carol   │
                        └──────────┘
```

---

## Best Practices

### For Restaurant Owners

1. **Create Templates First** - Saves time for recurring shifts
2. **Build Schedule Early** - Create draft at least 1 week in advance
3. **Assign Fairly** - Track hours to ensure equitable distribution
4. **Communicate Changes** - If updating after publication, inform employees
5. **Use Notes Field** - Add important shift-specific information
6. **Review Before Publishing** - Publication triggers notifications
7. **Keep Unassigned Shifts** - Useful for showing coverage gaps

### For Developers

1. **Show Publication Status** - Clearly indicate draft vs. published
2. **Prevent Accidental Publishing** - Confirm before publishing
3. **Highlight Unassigned Shifts** - Make coverage gaps obvious
4. **Validate Employee Roles** - Only show eligible employees for each shift
5. **Cache Templates** - They're reused frequently
6. **Use Optimistic Updates** - Show changes immediately, sync in background
7. **Handle Template Deletions** - Shifts retain data if template deleted

---

## Troubleshooting

**Q: Can I un-publish a schedule?**
A: No. Once `published_at` is set, it cannot be reversed. You can delete and recreate the schedule if needed.

**Q: What happens if I delete a template?**
A: Shifts created from that template remain unchanged. They lose the template reference (`shift_template_id` becomes null) but retain all shift data (time, role, employee, etc.).

**Q: Can I assign an employee to a shift if they don't have that role?**
A: The API doesn't enforce this at the database level (role is on the shift, not employee-role join), but frontend should validate employee has compatible role before assignment.

**Q: Can shifts span multiple days?**
A: No. Each shift is a single day (`shift_date`). For overnight shifts, create two shifts or use the day the shift starts.

**Q: What happens if I delete a schedule?**
A: All `scheduled_shifts` within that schedule are deleted (`ON DELETE CASCADE`).

**Q: Can I have multiple schedules for the same date range?**
A: Yes, there's no database constraint preventing overlapping schedules. This is by design for flexibility (e.g., special event schedule alongside regular schedule).

---

## Future Enhancements (Not Currently Implemented)

Potential features for consideration:

- **Shift Swapping** - Allow employees to request shift swaps
- **Availability Management** - Employees indicate available times
- **Auto-Assignment** - Algorithm to assign employees based on availability and hours
- **Recurring Schedules** - Copy entire schedule to next week
- **Shift Conflicts** - Detect when employee assigned to overlapping shifts
- **Hour Tracking** - Calculate total hours per employee
- **Schedule Templates** - Template entire week, not just individual shifts
- **Notifications** - Real-time updates when assigned/unassigned
- **Mobile App Integration** - Employee view/manage schedules on mobile

---

**Last Updated:** November 2025
**Schema Version:** Migration 000019 (Multi-role shift templates)

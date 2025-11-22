/**
 * Empty state shown when restaurant has no employees
 */

export function EmployeeEmptyState() {
  return (
    <div className="px-2 py-4 text-center">
      <p className="text-sm text-muted-foreground">
        No employees yet. Click the + button to add one.
      </p>
    </div>
  )
}

/**
 * Empty state shown when user has no workplaces
 */

export function WorkspaceEmptyState() {
  return (
    <div className="px-2 py-4 text-center">
      <p className="text-sm text-muted-foreground">
        No workplaces yet. Click the + button to create one.
      </p>
    </div>
  )
}

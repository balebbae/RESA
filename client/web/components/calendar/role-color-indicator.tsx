import type { Role } from "@/types/role";

interface RoleColorIndicatorProps {
  roles: Role[];
  size?: "xs" | "sm" | "md";
}

const sizeClasses = {
  xs: "w-1.5 h-1.5",  // 6px
  sm: "w-3 h-3",       // 12px
  md: "w-4 h-4",       // 16px
};

/**
 * Displays a colored circle indicator for employee roles
 * - Single role: solid colored circle
 * - Multiple roles: pie-chart style with colored segments using conic-gradient
 */
export function RoleColorIndicator({ roles, size = "sm" }: RoleColorIndicatorProps) {
  // No roles: show gray circle
  if (roles.length === 0) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-400 flex-shrink-0`}
      />
    );
  }

  // Single role: solid colored circle
  if (roles.length === 1) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex-shrink-0`}
        style={{ backgroundColor: roles[0].color }}
      />
    );
  }

  // Multiple roles: create segmented circle using conic-gradient
  const gradient = createConicGradient(roles.map((r) => r.color));

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex-shrink-0`}
      style={{ background: gradient }}
    />
  );
}

/**
 * Creates a conic-gradient string for pie-chart style segments
 * @param colors Array of color strings (e.g., ["#ff0000", "#00ff00", "#0000ff"])
 * @returns CSS conic-gradient string
 */
function createConicGradient(colors: string[]): string {
  if (colors.length === 0) return "#gray";
  if (colors.length === 1) return colors[0];

  const segmentSize = 360 / colors.length;
  const stops = colors.map((color, i) => {
    const start = i * segmentSize;
    const end = (i + 1) * segmentSize;
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

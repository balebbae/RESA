/**
 * Utility for generating and managing unique pastel colors for roles
 * Similar to employee-colors.ts but for role-based visualization
 */

/**
 * Generate a pastel color using HSL color space (same as employee colors)
 * Pastel colors have:
 * - Random hue (0-360)
 * - Medium-high saturation (65-80%)
 * - High lightness (75-85%)
 *
 * @param seed - Seed for consistent color generation
 * @returns HSL color string
 */
export function generatePastelColor(seed: number): string {
  // Use golden angle for better distribution
  const hue = (seed * 137.508) % 360;

  // Pastel colors have moderate saturation and high lightness
  const saturation = 65 + ((seed * 17) % 15); // 65-80%
  const lightness = 75 + ((seed * 13) % 10);  // 75-85%

  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Generate role colors map from role IDs
 * Each role gets a consistent, unique pastel color
 *
 * @param roleIds - Array of role IDs
 * @returns Map of role ID to color string
 */
export function generateRoleColors(roleIds: number[]): Map<number, string> {
  const colorMap = new Map<number, string>();

  roleIds.forEach((id) => {
    // Use role ID as seed for consistent colors
    colorMap.set(id, generatePastelColor(id));
  });

  return colorMap;
}

/**
 * Get a color for a role, or generate a default if not found
 *
 * @param roleId - Role ID
 * @param colorMap - Map of role colors
 * @returns HSL color string
 */
export function getRoleColor(
  roleId: number | null | undefined,
  colorMap: Map<number, string>
): string {
  if (roleId === null || roleId === undefined) {
    // Default gray for unassigned
    return 'hsl(0, 0%, 70%)';
  }

  return colorMap.get(roleId) || generatePastelColor(roleId);
}

/**
 * Convert HSL color to HSLA with opacity (for template backgrounds)
 *
 * @param hslColor - HSL color string (e.g., "hsl(180, 70%, 80%)")
 * @param opacity - Opacity value (0-1)
 * @returns HSLA color string
 */
export function addOpacityToHsl(hslColor: string, opacity: number): string {
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
}

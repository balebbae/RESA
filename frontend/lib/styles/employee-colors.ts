/**
 * Utility for generating and managing unique pastel colors for employees
 */

/**
 * Generate a random pastel color using HSL color space
 * Pastel colors have:
 * - Random hue (0-360)
 * - Medium-high saturation (65-80%)
 * - High lightness (75-85%)
 *
 * @param seed - Optional seed for consistent color generation
 * @returns HSL color string
 */
export function generatePastelColor(seed?: number): string {
  // Use seed or random for hue generation
  const hue = seed !== undefined
    ? (seed * 137.508) % 360  // Golden angle for better distribution
    : Math.random() * 360;

  // Pastel colors have moderate saturation and high lightness
  const saturation = 65 + Math.random() * 15; // 65-80%
  const lightness = 75 + Math.random() * 10;  // 75-85%

  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

/**
 * Generate employee colors map from employee IDs
 * Each employee gets a consistent, unique pastel color
 *
 * @param employeeIds - Array of employee IDs
 * @returns Map of employee ID to color string
 */
export function generateEmployeeColors(employeeIds: number[]): Map<number, string> {
  const colorMap = new Map<number, string>();

  employeeIds.forEach((id) => {
    // Use employee ID as seed for consistent colors
    colorMap.set(id, generatePastelColor(id));
  });

  return colorMap;
}

/**
 * Get a color for an employee, or generate a default if not found
 *
 * @param employeeId - Employee ID
 * @param colorMap - Map of employee colors
 * @returns HSL color string
 */
export function getEmployeeColor(
  employeeId: number | null | undefined,
  colorMap: Map<number, string>
): string {
  if (employeeId === null || employeeId === undefined) {
    // Default gray for unassigned shifts
    return 'hsl(0, 0%, 70%)';
  }

  return colorMap.get(employeeId) || generatePastelColor(employeeId);
}

/**
 * Convert HSL color to HSLA with opacity
 *
 * @param hslColor - HSL color string (e.g., "hsl(180, 70%, 80%)")
 * @param opacity - Opacity value (0-1)
 * @returns HSLA color string
 */
export function addOpacityToHsl(hslColor: string, opacity: number): string {
  return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
}

/**
 * Get a darker version of an HSL color for borders/text
 *
 * @param hslColor - HSL color string
 * @param amount - Amount to darken (percentage points)
 * @returns Darkened HSL color string
 */
export function darkenHslColor(hslColor: string, amount: number = 20): string {
  // Parse HSL values
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return hslColor;

  const [, h, s, l] = match;
  const newLightness = Math.max(0, parseInt(l) - amount);

  return `hsl(${h}, ${s}%, ${newLightness}%)`;
}

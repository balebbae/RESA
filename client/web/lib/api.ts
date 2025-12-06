export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) throw new Error("Missing NEXT_PUBLIC_API_URL")
  return base.replace(/\/$/, "")
}



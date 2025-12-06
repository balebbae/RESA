"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { getApiBase } from "@/lib/api"
import { validateOAuthState, clearOAuthState } from "@/lib/oauth"

export default function GoogleCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const hasProcessedRef = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    // Prevent duplicate processing in React Strict Mode using ref (synchronous check)
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    async function handleCallback() {
      try {
        // Extract parameters from URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        // Check for OAuth errors from Google
        if (error) {
          throw new Error(`Google OAuth error: ${error}`)
        }

        if (!code || !state) {
          throw new Error("Missing authorization code or state parameter")
        }

        // Validate state (CSRF protection)
        const storedState = validateOAuthState(state)
        if (!storedState) {
          throw new Error("Invalid or expired OAuth state")
        }

        // Exchange code for JWT token via backend
        const response = await fetch(`${getApiBase()}/authentication/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OAuth callback failed: ${errorText.slice(0, 200)}`)
        }

        // Backend returns {"data": "JWT_TOKEN"}
        const result = await response.json()
        const token = result.data

        if (!token || typeof token !== "string") {
          throw new Error("Invalid token received from server")
        }

        // Store token and update auth context
        login(token)

        // Clean up OAuth state
        clearOAuthState()

        // Redirect to intended destination or default to /home
        const redirectTo = storedState.redirectTo || "/home"
        router.push(redirectTo)
      } catch (err: any) {
        console.error("OAuth callback error:", err)
        setError(err?.message || "Authentication failed. Please try again.")
        setIsProcessing(false)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?error=oauth_failed")
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, login, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border p-6">
          <h1 className="mb-2 text-xl font-bold text-red-600">
            Authentication Failed
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground">
          {isProcessing ? "Completing authentication..." : "Redirecting..."}
        </p>
      </div>
    </div>
  )
}

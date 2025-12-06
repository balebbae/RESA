"use client"

import Link from "next/link"
import { Livvic } from "next/font/google";
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginForm } from "@/components/marketing/LoginForm"
import { useAuth } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { getApiBase } from "@/lib/api"

const livvic = Livvic({ subsets: ["latin"], weight: ["600"] });

function LoginContent() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const notice = searchParams.get("notice")
  const email = searchParams.get("email")
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resendMessage, setResendMessage] = useState("")

  const handleResendConfirmation = async () => {
    if (!email) return

    setResendStatus("loading")
    setResendMessage("")

    try {
      const res = await fetch(`${getApiBase()}/authentication/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        let message = "Failed to resend email"
        try {
          const errorData = await res.json()
          message = errorData.error || errorData.message || "Failed to resend email"
        } catch {
          try {
            const text = await res.text()
            message = text.slice(0, 300)
          } catch {}
        }
        throw new Error(message)
      }

      const data = await res.json()
      setResendMessage(data.message || "Confirmation email has been sent!")
      setResendStatus("success")
    } catch (err) {
      const error = err as Error
      setResendMessage(error?.message || "Something went wrong. Please try again.")
      setResendStatus("error")
    }
  }

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/home")
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <span className={`${livvic.className} text-3xl font-bold`}>
              RESA
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            {notice === "check-email" && email ? (
              <div className="mb-4 space-y-2">
                <Alert>
                  <AlertDescription className="text-green-600">
                    Account created. Please check your email to confirm your account.{" "}
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resendStatus === "loading"}
                      className="underline hover:no-underline hover:cursor-pointer disabled:opacity-50"
                    >
                      {resendStatus === "loading" ? "Sending..." : "Click here to send again"}
                    </button>
                  </AlertDescription>
                </Alert>
                {resendStatus === "success" && resendMessage && (
                  <Alert>
                    <AlertDescription className="text-green-600">
                      {resendMessage}
                    </AlertDescription>
                  </Alert>
                )}
                {resendStatus === "error" && resendMessage && (
                  <Alert>
                    <AlertDescription className="text-red-600">
                      {resendMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : notice === "check-email" ? (
              <div className="mb-4">
                <Alert>
                  <AlertDescription className="text-green-600">
                    Account created. Please check your email to confirm your account.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/login.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover opacity-70 "
        />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  )
}

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getApiBase } from "@/lib/api"

export default function ConfirmEmailPage() {
  const router = useRouter()
  const params = useParams() as { token?: string | string[] }

  // Support both /confirm/[token] (string) and /confirm/[...token] (string[])
  const rawToken = (params?.token ?? "") as string | string[]
  const parts = Array.isArray(rawToken) ? rawToken : rawToken ? [String(rawToken)] : []
  // Normalize possible weird links like /confirm/undefined/users/activate/<uuid>
  const withoutUndefined = parts[0] === "undefined" ? parts.slice(1) : parts
  const tokenFromPath = withoutUndefined.length
    ? withoutUndefined[withoutUndefined.length - 1]
    : ""

  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [success, setSuccess] = React.useState<boolean | null>(null)
  const [message, setMessage] = React.useState<string>("")

  const confirmEmail = React.useCallback(async () => {
    if (!tokenFromPath) {
      setSuccess(false)
      setMessage("Missing or invalid confirmation token.")
      return
    }

    try {
      setIsLoading(true)
      setSuccess(null)
      setMessage("")
      
      const res = await fetch(`${getApiBase()}/users/activate/${encodeURIComponent(tokenFromPath)}`, {
        method: "PUT",
      })

      if (!res.ok) {
        let text = "Confirmation failed"
        try {
          text = (await res.text()).slice(0, 300)
        } catch {}
        throw new Error(`${text} (${res.status})`)
      }

      setSuccess(true)
      setMessage("Your email has been successfully verified.")
    } catch (err: any) {
      setSuccess(false)
      setMessage(err?.message || "Failed to verify your email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [tokenFromPath])

  React.useEffect(() => {
    void confirmEmail()
  }, [confirmEmail])

  return (
    <div className="min-h-[100dvh] grid place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirming your email</CardTitle>
          <CardDescription>
            {success === true && "You're all set!"}
            {success === false && "We couldn't verify your email."}
            {success === null && "Please wait while we verify your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-5" />
              <span>Verifying...</span>
            </div>
          ) : (
            <Alert variant={success ? "default" : "destructive"}>
              <AlertTitle>{success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {success ? (
            <Button onClick={() => router.push("/login")}>Go to login</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push("/")}>Back to home</Button>
              <Button onClick={confirmEmail} disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Retrying
                  </span>
                ) : (
                  "Retry"
                )}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}



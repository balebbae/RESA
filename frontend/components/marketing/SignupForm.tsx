'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getApiBase } from "@/lib/api"
import { useRouter } from "next/navigation"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const fullName = String(formData.get("fullName") || "").trim()
    const email = String(formData.get("email") || "").trim()
    const password = String(formData.get("password") || "")
    const confirmPassword = String(formData.get("confirmPassword") || "")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    // Split "Full Name" into first/last (best-effort)
    const nameParts = fullName.split(/\s+/)
    const firstName = nameParts.shift() || ""
    const lastName = nameParts.join(" ")

    if (!firstName || !lastName) {
      setError("Please enter your full name (first and last).")
      return
    }

    const payload = {
      email,
      first_name: firstName,
      last_name: lastName,
      password,
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${getApiBase()}/authentication/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = "Request failed"
        try {
          const text = await res.text()
          message = text.slice(0, 300)
        } catch {}
        throw new Error(`${message} (${res.status})`)
      }

      // 201 Created. Redirect to login with a notice to check email
      form.reset()
      router.push("/login?notice=check-email")
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-green-600">{success}</p>
        ) : null}

        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input id="name" name="fullName" type="text" placeholder="Caleb Bae" required />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="caleb@example.com" required />
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email with anyone else.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" name="password" type="password" required />
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <Input id="confirm-password" name="confirmPassword" type="password" required />
          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>

        <Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Account"}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="prefix__b" cx="1.479" cy="12.788" fx="1.479" fy="12.788" r="9.655" gradientTransform="matrix(.8032 0 0 1.0842 2.459 -.293)" gradientUnits="userSpaceOnUse"><stop offset=".368" stopColor="#ffcf09"/><stop offset=".718" stopColor="#ffcf09" stopOpacity=".7"/><stop offset="1" stopColor="#ffcf09" stopOpacity="0"/></radialGradient><radialGradient id="prefix__c" cx="14.295" cy="23.291" fx="14.295" fy="23.291" r="11.878" gradientTransform="matrix(1.3272 0 0 1.0073 -3.434 -.672)" gradientUnits="userSpaceOnUse"><stop offset=".383" stopColor="#34a853"/><stop offset=".706" stopColor="#34a853" stopOpacity=".7"/><stop offset="1" stopColor="#34a853" stopOpacity="0"/></radialGradient><linearGradient id="prefix__d" x1="23.558" y1="6.286" x2="12.148" y2="20.299" gradientUnits="userSpaceOnUse"><stop offset=".671" stopColor="#4285f4"/><stop offset=".885" stopColor="#4285f4" stopOpacity="0"/></linearGradient><clipPath id="prefix__a"><path d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25z" fill="none"/></clipPath></defs><path d="M22.36 10H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53h-.013l.013-.01c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09c.87-2.6 3.3-4.53 6.16-4.53 1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07 1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93v.01C3.99 20.53 7.7 23 12 23c2.97 0 5.46-.98 7.28-2.66 2.08-1.92 3.28-4.74 3.28-8.09 0-.78-.07-1.53-.2-2.25z" fill="#fc4c53"/><g clipPath="url(#prefix__a)"><ellipse cx="3.646" cy="13.572" rx="7.755" ry="10.469" fill="url(#prefix__b)"/><ellipse cx="15.538" cy="22.789" rx="15.765" ry="11.965" transform="rotate(-7.12 15.539 22.789)" fill="url(#prefix__c)"/><path fill="url(#prefix__d)" d="M11.105 8.28l.491 5.596.623 3.747 7.362 6.848 8.607-15.897-17.083-.294z"/></g></svg>
            Sign up with Google
          </Button>
          <FieldDescription className="px-6 text-center">
            Already have an account? <a href="/login">Sign in</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
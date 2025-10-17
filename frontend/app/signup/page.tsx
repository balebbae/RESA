"use client"

import { GalleryVerticalEnd } from "lucide-react"
import { Livvic } from "next/font/google";
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { SignupForm } from "@/components/marketing/SignupForm"

const livvic = Livvic({ subsets: ["latin"], weight: ["600"] });

export default function SignupPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users away from signup page
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

  // Don't render signup form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <span className={`${livvic.className} text-3xl font-bold`}>
              RESA
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/signup.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover opacity-70 dark:brightness-[0.5] dark:grayscale "
        />
      </div>
    </div>
  )
}

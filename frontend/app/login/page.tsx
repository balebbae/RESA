import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import OAuthButton from "./OAuthButton";
import "@/app/styles/style.css";
import { emailLogin } from "./action";
import pb from "@/lib/pocketbase";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavbarNoLinks from "@/components/NavbarNoLinks";

export default async function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const valid = await pb.authStore.isValid;
  if (valid) {
    redirect("/resa");
  }

  return (
    <div className="gradient-bg-270">
      <NavbarNoLinks />
      <section className="flex h-screen w-screen items-center justify-center mt-[-85px]">
        <Card className="mx-auto max-w-sm mt-[-100px]">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form id="login-form" className="grid gap-4" method="POST">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="resa@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  minLength={6}
                  name="password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {searchParams.message && (
                <div className="text-sm font-medium text-destructive">
                  {searchParams.message}
                </div>
              )}

              <Button className="w-full" type="submit" formAction={emailLogin}>
                Login
              </Button>
            </form>
            <OAuthButton text="Login" />
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href={"/signup"}>
                <button className="underline">Sign up</button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

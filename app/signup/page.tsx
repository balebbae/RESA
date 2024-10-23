import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "@/app/styles/style.css";
import OAuthButton from "../login/OAuthButton";
import Link from "next/link";
import NavbarNoLinks from "@/components/NavbarNoLinks";
import ScheduleUndraw from "@/assets/Schedule.svg";
import Image from "next/image";
import signUp from "./action";

const Signup = () => {
  return (
    <div className="gradient-bg-270-reverse ">
      <NavbarNoLinks />
      <section className="flex items-center justify-center min-h-screen mt-[-85px]">
        <div className="">
          <div className="mx-auto flex max-w-screen-xl flex-col justify-between gap-10 lg:flex-row lg:gap-20">
            <div className="mx-auto flex max-w-sm flex-col justify-between mr-20">
              <Image src={ScheduleUndraw} alt="undraw" />
            </div>
            <form id="signup-form" method="POST">
              <div className="mx-auto flex max-w-screen-md flex-col gap-6 rounded-xl border p-10 bg-white">
                <div className="flex gap-4">
                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="firstname">First Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Resa"
                      required
                    />
                  </div>
                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="lastname">Last Name</Label>
                    <Input type="text" id="lastname" placeholder="Bae" />
                  </div>
                </div>
                <div className="grid w-full items-center gap-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="resa@example.com"
                    required
                  />
                </div>

                <div className="grid w-full gap-1">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    minLength={6}
                    name="password"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="grid w-full gap-1 mt-[-10px]">
                  <Label htmlFor="password">Confirm Password</Label>
                  <Input
                    minLength={6}
                    name="confirmPassword"
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <OAuthButton text="Sign up" />
                <Button className="w-full mt-[-10px]" formAction={signUp}>
                  Sign up
                </Button>

                <div className="text-center text-sm ">
                  Already have an account?{" "}
                  <Link href={"/login"}>
                    <button className="underline ">Login</button>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Signup;

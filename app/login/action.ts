"use server";

import pb from "@/lib/pocketbase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function emailLogin(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    const authData = await pb
      .collection("users")
      .authWithPassword(data.email, data.password);
    console.log(authData);
  } catch (e) {
    redirect("/login?message=Invalid email or password");
    console.log(e);
  }
  revalidatePath("/", "layout");
  redirect("/resa/calendar");
}

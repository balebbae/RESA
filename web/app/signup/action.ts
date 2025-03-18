"use server";

import pb from "@/lib/pocketbase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function signUp(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const name = formData.get("name") as string;

    if (password !== confirmPassword) {
      redirect("/signup?message=Passwords do not match");
    }

    const data = {
      username: name,
      email: email,
      password: password,
      passwordConfirm: confirmPassword,
      name: name,
    };

    const record = await pb.collection("users").create(data);
    if (record) {
      console.log(record);
    }
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error creating user:", error);
    throw error; // Optionally, re-throw the error to handle it upstream
  }
  revalidatePath("/", "layout");
  redirect("/resa");
}

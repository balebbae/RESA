"use server";

import pb from "@/lib/pocketbase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function signOut() {
  try {
    pb.authStore.clear();
    revalidatePath("/", "layout");
    redirect("/");
  } catch (e) {
    console.log(e);
  }
}

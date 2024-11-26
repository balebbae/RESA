"use server";

import pb from "@/lib/pocketbase";

export async function getProfile() {
  if (!pb.authStore.isValid) {
    return null;
  }
  const user = pb.authStore.model;
  return user;
}

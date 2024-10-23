"use server";

import pb from "@/lib/pocketbase";

export async function grabTest() {
  const data = await pb.collection("test_data").getOne("g4zzf538yadbu1z");
  if (!data) {
    console.log("Failed to grab data");
  }
  console.log(data.test);
}

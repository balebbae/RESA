"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfirmPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [status, setStatus] = useState("Confirming your account...");

  useEffect(() => {
    if (token) {
      const confirmUser = async () => {
        try {
          // Use NEXT_PUBLIC_API_URL for client-exposed environment variables.
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/activate/${token}`,
            { method: "PUT" }
          );

          if (response.ok) {
            setStatus("Your account has been confirmed!");
            setTimeout(() => {
              router.push("/");
            }, 2000);
          } else {
            setStatus(
              "Confirmation failed. Please try again or contact support."
            );
          }
        } catch (error) {
          console.error("Error confirming account:", error);
          setStatus("An error occurred. Please try again later.");
        }
      };
      confirmUser();
    }
  }, [token, router]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <h1>Account Confirmation</h1>
      <p>{status}</p>
    </div>
  );
}

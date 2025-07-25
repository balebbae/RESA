"use client";

import React from "react";
import FeaturesSection from "@/components/landing/features-section";
import IntegrationSection from "@/components/landing/integration-section";
import CreativitySection from "@/components/landing/creativity-section";
import TestimonialSection from "@/components/landing/testimonial-section";
import PricingSection from "@/components/landing/pricing-section";
import SiteFooter from "@/components/landing/site-footer";
import { Hero } from "@/components/landing/hero";

export default function Component() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f3f1ea] w-full overflow-x-hidden">
      <main className="flex-1 w-full">
        <Hero
          eyebrow="INTRODUCING RESA MANAGEMENT"
          title={
            <>
              <div className="whitespace-nowrap">
                <span className="font-serif font-normal">AI management, </span>
                <span className="font-serif font-normal italic">
                  seamlessly{" "}
                </span>
                <span className="font-serif font-normal">connected</span>
              </div>
              <div className="font-serif font-normal">to your restaurant</div>
            </>
          }
          subtitle={
            <>
              <span className="font-bold">R</span>estaurant{" "}
              <span className="font-bold">E</span>mployee{" "}
              <span className="font-bold">S</span>cheduling{" "}
              <span className="font-bold">A</span>pplication
            </>
          }
          ctaText="Join Waitlist"
          ctaLink="/hero-demo"
          mockupImage={{
            src: "/dashboard.png",
            alt: "RESA Dashboard Interface",
            width: 1274,
            height: 1043,
          }}
        />
        {/* <FeaturesSection />
        <IntegrationSection />
        <CreativitySection />
        <TestimonialSection />
        <PricingSection /> */}
      </main>

      <div className="bg-[#f3f1ea]">
        <SiteFooter />
      </div>
    </div>
  );
}

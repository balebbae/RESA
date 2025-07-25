"use client";

import React from "react";
// import FeaturesSection from "@/components/landing/features-section";
// import IntegrationSection from "@/components/landing/integration-section";
// import CreativitySection from "@/components/landing/creativity-section";
// import TestimonialSection from "@/components/landing/testimonial-section";
// import PricingSection from "@/components/landing/pricing-section";
import SiteFooter from "@/components/landing/site-footer";
import HeroSection from "@/components/landing/hero";

export default function Component() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f3f1ea] w-full overflow-x-hidden">
      <main className="flex-1 w-full">
        <HeroSection />
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

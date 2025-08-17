"use client";

import React from "react";
import PricingSection from "@/components/landing/pricing-section";
import TestimonialSection from "@/components/landing/testimonial-section";
import SiteFooter from "@/components/landing/site-footer";
import HeroSection from "@/components/landing/hero";
import AboutUsSection from "@/components/landing/about-us-section";
import { CustomersSectionDemo } from "@/components/customers-demo";
import { Gallery4Demo } from "@/components/gallery-demo";

export default function Component() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-background w-full overflow-x-hidden">
      <div className="absolute inset-0 z-0 bg-noise opacity-10"></div>
      <main className="flex-1 w-full">
        <HeroSection />
        {/* <CustomersSectionDemo /> */}
        {/* <AboutUsSection /> */}
        {/* <TestimonialSection /> */}
        {/* <Gallery4Demo /> */}
        <PricingSection />
      </main>
      <div className="bg-brand-background">
        <SiteFooter />
      </div>
    </div>
  );
}

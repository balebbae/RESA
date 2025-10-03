"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeroProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  ctaText?: string;
  ctaLink?: string;
  mockupImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

const Hero = React.forwardRef<HTMLDivElement, HeroProps>(
  (
    {
      className,
      title,
      subtitle,
      eyebrow,
      ctaText,
      ctaLink,
      mockupImage,
      ...props
    },
    ref
  ) => {
    return (
      <>
        <HeroHeader />
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center bg-brand-background relative",
            className
          )}
          {...props}
        >
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/heroBackground.png')",
              backgroundSize: "55%",
              backgroundPosition: "center 10%",
              backgroundRepeat: "no-repeat",
              filter: "brightness(0.8)",
            }}
          />
          {/* Gradient background effect */}
          <div className="flex flex-col items-end absolute right-60 top-10 blur-xl z-0">
            <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
            <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
            <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
          </div>
          {/* Background overlay for better text readability */}
          <div className="absolute inset-0 bg-brand-background/70 z-0"></div>
          <div className="relative z-10 w-full flex flex-col items-center">
            {eyebrow && (
              <p className="font-sans uppercase tracking-[0.3em] sm:tracking-[0.4em] md:tracking-[0.51em] leading-[133%] text-center text-[14px] sm:text-[16px] md:text-[19px] mt-[100px] sm:mt-[150px] md:mt-[200px] lg:mt-[249px] mb-4 sm:mb-6 md:mb-8 text-[#000000] animate-appear opacity-0">
                {eyebrow}
              </p>
            )}

            <h1 className="text-[32px] sm:text-[48px] md:text-[56px] lg:text-[64px] leading-tight sm:leading-[60px] md:leading-[70px] lg:leading-[83px] text-center px-4 sm:px-8 md:px-16 lg:px-[314px] text-[#000000] animate-appear opacity-0 delay-100">
              {title}
            </h1>

            {subtitle && (
              <p className="text-[18px] sm:text-[22px] md:text-[26px] lg:text-[28px] text-center font-sans font-light px-4 sm:px-8 md:px-16 lg:px-[314px] mt-[15px] sm:mt-[20px] md:mt-[25px] mb-[24px] sm:mb-[36px] md:mb-[48px] leading-[133%] text-[#000000] animate-appear opacity-0 delay-300">
                {subtitle}
              </p>
            )}

            {ctaText && ctaLink && (
              <Link href={ctaLink}>
                <div className="inline-flex items-center justify-center bg-[#000000] text-[#ffffff] rounded-xl hover:bg-[#000000]/90 transition-colors font-sans w-[160px] sm:w-[170px] md:w-[180px] h-[48px] sm:h-[50px] md:h-[52px] animate-appear opacity-0 delay-500 gap-[8px] sm:gap-[10px] md:gap-[12px] px-[16px] sm:px-[18px] md:px-[20px]">
                  <span className="text-[16px] sm:text-[17px] md:text-[19px] whitespace-nowrap flex items-center">
                    {ctaText}
                  </span>
                </div>
              </Link>
            )}

            {mockupImage && (
              <div className="mt-10 sm:mt-16 md:mt-20 w-full relative animate-appear opacity-0 delay-700 flex justify-center px-4 sm:px-6 md:px-8">
                <Image
                  src={mockupImage.src}
                  alt={mockupImage.alt}
                  width={mockupImage.width}
                  height={mockupImage.height}
                  className="w-full max-h-full max-w-sm sm:max-w-sm md:max-w-4xl lg:max-w-6xl rounded-lg border border-black"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
);
Hero.displayName = "Hero";

const menuItems = [
  { name: "Features", href: "#link" },
  { name: "Solution", href: "#link" },
  { name: "Pricing", href: "#link" },
  { name: "About", href: "#link" },
];

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2 group"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
                <span className="text-xl font-bold pl-2">RESA</span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-accent-foreground text-slate-600 block duration-150"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground text-slate-600 block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(isScrolled && "lg:hidden")}
                >
                  <Link href="#">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
                >
                  <Link href="/waitlist">
                    <span>Join Waitlist</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

const Logo = ({ className }: { className?: string }) => {
  const [shouldSpin, setShouldSpin] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldSpin(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Image
      src="/logo.svg"
      alt="RESA Logo"
      width={32}
      height={32}
      className={cn(
        "h-8 w-8 hover:rotate-[360deg] transition-transform duration-500",
        shouldSpin && "animate-spin",
        className
      )}
      style={
        shouldSpin
          ? { animationDuration: "1s", animationIterationCount: "1" }
          : undefined
      }
      onAnimationEnd={() => setShouldSpin(false)}
    />
  );
};

const HeroSection = () => {
  return (
    <Hero
      eyebrow="INTRODUCING RESA MANAGEMENT"
      title={
        <>
          <div className="whitespace-nowrap">
            <span className="font-serif font-normal">AI management, </span>
            <span className="font-serif font-normal italic">seamlessly </span>
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
      ctaLink="/waitlist"
      mockupImage={{
        src: "/dashboard.png",
        alt: "RESA Dashboard Interface",
        width: 900,
        height: 740,
      }}
    />
  );
};

export default HeroSection;

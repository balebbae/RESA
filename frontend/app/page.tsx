import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";

export default function Home() {
  return (
    <>
    <Navbar />
    <div className="items-center justify-items-center ">
      <main className="">
        <Hero title="Simple Scheduling" description="Free, super simple employee scheduling for small businesses. " primaryButtonText="Get Started" primaryButtonUrl="/" />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        footer
      </footer>
    </div>
    </>
  );
}

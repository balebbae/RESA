import { Gallery4, Gallery4Props } from "@/components/ui/gallery4";

const demoData: Gallery4Props = {
  title: "Success Stories",
  description:
    "Discover how restaurants of all types are transforming their operations with RESA. From small cafes to large chains, see real results from restaurants that made the switch to intelligent scheduling.",
  items: [
    {
      id: "fast-casual-chain",
      title: "Fast Casual Chain: 40% Reduction in Scheduling Time",
      description:
        "See how a 25-location fast casual chain automated their staff scheduling with RESA, reducing manager workload by 40% while improving employee satisfaction and reducing no-shows.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3NzN8MHwxfGFsbHwxMjN8fHx8fHwyfHwxNzIzODA2OTM5fA&ixlib=rb-4.0.3&q=80&w=1080",
    },
    {
      id: "fine-dining",
      title: "Fine Dining Restaurant: Perfect Shift Coverage",
      description:
        "Discover how an upscale restaurant group eliminated last-minute staffing issues and maintained service excellence with RESA's intelligent scheduling and automatic coverage system.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3NzN8MHwxfGFsbHwxMjR8fHx8fHwyfHwxNzIzODA2OTM5fA&ixlib=rb-4.0.3&q=80&w=1080",
    },
    {
      id: "cafe-franchise",
      title: "Coffee Shop Franchise: Streamlined Multi-Location Management",
      description:
        "Learn how a growing coffee franchise with 15 locations standardized their scheduling processes, improved compliance tracking, and enhanced communication across all stores.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3NzN8MHwxfGFsbHwxNzd8fHx8fHwyfHwxNzIzNjM0NDc0fA&ixlib=rb-4.0.3&q=80&w=1080",
    },
    {
      id: "pizza-delivery",
      title: "Pizza Delivery Chain: Optimized Peak Hour Staffing",
      description:
        "Explore how a busy pizza delivery chain uses RESA's predictive scheduling to ensure optimal staffing during peak hours, reducing delivery times and increasing customer satisfaction.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3NzN8MHwxfGFsbHwxMzF8fHx8fHwyfHwxNzIzNDM1MzA1fA&ixlib=rb-4.0.3&q=80&w=1080",
    },
    {
      id: "hotel-restaurant",
      title: "Hotel Restaurant: 24/7 Scheduling Excellence",
      description:
        "See how a hotel restaurant group manages complex 24/7 operations across multiple dining venues, ensuring proper coverage for room service, restaurants, and banquet events.",
      href: "#",
      image:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3NzN8MHwxfGFsbHwxMjV8fHx8fHwyfHwxNzIzNDM1Mjk4fA&ixlib=rb-4.0.3&q=80&w=1080",
    },
  ],
};

function Gallery4Demo() {
  return <Gallery4 {...demoData} />;
}

export { Gallery4Demo };

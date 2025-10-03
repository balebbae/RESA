import { CustomersSection } from "@/components/ui/customers-section";

const customers = [
  {
    src: "https://html.tailus.io/blocks/customers/nvidia.svg",
    alt: "Restaurant Chain A",
    height: 20,
  },
  {
    src: "https://html.tailus.io/blocks/customers/column.svg",
    alt: "Fast Casual B",
    height: 16,
  },
  {
    src: "https://html.tailus.io/blocks/customers/github.svg",
    alt: "Coffee Shop C",
    height: 16,
  },
  {
    src: "https://html.tailus.io/blocks/customers/nike.svg",
    alt: "Fine Dining D",
    height: 20,
  },
  {
    src: "https://html.tailus.io/blocks/customers/lemonsqueezy.svg",
    alt: "Pizza Chain E",
    height: 20,
  },
  {
    src: "https://html.tailus.io/blocks/customers/laravel.svg",
    alt: "Burger Restaurant F",
    height: 16,
  },
  {
    src: "https://html.tailus.io/blocks/customers/lilly.svg",
    alt: "Family Restaurant G",
    height: 28,
  },
  {
    src: "https://html.tailus.io/blocks/customers/openai.svg",
    alt: "Steakhouse H",
    height: 24,
  },
];

export function CustomersSectionDemo() {
  return <CustomersSection customers={customers} />;
}

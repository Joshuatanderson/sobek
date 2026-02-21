import { SobekWidget } from "@/components/sobek-widget";

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SobekWidget />
    </>
  );
}

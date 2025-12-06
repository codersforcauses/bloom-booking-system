import Breadcrumb from "@/components/ui/breadcrumb";

export default function TestPage() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Breadcrumb Test</h1>

      <Breadcrumb
        items={[
          { label: "Find my booking", href: "/" },
          { label: "List of Bookings" },
        ]}
      />
    </div>
  );
}

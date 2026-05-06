import { ReferenceExplorer } from "@/components/ReferenceExplorer";

export default function ReferencesPage() {
  return (
    <section className="py-20 md:py-24">
      <div className="container">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">MAHAREX Project Reference</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-graphite md:text-6xl">납품실적</h1>
        </div>
        <ReferenceExplorer />
      </div>
    </section>
  );
}

import { ReferenceExplorer } from "@/components/ReferenceExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "납품실적",
  description: "마하렉스가 수행한 반응기, 건조기, 여과기, 분쇄기 및 공정 설비 납품실적입니다.",
  alternates: { canonical: "/ko/references" }
};

export default function ReferencesPage() {
  return (
    <section className="py-10 sm:py-16 md:py-20">
      <div className="container">
        <div className="mb-10 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">MAHAREX Project Reference</p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-graphite md:text-5xl">납품실적</h1>
        </div>
        <ReferenceExplorer />
      </div>
    </section>
  );
}

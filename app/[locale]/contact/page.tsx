import { RfqForm } from "@/components/RfqForm";
import { Section } from "@/components/Section";
import { Locale, copy } from "@/lib/site-data";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const ko = locale === "ko";

  return (
    <Section eyebrow="Contact / RFQ" title={copy[locale].contactTitle}>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr]">
        <div className="bg-graphite p-8 text-white">
          <h3 className="text-3xl font-black">MAHAREX</h3>
          <p className="mt-5 text-sm leading-7 text-white/70">
            {ko
              ? "제품명, 처리량, 원료 특성, 온도·압력 조건을 알려주시면 검토 후 회신드립니다."
              : "Share product type, capacity, material properties, and operating conditions for a focused engineering response."}
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/80">
            <p>maharex@naver.com</p>
            <p>Tel. 031-673-5888</p>
            <p>Fax. 031-673-5288</p>
            <p>www.maharex.com</p>
            <p>{ko ? "대한민국 제조" : "Manufactured in Korea"}</p>
          </div>
        </div>
        <RfqForm locale={locale} />
      </div>
    </Section>
  );
}

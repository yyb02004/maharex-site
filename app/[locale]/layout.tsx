import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { Locale, locales } from "@/lib/site-data";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  if (!locales.includes(localeParam as Locale)) notFound();
  const locale = localeParam as Locale;
  return <SiteShell locale={locale}>{children}</SiteShell>;
}

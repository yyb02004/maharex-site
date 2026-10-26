export function Section({
  eyebrow,
  title,
  children,
  dark = false
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section className={dark ? "bg-graphite py-12 text-white sm:py-16 lg:py-24" : "py-12 sm:py-16 lg:py-24"}>
      <div className="container">
        {eyebrow ? <p className={dark ? "text-xs font-bold text-white/65 sm:text-sm" : "text-xs font-bold text-signal sm:text-sm"}>{eyebrow}</p> : null}
        <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight sm:text-3xl md:text-4xl">{title}</h2>
        <div className="mt-7 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}

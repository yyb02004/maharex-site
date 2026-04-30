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
    <section className={dark ? "bg-graphite py-24 text-white" : "py-24"}>
      <div className="container">
        {eyebrow ? <p className={dark ? "text-sm font-bold uppercase tracking-[0.24em] text-white/55" : "text-sm font-bold uppercase tracking-[0.24em] text-signal"}>{eyebrow}</p> : null}
        <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight md:text-4xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

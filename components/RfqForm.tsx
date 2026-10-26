"use client";

import { FormEvent, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Locale, products } from "@/lib/site-data";

export function RfqForm({ locale, initialProduct = "" }: { locale: Locale; initialProduct?: string }) {
  const ko = locale === "ko";
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [productSlug, setProductSlug] = useState(initialProduct);
  const submitting = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      company: String(formData.get("company") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      product: products.find((product) => product.slug === productSlug)?.[locale].name || "",
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
      startedAt
    };
    submitting.current = true;
    setStatus("sending");
    setMessage("");

    let response: Response;
    try {
      response = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      submitting.current = false;
      setStatus("error");
      setMessage("서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const result = await response.json().catch(() => ({}));
    submitting.current = false;
    if (!response.ok) {
      setStatus("error");
      setMessage(result.message || `접수 중 오류가 발생했습니다. (${response.status})`);
      return;
    }

    form.reset();
    setProductSlug(initialProduct);
    setStartedAt(Date.now());
    setStatus("success");
    setMessage("견적 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.");
  };

  return (
    <form onSubmit={handleSubmit} className="relative min-w-0 border-t-2 border-graphite pt-6" aria-busy={status === "sending"}>
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="rfq-website">Website</label>
        <input id="rfq-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <fieldset disabled={status === "sending"} className="grid min-w-0 gap-5">
      <legend className="sr-only">{ko ? "제작·견적 문의" : "Project enquiry"}</legend>
      <p className="text-sm text-steel">{ko ? "* 필수 입력" : "* Required"}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="rfq-field">{ko ? "회사명 *" : "Company *"}
          <input name="company" minLength={2} maxLength={120} autoComplete="organization" placeholder={ko ? "회사 또는 기관명" : "Company name"} required />
        </label>
        <label className="rfq-field">{ko ? "담당자 *" : "Contact name *"}
          <input name="name" minLength={2} maxLength={80} autoComplete="name" placeholder={ko ? "성함" : "Your name"} required />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="rfq-field">{ko ? "연락처 *" : "Phone *"}
          <input name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" placeholder="010-0000-0000" required />
        </label>
        <label className="rfq-field">{ko ? "이메일 (선택)" : "Email (optional)"}
          <input name="email" type="email" inputMode="email" maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="name@company.com" />
        </label>
      </div>
      <label className="rfq-field">{ko ? "관심 제품" : "Product"}
      <select name="product" value={productSlug} onChange={(event) => setProductSlug(event.target.value)}>
        <option value="">
          {ko ? "제품 미정 · 상담 후 결정" : "Not sure yet"}
        </option>
        {products.map((product) => (
          <option key={product.slug} value={product.slug}>
            {product[locale].name}
          </option>
        ))}
      </select>
      </label>
      <label className="rfq-field">{ko ? "문의 내용 *" : "Your enquiry *"}
        <textarea name="message" minLength={10} maxLength={3000} rows={6} aria-describedby="rfq-message-help" placeholder={ko ? "예: 분말 원료의 진공건조 설비를 검토하고 있습니다. 처리량은 상담 후 결정하고 싶습니다." : "Tell us about your material, process or equipment needs."} required />
      </label>
      <p id="rfq-message-help" className="-mt-3 text-sm leading-6 text-steel">{ko ? "원료, 처리량, 온도 등 알고 계신 내용만 적어주세요. 상세 사양은 상담 시 함께 검토합니다. (10~3,000자)" : "Share what you know. We can discuss specifications together. (10–3,000 characters)"}</p>
      <label className="flex cursor-pointer items-start gap-3 border-t border-black/10 py-4 text-sm font-semibold leading-6 text-steel">
        <input name="privacy" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#dc4b2d]" />
        <span>
          개인정보 수집 및 이용에 동의합니다.
          <a href={`/${locale}/privacy`} target="_blank" rel="noopener noreferrer" className="ml-2 inline-block font-black text-graphite underline decoration-signal underline-offset-4">
            개인정보처리방침 보기
          </a>
        </span>
      </label>
      <button className="flex min-h-14 items-center justify-center gap-3 bg-signal px-5 py-4 text-base font-black text-white hover:bg-graphite disabled:opacity-60" type="submit" disabled={status === "sending"}>
        {status === "sending" ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={20} aria-hidden="true" />}
        {status === "sending" ? "접수 중..." : "제작·견적 문의 보내기"}
      </button>
      </fieldset>
      {message ? (
        <p role={status === "error" ? "alert" : "status"} className={`mt-5 flex items-start gap-2 text-sm font-bold leading-6 ${status === "success" ? "text-cobalt" : "text-signal"}`}>
          {status === "success" && <CheckCircle2 size={20} className="mt-0.5 shrink-0" aria-hidden="true" />}
          {message}
        </p>
      ) : null}
    </form>
  );
}

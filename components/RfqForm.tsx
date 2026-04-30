"use client";

import { FormEvent, useState } from "react";
import { Locale, copy, products } from "@/lib/site-data";

export function RfqForm({ locale }: { locale: Locale }) {
  const ko = locale === "ko";
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      company: String(formData.get("company") || ""),
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      product: String(formData.get("product") || ""),
      message: String(formData.get("message") || "")
    };

    const response = await fetch("/api/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(result.message || "접수 중 오류가 발생했습니다.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage("견적 요청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 bg-white p-8 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <input name="company" className="border border-black/15 p-4" placeholder={ko ? "회사명" : "Company"} required />
        <input name="name" className="border border-black/15 p-4" placeholder={ko ? "담당자" : "Name"} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input name="email" type="email" className="border border-black/15 p-4" placeholder="Email" />
        <input name="phone" className="border border-black/15 p-4" placeholder={ko ? "연락처" : "Phone"} required />
      </div>
      <select name="product" className="border border-black/15 p-4" defaultValue="">
        <option value="" disabled>
          {ko ? "관심 제품 선택" : "Select product"}
        </option>
        {products.map((product) => (
          <option key={product.slug} value={product[locale].name}>
            {product[locale].name}
          </option>
        ))}
      </select>
      <textarea name="message" className="min-h-44 border border-black/15 p-4" placeholder={ko ? "공정 조건 및 요청 사항" : "Process conditions and request"} required />
      <button className="bg-signal px-6 py-4 text-sm font-black text-white hover:bg-graphite disabled:opacity-60" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "접수 중..." : copy[locale].rfq}
      </button>
      {message ? (
        <p className={`text-sm font-bold leading-6 ${status === "success" ? "text-cobalt" : "text-signal"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

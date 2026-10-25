"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./love.module.css";

const weddingTime = new Date("2027-03-06T11:00:00+09:00").getTime();
const weddingDay = Date.UTC(2027, 2, 6);
const invitationUrl = "https://www.maharex.com/love";

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const kst = now === null ? null : new Date(now + 9 * 60 * 60 * 1000);
  const days = kst === null ? null : Math.round((weddingDay - Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())) / 86_400_000);
  const remaining = now === null ? null : Math.max(0, weddingTime - now);

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownNumbers} aria-label="예식까지 남은 시간">
        {[{ label: "DAYS", value: remaining === null ? null : Math.floor(remaining / 86_400_000) }, { label: "HOURS", value: remaining === null ? null : Math.floor(remaining / 3_600_000) % 24 }, { label: "MINUTES", value: remaining === null ? null : Math.floor(remaining / 60_000) % 60 }].map(({ label, value }) => (
          <div key={label}><strong>{value === null ? "—" : String(value).padStart(2, "0")}</strong><span>{label}</span></div>
        ))}
      </div>
      <p>{days === null || days > 0 ? "소중한 분들과 함께할 그날을 기다립니다." : days === 0 ? "오늘, 저희 결혼합니다." : "함께해 주신 모든 분께 감사드립니다."}</p>
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); return true; } catch { /* Try the older clipboard API in embedded browsers. */ }
  }
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const text = document.createElement("textarea");
  text.value = value;
  text.setAttribute("readonly", "");
  text.style.cssText = "position:fixed;top:0;left:-9999px;";
  document.body.appendChild(text);
  text.select();
  let copied = false;
  try { copied = document.execCommand("copy"); } catch { copied = false; }
  text.remove();
  previousFocus?.focus({ preventScroll: true });
  return copied;
}

export function CopyAddress() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className={styles.addressCopy}>
      <button type="button" className={styles.textButton} onClick={async () => {
        const result = await copyText("경기 용인시 기흥구 기흥로 58-1");
        setCopied(result); setError(!result);
      }}>{copied ? "주소를 복사했어요 ✓" : "주소 복사"}</button>
      <span role="status">{error ? "위 주소를 길게 눌러 복사해 주세요." : ""}</span>
    </div>
  );
}

export function ShareInvitation() {
  const [message, setMessage] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  function announce(text: string) {
    setMessage(text);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setMessage(""), 5000);
  }
  async function copyLink() {
    const copied = await copyText(invitationUrl);
    setShowUrl(!copied);
    announce(copied ? "청첩장 링크를 복사했어요." : "아래 링크를 길게 눌러 복사해 주세요.");
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "상혁 그리고 은정, 결혼합니다", text: "2027년 3월 6일 토요일 오전 11시 · 기흥 ICT밸리 컨벤션", url: invitationUrl });
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) await copyLink();
      }
    } else { await copyLink(); }
  }
  return (
    <div className={styles.share}>
      <button type="button" className={styles.primaryButton} onClick={share}><span aria-hidden="true">♡</span> 청첩장 공유하기</button>
      <button type="button" className={styles.textButton} onClick={copyLink}>링크 복사</button>
      {showUrl ? <input className={styles.urlInput} aria-label="청첩장 주소" readOnly value={invitationUrl} onFocus={(event) => event.target.select()} /> : null}
      <p role="status" className={styles.shareStatus}>{message}</p>
    </div>
  );
}

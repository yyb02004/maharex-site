"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./flower.module.css";

const deliveryInformation = [
  "상혁 · 은정 결혼식 화환 배송 정보",
  "예식 일시: 2027년 3월 6일 토요일 오전 11시",
  "예식장: 기흥 ICT밸리 컨벤션 A동 B1 그랑데홀",
  "주소: 경기 용인시 기흥구 기흥로 58-1",
  "신랑: 박상혁",
  "신부: 최은정",
  "예식장 전화: 031-630-3600",
].join("\n");

async function copyDeliveryInformation() {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(deliveryInformation);
      return true;
    } catch {
      // Some in-app browsers require the older, selection-based copy action.
    }
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const field = document.createElement("textarea");
  field.value = deliveryInformation;
  field.readOnly = true;
  field.tabIndex = -1;
  field.setAttribute("aria-hidden", "true");
  field.style.cssText = "position:fixed;top:0;left:-9999px;font-size:16px;";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, field.value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    field.remove();
    previousFocus?.focus({ preventScroll: true });
  }
  return copied;
}

export default function FlowerGuide() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [showManualCopy, setShowManualCopy] = useState(false);
  const manualFieldRef = useRef<HTMLTextAreaElement>(null);
  const manualFieldId = useId();
  const statusId = useId();

  useEffect(() => {
    if (showManualCopy) {
      manualFieldRef.current?.focus({ preventScroll: true });
      manualFieldRef.current?.select();
    }
  }, [showManualCopy]);

  async function handleCopy() {
    setPending(true);
    setMessage("");
    try {
      const copied = await copyDeliveryInformation();
      setShowManualCopy(!copied);
      setMessage(copied ? "배송 정보를 복사했어요." : "자동 복사가 되지 않았어요. 아래 내용을 길게 눌러 복사해 주세요.");
    } catch {
      setShowManualCopy(true);
      setMessage("자동 복사가 되지 않았어요. 아래 내용을 길게 눌러 복사해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <details className={styles.guide}>
      <summary className={styles.summary}>
        <span>화환 배송 안내</span>
        <svg className={styles.chevron} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="m4.5 7 4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </summary>
      <div className={styles.content}>
        <p className={styles.description}>원하는 꽃집에 아래 정보를 전달해 주세요.</p>
        <dl className={styles.information}>
          <div><dt>예식</dt><dd><time dateTime="2027-03-06T11:00:00+09:00">2027년 3월 6일 토요일<br />오전 11시</time></dd></div>
          <div><dt>장소</dt><dd>기흥 ICT밸리 컨벤션<br />A동 B1 그랑데홀</dd></div>
          <div><dt>주소</dt><dd>경기 용인시 기흥구<br />기흥로 58-1</dd></div>
          <div><dt>성함</dt><dd>신랑 박상혁 · 신부 최은정</dd></div>
          <div><dt>예식장</dt><dd><a className={styles.phone} href="tel:0316303600" aria-label="예식장 031-630-3600으로 전화하기">031-630-3600 <span aria-hidden="true">↗</span></a></dd></div>
        </dl>
        <p className={styles.note}>보내시는 분 성함과 리본 문구는<br />주문하실 꽃집에 함께 알려 주세요.</p>
        <button className={styles.copyButton} type="button" onClick={handleCopy} disabled={pending} aria-busy={pending} aria-describedby={statusId}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5.5" y="5.5" width="8" height="8" rx="0.5" stroke="currentColor" />
            <path d="M10.5 3.5V2.5h-8v8h1" stroke="currentColor" />
          </svg>
          {pending ? "복사 중" : "배송 정보 복사"}
        </button>
        <p id={statusId} className={styles.status} role="status" aria-live="polite" aria-atomic="true">{message}</p>
        {showManualCopy ? <div className={styles.manualCopy}>
          <label htmlFor={manualFieldId}>배송 정보 직접 복사</label>
          <textarea ref={manualFieldRef} id={manualFieldId} readOnly rows={8} value={deliveryInformation} onFocus={(event) => event.currentTarget.select()} />
        </div> : null}
      </div>
    </details>
  );
}

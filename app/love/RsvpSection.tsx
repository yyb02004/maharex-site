"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import styles from "./rsvp.module.css";

type Choice = "yes" | "no" | "undecided";
type Side = "groom" | "bride";
type Receipt = { name: string; attendance: Choice };
type Props = { apiBaseUrl: string; onReady?: (ready: boolean) => void };

class RsvpError extends Error {}

function endpoint(base: string, path: string) {
  return new URL(path, `${base.replace(/\/$/, "")}/`).href;
}

function makeRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID().replaceAll("-", "");
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function responseError(status: number) {
  if (status === 400) return "입력한 내용을 다시 확인해 주세요.";
  if (status === 429) return "잠시 쉬었다가 다시 전해 주세요. 요청이 조금 몰렸어요.";
  if (status === 404 || status === 503) return "지금은 참석 정보를 받을 수 없어요. 조금 뒤 다시 들러 주세요.";
  return "아직 전달을 확인하지 못했어요. 잠시 후 다시 눌러 주세요.";
}

export default function RsvpSection({ apiBaseUrl, onReady }: Props) {
  const id = useId();
  const [enabled, setEnabled] = useState(false);
  const [name, setName] = useState("");
  const [side, setSide] = useState<Side>("groom");
  const [attendance, setAttendance] = useState<Choice>("yes");
  const [partyCount, setPartyCount] = useState("1");
  const [meal, setMeal] = useState<Choice>("undecided");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const requestIdentity = useRef<{ fingerprint: string; requestId: string } | null>(null);
  const submission = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const readinessCallback = useRef(onReady);

  useEffect(() => { readinessCallback.current = onReady; }, [onReady]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; submission.current?.abort(); };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    let current = true;
    setEnabled(false);
    async function checkAvailability() {
      let ready = false;
      try {
        const response = await fetch(endpoint(apiBaseUrl, "/api/health"), {
          cache: "no-store", credentials: "omit", signal: controller.signal,
        });
        if (response.ok) {
          const data: unknown = await response.json();
          if (data && typeof data === "object" && "features" in data) {
            const features = data.features;
            ready = !!features && typeof features === "object" && "rsvp" in features && features.rsvp === true;
          }
        }
      } catch { /* An older or unavailable storage service must not display a nonworking form. */ }
      finally { window.clearTimeout(timer); }
      if (current) { setEnabled(ready); readinessCallback.current?.(ready); }
    }
    void checkAvailability();
    return () => { current = false; window.clearTimeout(timer); controller.abort(); };
  }, [apiBaseUrl]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const trimmedName = name.trim();
    const count = attendance === "yes" ? Number(partyCount) : 0;
    if (!trimmedName || trimmedName.length > 40) { setError("성함을 40자 이내로 적어 주세요."); return; }
    if (attendance === "yes" && (!Number.isInteger(count) || count < 1 || count > 10)) {
      setError("본인을 포함한 참석 인원을 1명에서 10명 사이로 적어 주세요."); return;
    }
    if (!consent) { setError("비공개 저장 안내를 확인하고 동의해 주세요."); return; }

    const payload = { name: trimmedName, side, attendance, partyCount: count, meal: attendance === "yes" ? meal : "undecided", consent: true };
    const fingerprint = JSON.stringify(payload);
    if (requestIdentity.current?.fingerprint !== fingerprint) requestIdentity.current = { fingerprint, requestId: makeRequestId() };
    const requestId = requestIdentity.current.requestId;
    const controller = new AbortController();
    submission.current = controller;
    busy.current = true;
    setSending(true);
    setError("");
    const timer = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(endpoint(apiBaseUrl, "/api/rsvp"), {
        method: "POST", cache: "no-store", credentials: "omit", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, requestId }),
      });
      if (!response.ok) throw new RsvpError(responseError(response.status));
      const acknowledgment: unknown = await response.json();
      if (!acknowledgment || typeof acknowledgment !== "object" || !("ok" in acknowledgment) || acknowledgment.ok !== true
        || !("id" in acknowledgment) || acknowledgment.id !== requestId || !("createdAt" in acknowledgment) || typeof acknowledgment.createdAt !== "string") {
        throw new RsvpError("아직 전달을 확인하지 못했어요. 다시 눌러 주시면 같은 요청을 확인할게요.");
      }
      if (!mounted.current) return;
      setReceipt({ name: trimmedName, attendance });
      setName(""); setSide("groom"); setAttendance("yes"); setPartyCount("1"); setMeal("undecided"); setConsent(false);
      requestIdentity.current = null;
    } catch (failure) {
      if (!mounted.current) return;
      setError(failure instanceof RsvpError ? failure.message
        : controller.signal.aborted ? "아직 전달을 확인하지 못했어요. 다시 눌러 주시면 같은 요청을 확인할게요."
          : "잠시 연결이 어려워요. 같은 내용으로 다시 전해 주세요.");
    } finally {
      window.clearTimeout(timer);
      if (submission.current === controller) {
        submission.current = null; busy.current = false;
        if (mounted.current) setSending(false);
      }
    }
  }

  if (!enabled) return null;

  return <section id="rsvp" className={styles.section} aria-labelledby={`${id}-title`}>
    <p className={styles.eyebrow}>A SEAT FOR YOU</p>
    <h2 id={`${id}-title`} className={styles.title}>함께할 봄날을 알려주세요</h2>
    <p className={styles.intro}>반가운 얼굴들을 떠올리며<br />한 자리, 한 자리 정성껏 준비하고 있어요.<br />함께하실 수 있는지 살짝 알려 주세요.</p>
    <details className={styles.composer}>
      <summary className={styles.summary}>참석 여부 전하기 <span aria-hidden="true">＋</span></summary>
      {receipt ? <div className={styles.receipt} role="status" aria-live="polite">
        <span className={styles.receiptMark} aria-hidden="true">✓</span>
        <h3>{receipt.name}님, 소식 전해 주셔서 고맙습니다.</h3>
        <p>{receipt.attendance === "yes" ? <>봄날의 약속에서<br />반가운 얼굴로 만나요.</> : <>어디에 계시든, 보내주신 마음과 함께<br />저희의 봄을 맞이할게요.</>}</p>
        <small>참석 정보가 신랑·신부에게 비공개로 저장되었습니다.</small>
      </div> : <form className={styles.form} onSubmit={submit} aria-busy={sending}>
        <fieldset className={styles.formFields} disabled={sending}>
          <label className={styles.label} htmlFor={`${id}-name`}>성함</label>
          <input id={`${id}-name`} className={styles.textInput} name="name" autoComplete="name" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="성함을 적어 주세요" required />

          <fieldset className={styles.choiceGroup}>
            <legend>어느 쪽 손님이신가요?</legend>
            <div className={styles.twoChoices}>
              {([{ value: "groom", label: "신랑측" }, { value: "bride", label: "신부측" }] as const).map((option) => <label className={styles.choice} key={option.value}><input type="radio" name={`${id}-side`} value={option.value} checked={side === option.value} onChange={() => setSide(option.value)} /><span>{option.label}</span></label>)}
            </div>
          </fieldset>

          <fieldset className={styles.choiceGroup}>
            <legend>함께하실 수 있나요?</legend>
            <div className={styles.threeChoices}>
              {([{ value: "yes", label: "참석해요" }, { value: "no", label: "마음으로 함께해요" }, { value: "undecided", label: "아직 미정이에요" }] as const).map((option) => <label className={styles.choice} key={option.value}><input type="radio" name={`${id}-attendance`} value={option.value} checked={attendance === option.value} onChange={() => setAttendance(option.value)} /><span>{option.label}</span></label>)}
            </div>
          </fieldset>

          {attendance === "yes" ? <>
            <label className={styles.label} htmlFor={`${id}-party-count`}>참석 인원 <span className={styles.note}>본인을 포함해 주세요</span></label>
            <div className={styles.countField}><input id={`${id}-party-count`} className={styles.textInput} name="partyCount" type="number" inputMode="numeric" min={1} max={10} step={1} value={partyCount} onChange={(event) => setPartyCount(event.target.value)} required /><span aria-hidden="true">명</span></div>
            <fieldset className={styles.choiceGroup}>
              <legend>식사도 함께하시나요?</legend>
              <div className={styles.threeChoices}>
                {([{ value: "yes", label: "식사해요" }, { value: "no", label: "식사 안 해요" }, { value: "undecided", label: "아직 미정이에요" }] as const).map((option) => <label className={styles.choice} key={option.value}><input type="radio" name={`${id}-meal`} value={option.value} checked={meal === option.value} onChange={() => setMeal(option.value)} /><span>{option.label}</span></label>)}
              </div>
            </fieldset>
          </> : null}

          <label className={styles.consent}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required /><span>이름과 참석 정보는 신랑·신부의 참석 확인을 위해 비공개로 저장됩니다. 저장에 동의합니다.</span></label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button className={styles.submitButton} type="submit" disabled={sending}>{sending ? "소식을 전하고 있어요…" : "참석 여부 전하기"}<span aria-hidden="true">↗</span></button>
        </fieldset>
      </form>}
    </details>
  </section>;
}

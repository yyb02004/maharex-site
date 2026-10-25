"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./gifts.module.css";

type FamilyMember = {
  role: string;
  name: string;
  bank: string;
  account: string;
  phone: string;
};

const families: { side: string; members: FamilyMember[] }[] = [
  {
    side: "신랑측",
    members: [
      { role: "신랑", name: "박상혁", bank: "국민은행", account: "218102-04-477151", phone: "010-6556-5533" },
      { role: "신랑 어머니", name: "김명순", bank: "국민은행", account: "671401-01-305471", phone: "010-2073-6105" },
    ],
  },
  {
    side: "신부측",
    members: [
      { role: "신부", name: "최은정", bank: "우리은행", account: "1002-260-416770", phone: "010-4410-0070" },
      { role: "신부 아버지", name: "최준호", bank: "농협", account: "010-5614-665209", phone: "010-5614-6652" },
      { role: "신부 어머니", name: "조은희", bank: "경남은행", account: "679-210-011011", phone: "010-9391-6695" },
    ],
  },
];

function Chevron() {
  return (
    <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 3.5H4.8c-.7 0-1.3.6-1.3 1.3 0 8.7 7 15.7 15.7 15.7.7 0 1.3-.6 1.3-1.3v-2.4a1.3 1.3 0 0 0-1.1-1.3l-3-.5a1.3 1.3 0 0 0-1.2.4l-1.3 1.3a13.7 13.7 0 0 1-6.6-6.6l1.3-1.3a1.3 1.3 0 0 0 .4-1.2l-.5-3a1.3 1.3 0 0 0-1.3-1.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 4.5h14A1.5 1.5 0 0 1 20.5 6v10a1.5 1.5 0 0 1-1.5 1.5H9l-5.5 3V6A1.5 1.5 0 0 1 5 4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 9h9m-9 4h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ContactSection() {
  return (
    <section className={styles.contactSection} aria-label="신랑 신부와 혼주 연락처">
      <div className={styles.inner}>
        <details className={styles.accordion}>
          <summary className={styles.summary}>
            <span>신랑 · 신부와 혼주에게 연락하기</span>
            <Chevron />
          </summary>
          <div className={styles.contactPanel}>
            {families.map((family) => (
              <div className={styles.familyContacts} key={family.side}>
                <h3 className={styles.familyHeading}>{family.side}</h3>
                <ul className={styles.contactList}>
                  {family.members.map((person) => (
                    <li className={styles.contactRow} key={person.name}>
                      <div className={styles.contactPerson}>
                        <span className={styles.role}>{person.role}</span>
                        <span className={styles.personName}>{person.name}</span>
                        <span className={styles.phoneNumber}>{person.phone}</span>
                      </div>
                      <div className={styles.contactActions}>
                        <a
                          className={styles.contactLink}
                          href={`tel:${person.phone.replaceAll("-", "")}`}
                          aria-label={`${person.role} ${person.name}님께 전화하기, ${person.phone}`}
                          title="전화하기"
                        >
                          <PhoneIcon />
                        </a>
                        <a
                          className={styles.contactLink}
                          href={`sms:${person.phone.replaceAll("-", "")}`}
                          aria-label={`${person.role} ${person.name}님께 문자 보내기, ${person.phone}`}
                          title="문자 보내기"
                        >
                          <MessageIcon />
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}

async function copyAccount(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Some in-app browsers reject the Clipboard API but support a selection copy.
    }
  }

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const field = document.createElement("textarea");
  field.value = value;
  field.readOnly = true;
  field.setAttribute("aria-label", "복사할 계좌번호");
  Object.assign(field.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    fontSize: "16px",
  });

  try {
    document.body.appendChild(field);
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, value.length);
    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    field.remove();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
}

export default function GiftSection() {
  const titleId = useId();
  const [feedback, setFeedback] = useState<{ message: string; success: boolean } | null>(null);
  const accountFields = useRef<Record<string, HTMLInputElement | null>>({});
  const copyRequest = useRef(0);

  useEffect(() => {
    if (!feedback?.success) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleCopy(person: FamilyMember) {
    const request = ++copyRequest.current;
    const copied = await copyAccount(person.account);
    if (request !== copyRequest.current) return;
    if (copied) {
      setFeedback({ message: `${person.name}님의 계좌번호를 복사했어요.`, success: true });
      return;
    }
    const field = accountFields.current[person.name];
    field?.focus({ preventScroll: true });
    field?.select();
    setFeedback({ message: "복사하지 못했어요. 선택된 계좌번호를 직접 복사해 주세요.", success: false });
  }

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>WITH GRATITUDE</p>
        <h2 className={styles.heading} id={titleId}>마음 전하실 곳</h2>
        <p className={styles.description}>함께해 주시는 마음만으로도 감사합니다.<br />보내주신 축복, 오래도록 기억하겠습니다.</p>

        <div className={styles.giftAccordions}>
          {families.map((family) => (
            <details className={styles.accordion} key={family.side}>
              <summary className={styles.summary}>
                <span>{family.side} 계좌번호</span>
                <Chevron />
              </summary>
              <ul className={styles.accountList}>
                {family.members.map((person) => (
                  <li className={styles.accountCard} key={person.name}>
                    <div className={styles.accountPerson}>
                      <span className={styles.role}>{person.role}</span>
                      <span className={styles.personName}>{person.name}</span>
                    </div>
                    <p className={styles.bank}>{person.bank}</p>
                    <div className={styles.accountLine}>
                      <input
                        ref={(element) => { accountFields.current[person.name] = element; }}
                        className={styles.accountNumber}
                        type="text"
                        value={person.account}
                        readOnly
                        spellCheck={false}
                        aria-label={`${person.name}님의 ${person.bank} 계좌번호`}
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <button
                        className={styles.copyButton}
                        type="button"
                        aria-label={`${person.name}님의 ${person.bank} 계좌번호 복사`}
                        onClick={() => { void handleCopy(person); }}
                      >
                        복사
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>

      <div className={styles.copyStatus} role="status" aria-live="polite" aria-atomic="true" data-visible={feedback !== null}>
        {feedback?.message ?? ""}
      </div>
    </section>
  );
}

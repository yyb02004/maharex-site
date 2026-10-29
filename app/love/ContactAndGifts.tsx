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
      { role: "신랑", name: "박상혁", bank: "국민은행", account: "218102-04-477151", phone: "01065565533" },
      { role: "신랑 어머니", name: "김명순", bank: "농협", account: "039-12-059200", phone: "01020736105" },
    ],
  },
  {
    side: "신부측",
    members: [
      { role: "신부", name: "최은정", bank: "우리은행", account: "1002-260-416770", phone: "01044100070" },
      { role: "신부 아버지", name: "최준호", bank: "농협", account: "010-5614-665209", phone: "01056146652" },
      { role: "신부 어머니", name: "조은희", bank: "경남은행", account: "679-210-011011", phone: "01093916695" },
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

function ContactIcon({ message = false }: { message?: boolean }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {message
      ? <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.35" /><path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></>
      : <path d="m7.2 3.7 2.3 4.1a1.3 1.3 0 0 1-.2 1.5L7.8 11c1.2 2.3 3 4.1 5.3 5.3l1.7-1.5a1.3 1.3 0 0 1 1.5-.2l4.1 2.3a1.3 1.3 0 0 1 .6 1.4l-.5 2a1.4 1.4 0 0 1-1.5 1C9.8 20.7 3.3 14.2 2.7 5a1.4 1.4 0 0 1 1-1.5l2-.5a1.3 1.3 0 0 1 1.5.7Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />}
  </svg>;
}

function ContactRow({ person }: { person: FamilyMember }) {
  return <li className={styles.contactRow}>
    <div className={styles.contactPerson}><span className={styles.role}>{person.role}</span><span className={styles.personName}>{person.name}</span></div>
    <div className={styles.contactActions}>
      <a href={`tel:${person.phone}`} aria-label={`${person.role} ${person.name}님께 전화하기`}><ContactIcon /><span>전화</span></a>
      <a href={`sms:${person.phone}`} aria-label={`${person.role} ${person.name}님께 문자 보내기`}><ContactIcon message /><span>문자</span></a>
    </div>
  </li>;
}

export function ContactSection() {
  const couple = families.map((family) => family.members[0]);
  const parents = families.flatMap((family) => family.members.slice(1));

  return <section className={styles.contactSection} aria-label="신랑 신부와 혼주에게 연락하기">
    <details className={`${styles.accordion} ${styles.contactAccordion}`}>
      <summary className={`${styles.summary} ${styles.contactSummary}`}><span>우리에게 연락하기</span><Chevron /></summary>
      <div className={styles.contactBody}>
        <ul className={styles.contactList}>{couple.map((person) => <ContactRow key={person.name} person={person} />)}</ul>
        <p className={styles.parentsLabel}>함께 기다리는 부모님께</p>
        <ul className={styles.contactList}>{parents.map((person) => <ContactRow key={person.name} person={person} />)}</ul>
      </div>
    </details>
  </section>;
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
        <p className={styles.description}>저희의 봄을 함께 기뻐해 주셔서 고맙습니다.<br />보내주신 마음은 두 사람의 일상에<br />오래도록 따뜻한 햇살로 남을 거예요.</p>

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

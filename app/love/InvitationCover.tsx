import Image from "next/image";
import BackgroundMusic from "./BackgroundMusic";
import styles from "./cover.module.css";

export default function InvitationCover({ guestsEnabled = false }: { guestsEnabled?: boolean }) {
  return (
    <header className={styles.cover}>
      <div className={styles.scene}>
        <Image
          className={styles.photo}
          src="/love/photos/photo-20.webp"
          alt="함께 웃고 있는 신랑 박상혁과 신부 최은정"
          fill
          priority
          sizes="(max-width: 480px) 100vw, 480px"
        />
        <div className={styles.shade} aria-hidden="true" />

        <div className={styles.topline}>
          <p className={styles.eyebrow}>THE WEDDING DAY<span>06 MARCH 2027</span></p>
          <div className={styles.musicControl}><BackgroundMusic /></div>
        </div>

        <div className={styles.caption}>
          <p className={styles.englishNames} aria-hidden="true">
            <span>SangHyeok</span>
            <span><i>&amp;</i> EunJung</span>
          </p>

          <div className={styles.details}>
            <h1 className={styles.koreanNames}>박상혁 <span aria-hidden="true">&amp;</span><span className={styles.srOnly}>그리고</span> 최은정</h1>
            <div className={styles.hairline} aria-hidden="true" />
            <p className={styles.date}><time dateTime="2027-03-06T11:00:00+09:00">2027년 3월 6일 토요일 · 오전 11시</time></p>
            <p className={styles.venue}>기흥 ICT밸리 컨벤션<span>A동 B1 그랑데홀</span></p>
            <a className={styles.scrollLink} href="#invitation" aria-label="초대의 글로 내려가기">
              <span>WITH LOVE, ALWAYS</span>
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                <path d="M7 1v14m-4-4 4 4 4-4" stroke="currentColor" strokeWidth="1" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <nav className={styles.navigation} aria-label="청첩장 바로가기">
        <a href="#invitation">초대의 글</a>
        <a href="#gallery">사진</a>
        <a href="#location">오시는 길</a>
        <a href="#gifts">마음 전하기</a>
        {guestsEnabled && <a href="#guestbook">방명록</a>}
      </nav>
    </header>
  );
}

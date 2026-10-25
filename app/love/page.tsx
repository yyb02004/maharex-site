import type { Metadata, Viewport } from "next";
import Image from "next/image";
import PhotoGallery from "./PhotoGallery";
import GiftSection, { ContactSection } from "./ContactAndGifts";
import { CopyAddress, Countdown, ShareInvitation } from "./InvitationTools";
import styles from "./love.module.css";

const title = "상혁 그리고 은정, 결혼합니다";
const description = "2027년 3월 6일 토요일 오전 11시 · 기흥 ICT밸리 컨벤션 A동 B1 그랑데홀. 가장 예쁜 날, 소중한 분들을 초대합니다.";
const venueQuery = encodeURIComponent("기흥 ICT밸리 컨벤션");
const kakaoMap = `https://map.kakao.com/link/search/${venueQuery}`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  applicationName: "상혁과 은정의 청첩장",
  keywords: [],
  alternates: { canonical: "https://www.maharex.com/love" },
  robots: { index: false, follow: false },
  openGraph: { type: "website", locale: "ko_KR", url: "https://www.maharex.com/love", siteName: "상혁 그리고 은정", title, description, images: [{ url: "/love/share.jpg", width: 800, height: 1200, alt: "함께 웃고 있는 상혁과 은정" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/love/share.jpg"] },
  icons: { icon: "/love/icon.svg", apple: "/love/apple-icon.png" },
};

export const viewport: Viewport = { themeColor: "#fdfcf9", colorScheme: "light" };

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <div className={styles.sectionHeading}><p>{eyebrow}</p><h2>{children}</h2></div>;
}

export default function LovePage() {
  return (
    <div className={styles.backdrop}>
      <aside className={styles.desktopNote} aria-hidden="true"><span>A DAY TO REMEMBER</span><p>S <i>&</i> E</p><div /><small>MARCH 6, 2027</small><span>우리의 시작에 초대합니다.</span></aside>
      <main className={styles.invitation} id="top">
        <a className={styles.skipLink} href="#wedding-day">예식 안내로 바로가기</a>
        <header className={styles.hero}>
          <div className={styles.masthead}><span>THE WEDDING OF</span><span>06 MARCH 2027</span></div>
          <p className={styles.coverTitle} aria-hidden="true"><span>Sanghyeok</span><span><i>&</i> Eunjeong</span></p>
          <div className={styles.heroPhoto}>
            <Image src="/love/photos/photo-20.webp" alt="나란히 앉아 함께 웃고 있는 신랑 상혁과 신부 은정" width={1200} height={1800} priority sizes="(max-width: 480px) 92vw, 448px" />
          </div>
          <div className={styles.heroCaption}><h1 className={styles.names}>박상혁 <span>·</span> 최은정</h1><p>토요일, 오전 11시</p></div>
          <div className={styles.heroInfo}><p>2027년 3월 6일</p><span>기흥 ICT밸리 컨벤션 · A동 B1 그랑데홀</span></div>
          <nav className={styles.coverNav} aria-label="청첩장 바로가기"><a href="#invitation">초대의 글</a><a href="#gallery">사진</a><a href="#location">오시는 길</a><a href="#gifts">마음 전하기</a></nav>
        </header>

        <section className={`${styles.section} ${styles.letter}`} id="invitation">
          <p className={styles.letterLead} aria-hidden="true">A lifetime,<br /><i>together.</i></p>
          <SectionHeading eyebrow="INVITATION">저희, 결혼합니다</SectionHeading>
          <div className={styles.letterText}>
            <p>서로 다른 취향도, 다른 속도도<br />이제는 제법 잘 맞춰가며<br />꽤 괜찮은 한 팀이 된 저희,<br />평생을 함께해 보려 합니다.</p>
            <p>귀한 걸음으로 오셔서<br />저희의 시작을 응원해 주시고<br />축복해 주세요.</p>
          </div>
          <div className={styles.family}>
            <p><span><small>故</small> 박종신 · 김명순</span><span className={styles.relation}>의 장남</span><strong>상혁</strong></p>
            <p><span>최준호 · 조은희</span><span className={styles.relation}>의 차녀</span><strong>은정</strong></p>
          </div>
          <ContactSection />
        </section>

        <figure className={styles.storyPhoto}>
          <Image src="/love/photos/photo-19.webp" alt="햇살이 들어오는 창가의 정원에 함께 앉아 있는 두 사람" width={1200} height={1800} sizes="(max-width: 480px) 86vw, 416px" />
          <figcaption><span>OUR PROMISE</span><p>서로의 가장 다정한 편이 되어</p></figcaption>
        </figure>

        <section className={`${styles.section} ${styles.calendarSection}`} id="wedding-day">
          <SectionHeading eyebrow="SAVE THE DATE">우리의 봄날</SectionHeading>
          <p className={styles.dateDisplay} aria-hidden="true">03 <i>/</i> 06</p>
          <p className={styles.dateLine}>2027년 3월 6일 토요일<br /><strong>오전 11시</strong></p>
          <div className={styles.calendar}>
            <p className={styles.calendarMonth}>March <span>2027</span></p>
            <table aria-label="2027년 3월 달력, 3월 6일 토요일 결혼식">
              <thead><tr>{["일", "월", "화", "수", "목", "금", "토"].map((day) => <th key={day} scope="col">{day}</th>)}</tr></thead>
              <tbody>{Array.from({ length: 5 }, (_, week) => <tr key={week}>{Array.from({ length: 7 }, (_, day) => {
                const date = week * 7 + day;
                return <td key={day}>{date >= 1 && date <= 31 ? date === 6 ? <span className={styles.weddingDate} aria-label="6일, 결혼식">6</span> : <span>{date}</span> : null}</td>;
              })}</tr>)}</tbody>
            </table>
          </div>
          <Countdown />
          <a className={styles.outlineButton} href="/love/wedding.ics" download="상혁-은정-결혼식.ics"><span aria-hidden="true">＋</span> 캘린더에 저장하기</a>
        </section>

        <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
          <SectionHeading eyebrow="MOMENTS OF US">함께한 순간들</SectionHeading>
          <p className={styles.sectionCaption}>사진 속 웃음처럼, 오래도록 함께하겠습니다.</p>
          <PhotoGallery />
        </section>

        <section className={`${styles.section} ${styles.locationSection}`} id="location">
          <SectionHeading eyebrow="LOCATION">오시는 길</SectionHeading>
          <h3 className={styles.venueName}>기흥 ICT밸리 컨벤션</h3>
          <p className={styles.hall}>A동 B1 그랑데홀</p>
          <p className={styles.address}>경기 용인시 기흥구 기흥로 58-1<br /><span>(구갈동 679)</span></p>
          <div className={styles.locationActions}><CopyAddress /><a className={styles.venuePhone} href="tel:0316303600">예식장 전화 <span aria-hidden="true">↗</span></a></div>
          <a href={kakaoMap} className={styles.map} target="_blank" rel="noreferrer" aria-label="기흥 ICT밸리 컨벤션 위치를 카카오맵에서 보기">
            <svg viewBox="0 0 400 280" role="img" aria-label="약도: 기흥역 2번 출구에서 기흥로를 따라 도보 400미터 거리에 예식장이 있습니다">
              <rect width="400" height="280" fill="#eeefea" />
              <path d="M288 14h89v137h-89zM20 25h80v110H20zM264 197h114v58H264z" fill="#e1e5db" />
              <path d="M0 181H400M144 280V136L198 84V0" fill="none" stroke="#fffdfa" strokeWidth="20" />
              <path d="M0 181H400M144 280V136L198 84V0" fill="none" stroke="#d8d2c5" strokeWidth="1" />
              <path d="M0 224H400" stroke="#bdc9a9" strokeWidth="5" />
              <path d="M151 209V141L204 89H261" fill="none" stroke="#5e6c59" strokeWidth="3" strokeDasharray="4 5" />
              <circle cx="144" cy="224" r="8" fill="#8d9d77" stroke="#fffdfa" strokeWidth="3" />
              <rect x="102" y="242" width="84" height="26" rx="13" fill="#fffdfa" />
              <text x="144" y="260" textAnchor="middle" fontSize="13" fill="#4d5742">기흥역</text>
              <text x="164" y="214" fontSize="11" fill="#796d66">2번 출구</text>
              <text x="170" y="155" fontSize="11" fill="#4c5b46">도보 400m</text>
              <text x="287" y="174" fontSize="10" fill="#928a80">신중부대로</text>
              <text x="115" y="98" fontSize="10" fill="#928a80">기흥로</text>
              <rect x="223" y="43" width="150" height="59" fill="#5e6c59" />
              <path d="M252 101l9 13 9-13" fill="#5e6c59" />
              <text x="298" y="68" textAnchor="middle" fill="#fffdfa" fontSize="13">ICT밸리 컨벤션</text>
              <text x="298" y="88" textAnchor="middle" fill="#f0f1eb" fontSize="11">A동 B1 그랑데홀</text>
              <text x="22" y="260" fontSize="9" fill="#958b80">위치 안내용 약도</text>
            </svg>
            <span>지도에서 자세히 보기 <span aria-hidden="true">↗</span></span>
          </a>
          <div className={styles.mapButtons}>
            <a href={`https://map.naver.com/p/search/${venueQuery}`} target="_blank" rel="noreferrer"><span className={styles.naverDot}>N</span> 네이버지도</a>
            <a href={kakaoMap} target="_blank" rel="noreferrer"><span className={styles.kakaoDot} aria-hidden="true">●</span> 카카오맵</a>
          </div>
          <div className={styles.directions}>
            <div><span className={styles.directionIcon} aria-hidden="true">01</span><div><h3>지하철</h3><p>수인분당선 · 에버라인 <strong>기흥역</strong> 하차<br />2번 출구에서 도보 400m</p></div></div>
            <div><span className={styles.directionIcon} aria-hidden="true">02</span><div><h3>셔틀버스</h3><p>기흥역 <strong>1번 출구</strong>에서 승차<br /><strong>15분 간격</strong>으로 운행합니다.</p></div></div>
            <div><span className={styles.directionIcon} aria-hidden="true">03</span><div><h3>자가용 · 주차</h3><p>내비게이션에 ‘기흥 ICT밸리 컨벤션’ 검색<br /><strong>주말 무료 주차</strong> · 별도 주차 정산이 필요 없습니다.</p></div></div>
            <details className={styles.transportDetails}><summary>버스 노선 안내 <span aria-hidden="true">＋</span></summary><div><h4>세종그랑시아 정류장 하차</h4><p>일반 690<br />마을 17, 18, 28, 28-1, 28-2, 38-1, 53, 54, 80<br />공항 8165, 8852</p><h4>기흥역 정류장 하차</h4><p>일반 10, 55, 66, 66-4, 94, 690, 820<br />직행 5000A, 5000B, 5001, 5003A, 5003B, 5005, 5600<br />시외 8326, 8342, 8343, 8366, 8543, 8839, 8862<br />마을 33, 33-2, 51, 53-1</p></div></details>
          </div>
          <div className={styles.charter}><span className={styles.eyebrow}>FOR OUR GUESTS</span><h3>김해에서 함께 오시는 분들께</h3><p>신부측 하객을 위한 전세버스를 운행합니다.</p><dl><div><dt>출발</dt><dd>예식 당일 오전 5시 · 김해시청</dd></div><div><dt>차량</dt><dd>경남76바 2112</dd></div></dl><a href="tel:01028999000">기사님께 전화하기 <span aria-hidden="true">↗</span></a></div>
        </section>

        <section className={`${styles.section} ${styles.giftsSection}`} id="gifts"><GiftSection /></section>

        <footer>
          <div className={styles.closingPhoto}><Image src="/love/photos/photo-08.webp" alt="꽃으로 둘러싸인 문 앞에 함께 앉은 두 사람" width={1800} height={1200} sizes="(max-width: 480px) 100vw, 480px" /><p>가장 예쁜 날,<br />소중한 분들을 초대합니다.</p></div>
          <div className={styles.closing}><p className={styles.closingScript}>With love, always.</p><p>보내주시는 따뜻한 마음,<br />오래도록 간직하며 잘 살겠습니다.</p><span>상혁 <i>&</i> 은정</span><ShareInvitation /><small>SANGHYEOK & EUNJEONG · 2027. 03. 06</small></div>
        </footer>
      </main>
    </div>
  );
}

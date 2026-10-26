import type { Metadata, Viewport } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import PhotoGallery from "./PhotoGallery";
import InvitationCover from "./InvitationCover";
import FlowerGuide from "./FlowerGuide";
import VenueMap from "./VenueMap";
import GiftSection, { ContactSection } from "./ContactAndGifts";
import SpringPetals from "./SpringPetals";
import RsvpSection from "./RsvpSection";
import { CopyAddress, Countdown, ShareInvitation } from "./InvitationTools";
import { getWeddingStorageOrigin } from "./storage-config";
import styles from "./love.module.css";

const GuestMemories = dynamic(() => import("./GuestMemories"));

const title = "상혁 그리고 은정, 결혼합니다";
const description = "2027년 3월 6일 토요일 오전 11시 · 기흥 ICT밸리 컨벤션 A동 B1 그랑데홀. 가장 예쁜 날, 소중한 분들을 초대합니다.";

const kakaoMap = "https://map.kakao.com/link/map/641722539";
const tmapDirections = `https://www.tmap.co.kr/tmap2/mobile/route.jsp?goalx=127.11936204753891&goaly=37.280228777533445&goalname=${encodeURIComponent("기흥 ICT밸리 컨벤션")}`;

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
  const storageOrigin = getWeddingStorageOrigin();
  return (
    <div className={styles.backdrop}>
      <aside className={styles.desktopNote} aria-hidden="true"><span>A DAY TO REMEMBER</span><p>S <i>&</i> E</p><div /><small>MARCH 6, 2027</small><span>우리의 시작에 초대합니다.</span></aside>
      <main className={styles.invitation} id="top">
        <SpringPetals />
        <a className={styles.skipLink} href="#wedding-day">예식 안내로 바로가기</a>
        <InvitationCover guestsEnabled={Boolean(storageOrigin)} />

        <section className={`${styles.section} ${styles.letter}`} id="invitation">
          <p className={styles.letterLead} aria-hidden="true">A lifetime,<br /><i>together.</i></p>
          <SectionHeading eyebrow="INVITATION">저희, 결혼합니다</SectionHeading>
          <div className={styles.letterText}>
            <p>서로 다른 계절을 걷던 두 사람이<br />같은 봄을 맞이하려 합니다.<br />마주 앉아 웃던 작은 순간들이 모여<br />이제, 평생을 함께할 약속이 되었습니다.</p>
            <p>꽃이 피기 시작하는 3월,<br />저희의 첫 봄날에 함께해 주세요.<br />반가운 얼굴로 마주할 그날을<br />설레는 마음으로 기다릴게요.</p>
          </div>
          <div className={styles.family}>
            <p><span className={styles.familyParents}><small>故</small> 박종신 · 김명순</span><span className={styles.relation}>의 장남</span><strong className={styles.familyName}>상혁</strong></p>
            <p><span className={styles.familyParents}>최준호 · 조은희</span><span className={styles.relation}>의 차녀</span><strong className={styles.familyName}>은정</strong></p>
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
                return <td key={day}>{date >= 1 && date <= 31 ? date === 6 ? <span className={styles.weddingDate} aria-label="6일, 결혼식"><svg viewBox="0 0 40 38" aria-hidden="true"><path d="M20 35S2 24 2 12A10 10 0 0 1 20 6a10 10 0 0 1 18 6c0 12-18 23-18 23Z" fill="currentColor" /></svg><span>6</span></span> : <span>{date}</span> : null}</td>;
              })}</tr>)}</tbody>
            </table>
          </div>
          <Countdown />
          <a className={styles.outlineButton} href="/love/wedding.ics" download="상혁-은정-결혼식.ics"><span aria-hidden="true">＋</span> 캘린더에 저장하기</a>
        </section>

        <section className={`${styles.section} ${styles.gallerySection}`} id="gallery">
          <SectionHeading eyebrow="MOMENTS OF US">함께한 순간들</SectionHeading>
          <p className={styles.sectionCaption}>같은 곳을 바라보고, 함께 웃었던 날들.<br />그 순간들을 살며시 꺼내 놓습니다.</p>
          <PhotoGallery />
        </section>

        <section className={`${styles.section} ${styles.locationSection}`} id="location">
          <SectionHeading eyebrow="LOCATION">오시는 길</SectionHeading>
          <h3 className={styles.venueName}>기흥 ICT밸리 컨벤션</h3>
          <p className={styles.hall}>A동 B1 그랑데홀</p>
          <p className={styles.address}>경기 용인시 기흥구 기흥로 58-1<br /><span>(구갈동 679)</span></p>
          <div className={styles.locationActions}><CopyAddress /><a className={styles.venuePhone} href="tel:0316303600">예식장 전화 <span aria-hidden="true">↗</span></a></div>
          <VenueMap />
          <div className={styles.mapButtons}>
            <a href="https://map.naver.com/v5/entry/place/1211919556" target="_blank" rel="noreferrer"><span className={styles.naverDot}>N</span> 네이버지도</a>
            <a href={kakaoMap} target="_blank" rel="noreferrer"><span className={styles.kakaoDot} aria-hidden="true">●</span> 카카오맵</a>
            <a href={tmapDirections} target="_blank" rel="noreferrer" aria-label="티맵으로 기흥 ICT밸리 컨벤션 길찾기"><span className={styles.tmapDot} aria-hidden="true">T</span> 티맵 길찾기</a>
          </div>
          <p className={styles.mapHint}>티맵 길찾기는 휴대폰의 티맵 앱으로 연결됩니다.</p>
          <div className={styles.directions}>
            <div><span className={styles.directionIcon} aria-hidden="true">01</span><div><h3>지하철</h3><p>수인분당선 · 에버라인 <strong>기흥역</strong> 하차<br />2번 출구에서 도보 400m</p></div></div>
            <div><span className={styles.directionIcon} aria-hidden="true">02</span><div><h3>셔틀버스</h3><p>기흥역 <strong>1번 출구</strong>에서 승차<br /><strong>15분 간격</strong>으로 운행합니다.</p></div></div>
            <div><span className={styles.directionIcon} aria-hidden="true">03</span><div><h3>자가용 · 주차</h3><p>내비게이션에 ‘기흥 ICT밸리 컨벤션’ 검색<br /><strong>주말 무료 주차</strong> · 별도 주차 정산이 필요 없습니다.</p></div></div>
            <details className={styles.transportDetails}><summary>버스 노선 안내 <span aria-hidden="true">＋</span></summary><div><h4>세종그랑시아 정류장 하차</h4><p>일반 690<br />마을 17, 18, 28, 28-1, 28-2, 38-1, 53, 54, 80<br />공항 8165, 8852</p><h4>기흥역 정류장 하차</h4><p>일반 10, 55, 66, 66-4, 94, 690, 820<br />직행 5000A, 5000B, 5001, 5003A, 5003B, 5005, 5600<br />시외 8326, 8342, 8343, 8366, 8543, 8839, 8862<br />마을 33, 33-2, 51, 53-1</p></div></details>
          </div>
          <div className={styles.charter}><span className={styles.eyebrow}>FOR OUR GUESTS</span><h3>김해에서 함께 오시는 분들께</h3><p>신부측 하객을 위한 전세버스를 운행합니다.</p><dl><div><dt>출발</dt><dd>예식 당일 오전 5시 · 김해시청</dd></div><div><dt>차량</dt><dd>경남76바 2112</dd></div></dl><a href="tel:01028999000">기사님께 전화하기 <span aria-hidden="true">↗</span></a></div>
        </section>

        <section className={`${styles.section} ${styles.giftsSection}`} id="gifts"><GiftSection /><FlowerGuide /></section>

        {storageOrigin ? <><RsvpSection apiBaseUrl={storageOrigin} /><GuestMemories apiBaseUrl={storageOrigin} /></> : null}

        <footer>
          <div className={styles.closingPhoto}><Image src="/love/photos/photo-08.webp" alt="꽃으로 둘러싸인 문 앞에 함께 앉은 두 사람" width={1800} height={1200} sizes="(max-width: 480px) 100vw, 480px" /><p>봄이 시작되는 날,<br />우리의 이야기도 새로 시작됩니다.</p></div>
          <div className={styles.closing}><p className={styles.closingScript}>With love, always.</p><p>그날의 웃음과 봄의 온기를<br />오래오래 꺼내 보며 살겠습니다.<br />저희의 봄에 함께해 주셔서 고맙습니다.</p><span>상혁 <i>&</i> 은정</span><ShareInvitation /><small>SangHyeok & EunJung · 2027. 03. 06</small></div>
        </footer>
      </main>
    </div>
  );
}

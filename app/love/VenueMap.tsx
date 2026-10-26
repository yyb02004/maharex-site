import Image from "next/image";
import NaverVenueMap from "./NaverVenueMap";
import styles from "./love.module.css";

export default function VenueMap() {
  return (
    <div className={styles.venueMap}>
      <div className={styles.mapHeader}>
        <svg width="20" height="24" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M21 10c0 7-9 15-9 15S3 17 3 10a9 9 0 1 1 18 0Z" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.3" /></svg>
        <div><strong>기흥 ICT밸리 컨벤션</strong><span>A동 B1 그랑데홀</span></div>
      </div>
      <NaverVenueMap />
      <a className={styles.mapCaption} href="https://map.naver.com/v5/entry/place/1211919556" target="_blank" rel="noreferrer">네이버지도에서 크게 보기 <span aria-hidden="true">↗</span></a>
      <details className={styles.officialMap}>
        <summary>예식장 상세 약도 <span aria-hidden="true">＋</span></summary>
        <a href="/love/venue-map.jpg" target="_blank" rel="noreferrer" aria-label="예식장 공식 약도 크게 보기">
          <Image src="/love/venue-map.jpg" alt="기흥 ICT밸리 컨벤션 공식 약도. 기흥역 2번 출구에서 도보 400m, 세종그랑시아를 지나 A동 로비로 오세요." width={800} height={660} sizes="(max-width: 480px) 85vw, 414px" />
          <span>약도를 누르면 크게 볼 수 있어요.</span>
        </a>
      </details>
    </div>
  );
}

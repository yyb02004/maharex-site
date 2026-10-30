import styles from "./guest-guide.module.css";

export default function GuestGuide() {
  return (
    <section className={styles.section} id="guest-guide" aria-labelledby="guest-guide-title">
      <header className={styles.heading} data-reveal>
        <p>WEDDING GUIDE</p>
        <h2 id="guest-guide-title">함께하실 분들께</h2>
        <div>저희의 봄을 만나러 오시는 길,<br />편안히 머무실 수 있도록 준비했어요.</div>
      </header>

      <div className={styles.dining} data-reveal>
        <div className={styles.place}>
          <span className={styles.floor} aria-hidden="true">2F</span>
          <div><h3>식사와 웰컴드링크</h3><p>2층 연회장</p></div>
        </div>
        <p className={styles.mealTime} aria-label="식사 시간 오전 10시 30분부터 오후 1시까지">
          <time dateTime="10:30">10:30</time><span aria-hidden="true">—</span><time dateTime="13:00">13:00</time>
        </p>
        <p className={styles.copy}>예식은 <strong>오전 11시</strong>에 시작해요.<br />두 사람의 첫걸음도 함께해 주세요.</p>
        <p className={styles.welcome}>조금 일찍 도착하셨다면,<br /><strong>2층에서 웰컴드링크</strong>를 즐기며<br />반가운 분들과 인사를 나누세요.</p>
      </div>

      <div className={styles.tickets} data-reveal>
        <h3>식권 안내</h3>
        <p className={styles.copy}>식권은 출생연도에 따라 구분해 드려요.</p>
        <dl className={styles.ticketList}>
          <div><dt>2022년생 이후</dt><dd>무료 입장<small>식권 없이 입장해 주세요</small></dd></div>
          <div><dt>2018~2021년생</dt><dd>소인 식권</dd></div>
          <div><dt>2017년생 이전</dt><dd>대인 식권</dd></div>
        </dl>
      </div>

      <div className={styles.atm} data-reveal>
        <div className={styles.place}>
          <span className={styles.floor} aria-hidden="true">B1</span>
          <div><h3>ATM 안내</h3><p>지하 1층 식장 입구 왼쪽</p></div>
        </div>
        <p className={styles.copy}>입구로 들어오시면 왼쪽에<br />현금인출기 2대가 마련되어 있어요.</p>
      </div>

      <p className={styles.closing} data-reveal>귀한 걸음으로 채워 주실 우리의 봄,<br />반가운 마음으로 기다릴게요.</p>
    </section>
  );
}

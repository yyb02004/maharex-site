"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import styles from "./guests.module.css";

type GuestEntry = { id: string; name: string; message: string; createdAt: string };
type GuestPhoto = { id: string; name: string; caption: string; url: string; thumbnailUrl: string; width: number; height: number; createdAt: string };
type UploadLimits = { maxUploadBytes: number; maxFilesPerBatch: number; maxPhotoCount: number; maxStorageBytes: number; maxImagePixels: number };
type QueuedPhoto = { key: number; file: File };

class ApiError extends Error {}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid response");
  return value as Record<string, unknown>;
}

function stringField(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid response");
  return value;
}

function parseEntry(value: unknown): GuestEntry {
  const item = record(value);
  return { id: stringField(item.id), name: stringField(item.name), message: stringField(item.message), createdAt: stringField(item.createdAt) };
}

function parsePhoto(value: unknown): GuestPhoto {
  const item = record(value);
  if (typeof item.width !== "number" || typeof item.height !== "number" || !Number.isFinite(item.width) || !Number.isFinite(item.height) || item.width <= 0 || item.height <= 0) throw new Error("Invalid response");
  return { id: stringField(item.id), name: stringField(item.name), caption: stringField(item.caption), url: stringField(item.url), thumbnailUrl: stringField(item.thumbnailUrl), width: item.width, height: item.height, createdAt: stringField(item.createdAt) };
}

function endpoint(base: string, path: string) { return new URL(path, `${base.replace(/\/$/, "")}/`).href; }

function photoUrl(base: string, path: string) {
  try {
    const origin = new URL(base);
    const url = new URL(path, `${base.replace(/\/$/, "")}/`);
    return ["https:", "http:"].includes(url.protocol) && url.origin === origin.origin && url.pathname.startsWith("/media/") && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

async function request(base: string, path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const mutation = !!init.method && init.method !== "GET";
  const timer = window.setTimeout(abort, mutation ? 120_000 : 25_000);
  try {
    const response = await fetch(endpoint(base, path), { ...init, cache: "no-store", credentials: "omit", signal: controller.signal });
    if (response.status === 204) return null;
    let data: unknown;
    try { data = await response.json(); } catch { throw new ApiError(mutation ? "처리 결과를 확인하지 못했어요. 새로고침으로 확인해 주세요." : "지금은 내용을 불러올 수 없어요. 잠시 후 다시 시도해 주세요."); }
    if (!response.ok) {
      const error = record(data).error;
      throw new ApiError(typeof error === "string" && error ? error : "요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (error instanceof ApiError) throw error;
    throw new ApiError(mutation ? "처리 결과를 확인하지 못했어요. 새로고침으로 확인한 뒤 다시 시도해 주세요." : "잠시 연결이 어려워요. 조금 뒤 다시 불러와 주세요.");
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

function failureMessage(error: unknown, mutation = false) {
  return error instanceof ApiError ? error.message : mutation ? "처리 결과를 확인하지 못했어요. 새로고침으로 확인해 주세요." : "내용을 불러오지 못했어요. 다시 불러와 주세요.";
}

function useRemoteList<T extends { id: string }>(base: string, path: string, limit: number, parse: (value: unknown) => T, enabled: boolean) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const load = useCallback(async (more = false) => {
    if (!enabled || busy.current || (more && !cursorRef.current)) return;
    const controller = new AbortController();
    abortRef.current = controller;
    busy.current = true;
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ limit: String(limit) });
    if (more && cursorRef.current) query.set("before", cursorRef.current);
    try {
      const data = record(await request(base, `${path}?${query}`, {}, controller.signal));
      if (!Array.isArray(data.items) || (data.nextCursor !== null && typeof data.nextCursor !== "string")) throw new Error("Invalid response");
      const nextItems = data.items.map(parse);
      setItems((current) => Array.from(new Map([...(more ? current : []), ...nextItems].map((item) => [item.id, item])).values()));
      cursorRef.current = data.nextCursor;
      setCursor(data.nextCursor);
      setLoaded(true);
    } catch (error) {
      if (!controller.signal.aborted) setError(failureMessage(error));
    } finally {
      if (abortRef.current === controller) {
        busy.current = false;
        setLoading(false);
      }
    }
  }, [base, enabled, limit, parse, path]);

  useEffect(() => {
    void load();
    return () => { abortRef.current?.abort(); busy.current = false; };
  }, [load]);

  const prepend = (item: T) => setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  return { items, cursor, loading, loaded, error, load, prepend, remove };
}

function useModal(open: boolean, dialogRef: RefObject<HTMLDialogElement | null>, focusRef: RefObject<HTMLElement | null>, returnFocus: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const body = document.body;
    const root = document.documentElement;
    const x = window.scrollX;
    const y = window.scrollY;
    const previous = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, left: body.style.left, width: body.style.width, paddingRight: body.style.paddingRight };
    const scrollbar = window.innerWidth - root.clientWidth;
    const padding = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, { overflow: "hidden", position: "fixed", top: `-${y}px`, left: `-${x}px`, width: "100%" });
    if (scrollbar > 0) body.style.paddingRight = `${padding + scrollbar}px`;
    if (!dialog.open) dialog.showModal();
    focusRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      Object.assign(body.style, previous);
      const behavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(x, y);
      root.style.scrollBehavior = behavior;
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
    };
  }, [open, dialogRef, focusRef, returnFocus]);
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(date);
}

function RefreshIcon() {
  return <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16.4 8a6.5 6.5 0 1 0 .1 4M16.5 3.5v5h-5" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

export default function GuestMemories({ apiBaseUrl }: { apiBaseUrl: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [limits, setLimits] = useState<UploadLimits | null>(null);
  const [originalPhotos, setOriginalPhotos] = useState(false);
  const [healthError, setHealthError] = useState("");
  const [healthLoading, setHealthLoading] = useState(false);
  const book = useRemoteList(apiBaseUrl, "/api/guestbook", 6, parseEntry, active);
  const photos = useRemoteList(apiBaseUrl, "/api/photos", 12, parsePhoto, active);
  const [writing, setWriting] = useState(false);
  const [writeStatus, setWriteStatus] = useState("");
  const [writeError, setWriteError] = useState("");
  const [deleteEntry, setDeleteEntry] = useState<GuestEntry | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteInput = useRef<HTMLInputElement>(null);
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const bookRefresh = useRef<HTMLButtonElement>(null);
  const [openPhoto, setOpenPhoto] = useState<GuestPhoto | null>(null);
  const photoDialog = useRef<HTMLDialogElement>(null);
  const photoClose = useRef<HTMLButtonElement>(null);
  const photoTrigger = useRef<HTMLElement | null>(null);
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const queueSequence = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const prefix = useId();
  const maxBatch = Math.min(10, limits?.maxFilesPerBatch ?? 10);
  const maxMegabytes = limits ? Math.round(limits.maxUploadBytes / (1024 * 1024)) : 15;
  useModal(deleteEntry !== null, deleteDialog, deleteInput, deleteTrigger);
  useModal(openPhoto !== null, photoDialog, photoClose, photoTrigger);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!("IntersectionObserver" in window)) { setActive(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setActive(true); observer.disconnect(); }
    }, { rootMargin: "180px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const loadHealth = useCallback(async (signal?: AbortSignal) => {
    setHealthLoading(true);
    setHealthError("");
    try {
      const data = record(await request(apiBaseUrl, "/api/health", {}, signal));
      const values = record(data.limits);
      const keys = ["maxUploadBytes", "maxFilesPerBatch", "maxPhotoCount", "maxStorageBytes", "maxImagePixels"] as const;
      if (data.ok !== true || keys.some((key) => typeof values[key] !== "number" || !Number.isFinite(values[key]) || (values[key] as number) <= 0)) throw new Error("Invalid response");
      setLimits(values as UploadLimits);
      setOriginalPhotos(!!data.features && record(data.features).originalPhotos === true);
    } catch (error) {
      if (!signal?.aborted) { setLimits(null); setHealthError(failureMessage(error)); }
    } finally { if (!signal?.aborted) setHealthLoading(false); }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    void loadHealth(controller.signal);
    return () => controller.abort();
  }, [active, loadHealth]);

  async function writeMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (writing || book.loading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!name || name.length > 40 || !message || message.length > 500 || password.length < 4 || password.length > 64) { setWriteError("이름, 축하 글, 4자 이상의 비밀번호를 확인해 주세요."); return; }
    setWriting(true); setWriteError(""); setWriteStatus("");
    try {
      const result = record(await request(apiBaseUrl, "/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, message, password }) }));
      book.prepend(parseEntry(result.item));
      form.reset();
      setWriteStatus("축하의 마음을 남겼어요. 고맙습니다.");
    } catch (error) { setWriteError(failureMessage(error, true)); }
    finally { setWriting(false); }
  }

  async function deleteMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteEntry || deleting) return;
    setDeleting(true); setDeleteError("");
    try {
      await request(apiBaseUrl, `/api/guestbook/${encodeURIComponent(deleteEntry.id)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: deletePassword }) });
      book.remove(deleteEntry.id);
      setWriteStatus("작성하신 축하 글을 삭제했어요.");
      deleteTrigger.current = bookRefresh.current;
      setDeleteEntry(null);
    } catch (error) { setDeleteError(failureMessage(error, true)); }
    finally { setDeleting(false); }
  }

  function selectFiles(files: FileList | null) {
    if (!files || !limits || uploading) return;
    const selected = Array.from(files);
    setUploadError(""); setUploadStatus(""); setUploadProgress(null);
    if (queue.length + selected.length > maxBatch) { setUploadError(`사진은 한 번에 ${maxBatch}장까지 선택할 수 있어요.`); return; }
    for (const file of selected) {
      const supported = file.type ? ["image/jpeg", "image/png", "image/webp"].includes(file.type) : /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!supported) { setUploadError("JPG, PNG, WebP 사진을 선택해 주세요. HEIC 사진은 JPG로 바꿔 주세요."); return; }
      if (!file.size || file.size > limits.maxUploadBytes) { setUploadError(`사진 한 장의 크기는 ${maxMegabytes}MB 이하여야 해요.`); return; }
    }
    setQueue((current) => [...current, ...selected.map((file) => ({ key: ++queueSequence.current, file }))]);
  }

  async function uploadPhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading || !limits || photos.loading || !queue.length) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    const caption = String(fields.get("caption") ?? "").trim();
    if (!name || name.length > 40 || caption.length > 200 || fields.get("consent") !== "true") { setUploadError("이름과 사진 공개 동의를 확인해 주세요."); return; }
    const pending = [...queue];
    let done = 0;
    setUploading(true); setUploadError(""); setUploadStatus(""); setUploadProgress({ done, total: pending.length });
    try {
      for (const entry of pending) {
        const body = new FormData();
        body.set("file", entry.file); body.set("name", name); body.set("caption", caption); body.set("consent", "true");
        if (originalPhotos) body.set("originalConsent", "true");
        const result = record(await request(apiBaseUrl, "/api/photos", { method: "POST", body }));
        photos.prepend(parsePhoto(result.item));
        setQueue((current) => current.filter((item) => item.key !== entry.key));
        done += 1;
        setUploadProgress({ done, total: pending.length });
      }
      form.reset();
      setUploadStatus(`${done}장의 사진을 함께 나눴어요. 고맙습니다.`);
    } catch (error) {
      setUploadError(failureMessage(error, true));
      setUploadStatus(done ? `${done}장 등록 완료. 확인되지 않은 사진은 선택 목록에 남겨 두었어요.` : "확인되지 않은 사진은 선택 목록에 남겨 두었어요.");
    } finally { setUploading(false); }
  }

  return (
    <div ref={sectionRef} className={styles.memories}>
      <section id="guestbook" className={styles.section} aria-labelledby={`${prefix}-book-title`}>
        <p className={styles.eyebrow} data-reveal>WITH LOVE</p>
        <h2 id={`${prefix}-book-title`} className={styles.title} data-reveal>우리에게 보내는 편지</h2>
        <p className={styles.intro} data-reveal>두 사람에게 들려주고 싶은 말을 남겨 주세요.<br />문득 오늘이 그리워지는 날,<br />한 줄 한 줄 다시 펼쳐 볼게요.</p>
        <details className={styles.composer}>
          <summary className={styles.summary}>축하 글 남기기 <span aria-hidden="true">＋</span></summary>
          <form className={styles.form} onSubmit={writeMessage} aria-busy={writing}>
            <fieldset disabled={writing}>
              <label htmlFor={`${prefix}-book-name`}>이름</label>
              <input id={`${prefix}-book-name`} name="name" autoComplete="name" required maxLength={40} />
              <label htmlFor={`${prefix}-book-message`}>축하 글</label>
              <textarea id={`${prefix}-book-message`} name="message" required maxLength={500} rows={4} aria-describedby={`${prefix}-book-note`} />
              <label htmlFor={`${prefix}-book-password`}>삭제용 비밀번호</label>
              <input id={`${prefix}-book-password`} name="password" type="password" autoComplete="new-password" required minLength={4} maxLength={64} aria-describedby={`${prefix}-book-note`} />
              <p id={`${prefix}-book-note`} className={styles.note}>이름과 축하 글은 모두에게 공개됩니다.<br />비밀번호는 4자 이상이며, 글을 삭제할 때 필요해요.</p>
              <button className={styles.primaryButton} type="submit" disabled={writing || book.loading}>{writing ? "마음을 전하는 중…" : "축하 글 등록"}</button>
            </fieldset>
            {writeError ? <p className={styles.error} role="alert">{writeError}</p> : null}
          </form>
        </details>
        <p className={styles.status} role="status" aria-live="polite">{writeStatus}</p>
        <div className={styles.listToolbar}><span>우리에게 온 마음</span><button ref={bookRefresh} type="button" className={styles.textButton} disabled={!active || book.loading || writing || deleting} onClick={() => void book.load()} aria-label="방명록 새로고침"><RefreshIcon />새로고침</button></div>
        <div aria-busy={book.loading}>
          {book.items.map((item) => <article className={styles.entry} key={item.id}>
            <div className={styles.entryHeader}><h3>{item.name}</h3><time dateTime={item.createdAt}>{dateLabel(item.createdAt)}</time></div>
            <p className={styles.message}>{item.message}</p>
            <button type="button" className={styles.deleteButton} disabled={writing || deleting || book.loading} aria-label={`${item.name} 님의 축하 글 삭제`} onClick={(event) => { deleteTrigger.current = event.currentTarget; setDeletePassword(""); setDeleteError(""); setDeleteEntry(item); }}>삭제</button>
          </article>)}
          {book.loaded && !book.items.length && !book.error ? <p className={styles.empty}>첫 번째 축하의 마음을 남겨 주세요.</p> : null}
        </div>
        {book.loading ? <p className={styles.loading} role="status">축하의 마음을 불러오는 중…</p> : null}
        {book.error ? <div className={styles.connectionError}><p role="status">{book.error}</p><button type="button" className={styles.outlineButton} disabled={book.loading || writing || deleting} onClick={() => void book.load()}>다시 불러오기</button></div> : null}
        {book.cursor ? <button type="button" className={styles.moreButton} disabled={book.loading || writing || deleting} onClick={() => void book.load(true)}>축하 글 더 보기 <span aria-hidden="true">↓</span></button> : null}
      </section>

      <section id="guest-snaps" className={`${styles.section} ${styles.snapsSection}`} aria-labelledby={`${prefix}-snaps-title`}>
        <p className={styles.eyebrow} data-reveal>THROUGH YOUR EYES</p>
        <h2 id={`${prefix}-snaps-title`} className={styles.title} data-reveal>당신이 담은 우리의 날</h2>
        <p className={styles.intro} data-reveal>그날, 여러분의 눈에 담긴 저희는 어떤 모습일까요?<br />웃음 가득한 순간을 함께 남겨 주세요.<br />모두의 시선이 모여 우리의 하루가 완성됩니다.</p>
        <details className={styles.composer}>
          <summary className={styles.summary}>사진 함께 나누기 <span aria-hidden="true">＋</span></summary>
          <form className={styles.form} onSubmit={uploadPhotos} aria-busy={uploading}>
            <fieldset disabled={uploading}>
              <label htmlFor={`${prefix}-photo-name`}>이름</label>
              <input id={`${prefix}-photo-name`} name="name" autoComplete="name" required maxLength={40} />
              <label htmlFor={`${prefix}-photo-caption`}>사진에 담긴 이야기 <span className={styles.optional}>(선택)</span></label>
              <textarea id={`${prefix}-photo-caption`} name="caption" maxLength={200} rows={2} />
              <label htmlFor={`${prefix}-photo-files`}>함께 나눌 사진</label>
              <input ref={fileInput} id={`${prefix}-photo-files`} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple disabled={!limits || healthLoading} aria-describedby={`${prefix}-photo-note`} onChange={(event) => { selectFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
              <p id={`${prefix}-photo-note`} className={styles.note}>JPG · PNG · WebP / 한 번에 최대 {maxBatch}장 / 한 장 {maxMegabytes}MB 이하</p>
              {queue.length ? <ul className={styles.fileList}>{queue.map((item) => <li key={item.key}><span>{item.file.name}</span><button type="button" onClick={() => setQueue((current) => current.filter((entry) => entry.key !== item.key))} aria-label={`${item.file.name} 선택 취소`}>빼기</button></li>)}</ul> : null}
              <label className={styles.consent} htmlFor={`${prefix}-consent`}><input id={`${prefix}-consent`} name="consent" type="checkbox" value="true" required /><span>{originalPhotos ? "사진과 이름의 하객 공개 및 신랑·신부의 원본 보관에 동의합니다." : "올린 사진과 이름이 모든 하객에게 공개되는 데 동의합니다."}</span></label>
              <p className={styles.note}>{originalPhotos ? <>함께 보는 사진은 위치 등 부가정보를 지운 미리보기로 공개해요.<br />원본 파일과 그 안의 촬영 정보는 두 사람이 따로 간직합니다.</> : <>등록한 사진과 이야기는 바로 공개됩니다.<br />사진은 위치 등 부가정보를 제거하고, 보기 좋은 크기의 JPG로 저장해요. 원본 사진은 따로 간직해 주세요.</>}</p>
              <button className={styles.primaryButton} type="submit" disabled={!limits || healthLoading || !queue.length || uploading || photos.loading}>{uploading ? uploadProgress?.done === uploadProgress?.total ? "등록 마무리 중…" : `${(uploadProgress?.done ?? 0) + 1}번째 사진 올리는 중…` : queue.length ? `${queue.length}장 사진 등록` : "사진을 선택해 주세요"}</button>
            </fieldset>
          </form>
          {healthLoading ? <p className={styles.loading} role="status">사진을 올릴 수 있는지 확인하는 중…</p> : null}
          {healthError ? <div className={styles.connectionError}><p role="status">{healthError}</p><button type="button" className={styles.outlineButton} disabled={healthLoading || uploading} onClick={() => void loadHealth()}>연결 다시 확인</button></div> : null}
          {uploadProgress ? <p className={styles.progress} role="status" aria-live="polite">사진 등록 완료 {uploadProgress.done} / {uploadProgress.total}</p> : null}
          {uploadError ? <p className={styles.error} role="alert">{uploadError}</p> : null}
          <p className={styles.status} role="status" aria-live="polite">{uploadStatus}</p>
        </details>
        <div className={`${styles.listToolbar} ${styles.photoToolbar}`}><span>함께 모은 순간</span><button type="button" className={styles.textButton} disabled={!active || photos.loading || uploading} onClick={() => void photos.load()} aria-label="하객 사진 새로고침"><RefreshIcon />새로고침</button></div>
        <div className={styles.photoGrid} aria-busy={photos.loading}>
          {photos.items.map((photo) => <button type="button" className={styles.photoTile} key={photo.id} aria-label={`${photo.name} 님의 사진 크게 보기${photo.caption ? `: ${photo.caption}` : ""}`} onClick={(event) => { photoTrigger.current = event.currentTarget; setOpenPhoto(photo); }}>
            {/* Only media paths on the configured NAS origin may load user uploads. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(apiBaseUrl, photo.thumbnailUrl)} alt={photo.caption || `${photo.name} 님이 담은 결혼식`} width={photo.width} height={photo.height} loading="lazy" decoding="async" />
            <span>{photo.name}</span>
          </button>)}
        </div>
        {photos.loaded && !photos.items.length && !photos.error ? <p className={styles.empty}>함께할 날의 첫 사진을 기다립니다.</p> : null}
        {photos.loading ? <p className={styles.loading} role="status">함께한 순간을 불러오는 중…</p> : null}
        {photos.error ? <div className={styles.connectionError}><p role="status">{photos.error}</p><button type="button" className={styles.outlineButton} disabled={photos.loading || uploading} onClick={() => void photos.load()}>다시 불러오기</button></div> : null}
        {photos.cursor ? <button type="button" className={styles.moreButton} disabled={photos.loading || uploading} onClick={() => void photos.load(true)}>사진 더 보기 <span aria-hidden="true">↓</span></button> : null}
      </section>

      <dialog ref={deleteDialog} className={styles.deleteDialog} aria-labelledby={`${prefix}-delete-title`} aria-describedby={`${prefix}-delete-note`} onCancel={(event) => { if (deleting) event.preventDefault(); }} onClose={() => { if (!deleteDialog.current?.open) setDeleteEntry(null); }}>
        <form onSubmit={deleteMessage} aria-busy={deleting}>
          <h2 id={`${prefix}-delete-title`}>축하 글 삭제</h2>
          <p id={`${prefix}-delete-note`}>글을 남길 때 정한 비밀번호를 입력해 주세요.</p>
          <label htmlFor={`${prefix}-delete-password`}>비밀번호</label>
          <input ref={deleteInput} id={`${prefix}-delete-password`} type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required minLength={4} maxLength={64} autoComplete="off" disabled={deleting} />
          {deleteError ? <p className={styles.error} role="alert">{deleteError}</p> : null}
          <div className={styles.dialogActions}><button type="button" className={styles.outlineButton} disabled={deleting} onClick={() => setDeleteEntry(null)}>취소</button><button type="submit" className={styles.primaryButton} disabled={deleting}>{deleting ? "삭제 중…" : "삭제하기"}</button></div>
        </form>
      </dialog>

      <dialog ref={photoDialog} className={styles.photoDialog} aria-labelledby={`${prefix}-photo-title`} onClose={() => { if (!photoDialog.current?.open) setOpenPhoto(null); }}>
        <div className={styles.photoDialogBar}><h2 id={`${prefix}-photo-title`}>{openPhoto?.name} 님이 담은 순간</h2><button ref={photoClose} type="button" onClick={() => setOpenPhoto(null)} aria-label="사진 닫기">×</button></div>
        {openPhoto ? <figure className={styles.fullPhoto}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(apiBaseUrl, openPhoto.url)} alt={openPhoto.caption || `${openPhoto.name} 님이 담은 결혼식`} width={openPhoto.width} height={openPhoto.height} />
          {openPhoto.caption ? <figcaption>{openPhoto.caption}</figcaption> : null}
        </figure> : null}
      </dialog>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, TouchEvent, UIEvent } from "react";
import photoManifest from "@/public/love/photos/manifest.json";
import styles from "./gallery.module.css";

const photoOrder = [20, 15, 19, 12, 16, 11, 4, 8, 18, 21, 17, 23, 5, 3, 2, 22, 6, 7, 9, 10, 14, 1, 13];
const photos = photoOrder.map((id) => {
  const photo = photoManifest.find((item) => item.id === id);
  if (!photo) throw new Error(`Wedding photograph ${id} is missing.`);
  return photo;
});

function photoPath(photo: number, thumbnail = false) {
  return `/love/photos/${thumbnail ? "thumb" : "photo"}-${String(photo).padStart(2, "0")}.webp`;
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "m9 5 7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PhotoGallery() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const slideIndexRef = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const galleryId = useId();
  const dialogTitleId = useId();
  const isOpen = activeIndex !== null;
  const activePhoto = activeIndex === null ? null : photoOrder[activeIndex];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Keep the same photograph in view when orientation or layout width changes.
    const resizeObserver = new ResizeObserver(() => {
      track.scrollTo({ left: slideIndexRef.current * track.clientWidth, behavior: "auto" });
    });
    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    const thumbnail = strip?.children[slideIndex] as HTMLButtonElement | undefined;
    if (!strip || !thumbnail) return;
    // Scroll only the thumbnail strip, never the surrounding invitation page.
    strip.scrollTo({
      left: thumbnail.offsetLeft - (strip.clientWidth - thumbnail.clientWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [slideIndex]);

  function goToSlide(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const nextIndex = Math.max(0, Math.min(photoOrder.length - 1, index));
    track.scrollTo({
      left: nextIndex * track.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function handleTrackScroll(event: UIEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    if (!track.clientWidth) return;
    const index = Math.max(0, Math.min(photoOrder.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    if (index !== slideIndexRef.current && document.activeElement !== track && track.contains(document.activeElement)) {
      track.focus({ preventScroll: true });
    }
    slideIndexRef.current = index;
    setSlideIndex(index);
  }

  function handleCarouselKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      goToSlide(slideIndex + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      goToSlide(event.key === "Home" ? 0 : photoOrder.length - 1);
    }
  }

  // Only opening or closing runs this effect; changing photographs preserves focus.
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const body = document.body;
    const root = document.documentElement;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const bodyPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = "100%";
    if (scrollbarWidth > 0) body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;

    if (!dialog.open) dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      Object.assign(body.style, previousStyles);
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(scrollX, scrollY);
      root.style.scrollBehavior = previousScrollBehavior;
      if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true });
      touchStartRef.current = null;
    };
  }, [isOpen]);

  function openPhoto(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    suppressClickRef.current = false;
    setActiveIndex(index);
  }

  function closePhoto() {
    dialogRef.current?.close();
  }

  function movePhoto(direction: number) {
    setActiveIndex((current) =>
      current === null ? null : (current + direction + photoOrder.length) % photoOrder.length,
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    suppressClickRef.current = event.touches.length > 1;
    if (event.touches.length !== 1 || (window.visualViewport?.scale ?? 1) > 1.01) {
      touchStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length > 1) {
      touchStartRef.current = null;
      suppressClickRef.current = true;
    }
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.touches.length > 0 || (window.visualViewport?.scale ?? 1) > 1.01) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const distanceX = touch.clientX - start.x;
    const distanceY = touch.clientY - start.y;
    if (Math.abs(distanceX) >= 50 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      suppressClickRef.current = true;
      movePhoto(distanceX < 0 ? 1 : -1);
    }
  }

  function handleStageClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (event.target === event.currentTarget) closePhoto();
  }

  return (
    <div className={styles.gallery} role="region" aria-roledescription="캐러셀" aria-label="우리의 웨딩 사진">
      <div
        ref={trackRef}
        className={styles.track}
        id={galleryId}
        tabIndex={0}
        aria-label="사진 슬라이드. 좌우 방향키로 사진을 넘길 수 있습니다."
        onScroll={handleTrackScroll}
        onKeyDown={handleCarouselKeyDown}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={styles.slide}
            role="group"
            aria-roledescription="슬라이드"
            aria-label={`전체 ${photos.length}장 중 ${index + 1}번째 사진`}
            aria-hidden={index !== slideIndex}
          >
            <button
              type="button"
              className={styles.slideButton}
              aria-label={`${index + 1}번째 웨딩 사진 크게 보기`}
              aria-haspopup="dialog"
              tabIndex={index === slideIndex ? 0 : -1}
              onClick={(event) => openPhoto(index, event.currentTarget)}
            >
              <img
                src={photo.src}
                alt={`두 사람의 웨딩 사진 ${index + 1}`}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.carouselControls}>
        <button type="button" className={styles.carouselButton} aria-label="이전 슬라이드" aria-controls={galleryId} disabled={slideIndex === 0} onClick={() => goToSlide(slideIndex - 1)}>
          <Arrow direction="left" />
        </button>
        <p className={styles.slideCounter} aria-live="polite" aria-atomic="true">
          <span className={styles.srOnly}>전체 {photos.length}장 중 </span>
          <span>{String(slideIndex + 1).padStart(2, "0")}</span>
          <span className={styles.counterDivider} aria-hidden="true">/</span>
          <span aria-hidden="true">{photos.length}</span>
          <span className={styles.srOnly}>번째 사진</span>
        </p>
        <button type="button" className={styles.carouselButton} aria-label="다음 슬라이드" aria-controls={galleryId} disabled={slideIndex === photos.length - 1} onClick={() => goToSlide(slideIndex + 1)}>
          <Arrow direction="right" />
        </button>
      </div>

      <div ref={stripRef} className={styles.thumbnailStrip} aria-label="사진 선택">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className={styles.thumbnail}
            aria-label={`${index + 1}번째 사진 보기`}
            aria-pressed={index === slideIndex}
            aria-controls={galleryId}
            onClick={() => goToSlide(index)}
          >
            <img src={photo.thumb} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" draggable="false" />
          </button>
        ))}
      </div>
      <p className={styles.galleryHint}>좌우로 넘겨보세요. 사진을 누르면 크게 볼 수 있어요.</p>

      <dialog
        ref={dialogRef}
        className={styles.viewerDialog}
        aria-labelledby={dialogTitleId}
        onClose={() => {
          // A Strict Mode effect can reopen the dialog before an earlier close event arrives.
          if (!dialogRef.current?.open) setActiveIndex(null);
        }}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePhoto();
        }}
      >
        <div className={styles.viewerShell}>
          <div className={styles.viewerHeader}>
            <h3 className={styles.viewerTitle} id={dialogTitleId}>우리의 소중한 순간</h3>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.viewerButton}
              aria-label="사진 닫기"
              onClick={closePhoto}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div
            className={styles.imageStage}
            onClick={handleStageClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => { touchStartRef.current = null; }}
          >
            {activePhoto !== null ? (
              <img
                className={styles.fullImage}
                src={photoPath(activePhoto)}
                alt={`웨딩 사진 ${activePhoto}`}
                decoding="async"
                draggable="false"
              />
            ) : null}
          </div>

          <div className={styles.viewerFooter}>
            <div className={styles.navigation}>
              <button type="button" className={styles.viewerButton} aria-label="이전 사진" onClick={() => movePhoto(-1)}>
                <Arrow direction="left" />
              </button>
              <p className={styles.counter} aria-live="polite" aria-atomic="true">
                <span className={styles.srOnly}>전체 {photoOrder.length}장 중 </span>
                {activeIndex === null ? 1 : activeIndex + 1}
                <span aria-hidden="true"> / {photoOrder.length}</span>
                <span className={styles.srOnly}>번째 사진</span>
              </p>
              <button type="button" className={styles.viewerButton} aria-label="다음 사진" onClick={() => movePhoto(1)}>
                <Arrow direction="right" />
              </button>
            </div>
            <p className={styles.swipeHint}>좌우로 넘겨 우리의 순간들을 만나보세요</p>
          </div>
        </div>
      </dialog>
    </div>
  );
}

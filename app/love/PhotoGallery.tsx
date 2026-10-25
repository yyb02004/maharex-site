"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, TouchEvent } from "react";
import styles from "./gallery.module.css";

const photoOrder = [20, 15, 19, 12, 16, 11, 4, 8, 18, 21, 17, 23, 5, 3, 2, 22, 6, 7, 9, 10, 14, 1, 13];
const previewCount = 6;

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
  const [expanded, setExpanded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const galleryId = useId();
  const dialogTitleId = useId();
  const isOpen = activeIndex !== null;
  const activePhoto = activeIndex === null ? null : photoOrder[activeIndex];
  const visiblePhotos = expanded ? photoOrder : photoOrder.slice(0, previewCount);

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
    <div className={styles.gallery}>
      <div className={styles.grid} id={galleryId}>
        {visiblePhotos.map((photo, index) => (
          <button
            key={photo}
            type="button"
            className={styles.thumbnail}
            aria-label={`웨딩 사진 ${photo} 크게 보기`}
            aria-haspopup="dialog"
            onClick={(event) => openPhoto(index, event.currentTarget)}
          >
            <img
              src={photoPath(photo, true)}
              alt={`웨딩 사진 ${photo}`}
              width="360"
              height="480"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.expandButton}
        aria-expanded={expanded}
        aria-controls={galleryId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{expanded ? "사진 접기" : "모든 사진 보기"}</span>
        <span className={styles.photoCount} aria-label={`전체 ${photoOrder.length}장`}>{photoOrder.length}</span>
        <svg className={styles.expandIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d={expanded ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>

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

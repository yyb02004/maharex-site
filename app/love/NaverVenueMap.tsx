"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./love.module.css";

// Venue coordinates from its official location guide; longitude follows latitude.
const venue = { lat: 37.280228777533445, lng: 127.11936204753891 };
const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

export default function NaverVenueMap() {
  const mapElement = useRef<HTMLDivElement>(null);
  const authFailed = useRef(false);
  const [nearby, setNearby] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const mapWindow = window as Window & { navermap_authFailure?: () => void };
    const previous = mapWindow.navermap_authFailure;
    const onAuthFailure = () => { authFailed.current = true; setMapState("error"); };
    mapWindow.navermap_authFailure = onAuthFailure;
    return () => {
      if (mapWindow.navermap_authFailure === onAuthFailure) mapWindow.navermap_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    const element = mapElement.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) { setNearby(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: "600px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearby || !clientId || scriptReady) return;
    const timeout = window.setTimeout(() => setMapState("error"), 12000);
    return () => window.clearTimeout(timeout);
  }, [nearby, scriptReady]);

  useEffect(() => {
    const element = mapElement.current;
    const maps = window.naver?.maps;
    if (!scriptReady || !element) return;
    if (!maps) { setMapState("error"); return; }

    const cleanup: (() => void)[] = [];
    const dispose = () => { cleanup.splice(0).reverse().forEach((release) => release()); };
    try {
      const center = new maps.LatLng(venue.lat, venue.lng);
      const map = new maps.Map(element, {
        center,
        zoom: 16,
        minZoom: 11,
        maxZoom: 20,
        scrollWheel: false,
        draggable: false,
        pinchZoom: false,
        keyboardShortcuts: false,
        zoomControl: true,
        zoomControlOptions: { position: maps.Position.RIGHT_CENTER, style: maps.ZoomControlStyle.SMALL },
        scaleControl: true,
      });
      cleanup.push(() => map.destroy());
      const marker = new maps.Marker({
        map,
        position: center,
        title: "기흥 ICT밸리 컨벤션 · A동 B1 그랑데홀",
        icon: {
          content: `<div class="${styles.venueMarker}"><span>기흥 ICT밸리 컨벤션</span><small>A동 B1 그랑데홀</small><i></i></div>`,
          anchor: new maps.Point(83, 68),
        },
      });
      cleanup.push(() => marker.setMap(null));
      const resize = new ResizeObserver(() => {
        map.setSize(new maps.Size(element.clientWidth, element.clientHeight));
        map.setCenter(center);
      });
      cleanup.push(() => resize.disconnect());
      resize.observe(element);
      if (!authFailed.current) setMapState("ready");
    } catch {
      dispose();
      setMapState("error");
    }
    return () => dispose();
  }, [scriptReady]);

  return (
    <div className={styles.mapCanvas}>
      {nearby && clientId ? <Script id="wedding-naver-map-sdk" src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setMapState("error")} /> : null}
      <div ref={mapElement} className={styles.mapFrame} role="region" aria-label="기흥 ICT밸리 컨벤션 네이버지도" />
      {mapState !== "ready" ? <div className={styles.mapStatus} role="status">
        {!clientId || mapState === "error" ? <><p>지도를 바로 열어 위치를 확인해 주세요.</p><a href="https://map.naver.com/v5/entry/place/1211919556" target="_blank" rel="noreferrer">네이버지도 열기 ↗</a></> : <p>네이버지도를 불러오고 있어요.</p>}
      </div> : null}
    </div>
  );
}

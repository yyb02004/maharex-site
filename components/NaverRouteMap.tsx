"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Coordinate, MAHAREX_ADDRESS } from "@/lib/naver-route-config";

declare global {
  interface Window {
    naver?: {
      maps: any;
    };
    __initMaharexNaverMap?: () => void;
  }
}

export function NaverRouteMap() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [resolvedCoord, setResolvedCoord] = useState<Coordinate | null>(null);
  const [mapError, setMapError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(MAHAREX_ADDRESS)}`;

  useEffect(() => {
    window.__initMaharexNaverMap = () => {
      setScriptReady(true);
    };

    if (window.naver?.maps) {
      setScriptReady(true);
    }

    return () => {
      delete window.__initMaharexNaverMap;
    };
  }, []);

  useEffect(() => {
    if (!clientId || !scriptReady || !mapElementRef.current || !window.naver?.maps) return;

    try {
      const maps = window.naver.maps;

      if (!mapRef.current) {
        mapRef.current = new maps.Map(mapElementRef.current, {
          center: new maps.LatLng(37.05, 127.25),
          zoom: 15,
          minZoom: 11,
          zoomControl: true,
          zoomControlOptions: {
            position: maps.Position.TOP_RIGHT
          }
        });
      }

      maps.Service.geocode({ query: MAHAREX_ADDRESS }, (status: string, response: any) => {
        if (status !== maps.Service.Status.OK || !response?.v2?.addresses?.length) {
          setMapError("마하렉스 주소 좌표를 조회하지 못했습니다.");
          return;
        }

        const result = response.v2.addresses[0];
        const coord: Coordinate = {
          lat: Number(result.y),
          lng: Number(result.x)
        };

        if (!Number.isFinite(coord.lat) || !Number.isFinite(coord.lng)) {
          setMapError("마하렉스 주소 좌표를 조회하지 못했습니다.");
          return;
        }

        setResolvedCoord(coord);
      });
    } catch {
      setMapError("네이버지도를 불러오는 중 오류가 발생했습니다.");
    }
  }, [clientId, scriptReady]);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps || !resolvedCoord) return;

    try {
      const maps = window.naver.maps;
      const center = new maps.LatLng(resolvedCoord.lat, resolvedCoord.lng);
      mapRef.current.setCenter(center);

      if (!markerRef.current) {
        markerRef.current = new maps.Marker({
          map: mapRef.current,
          position: center,
          title: "마하렉스",
          icon: {
            content: `
              <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#111719;color:#fff;border:2px solid #dc4b2d;font-weight:800;font-size:13px;box-shadow:0 8px 22px rgba(0,0,0,.25);white-space:nowrap;">
                <span style="width:10px;height:10px;background:#dc4b2d;display:inline-block;"></span>
                MAHAREX
              </div>
            `,
            anchor: new maps.Point(58, 46)
          }
        });
      } else {
        markerRef.current.setPosition(center);
      }

      const infoContent = `<div style="padding:10px 14px;font-size:13px;font-weight:700;color:#111719;">(주)마하렉스<br/>${MAHAREX_ADDRESS}</div>`;

      if (!infoWindowRef.current) {
        infoWindowRef.current = new maps.InfoWindow({
          content: infoContent,
          borderWidth: 1,
          anchorSize: new maps.Size(10, 10)
        });
        infoWindowRef.current.open(mapRef.current, center);
      } else {
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.setPosition(center);
      }
    } catch {
      setMapError("네이버지도를 불러오는 중 오류가 발생했습니다.");
    }
  }, [resolvedCoord]);

  if (!clientId) {
    return (
      <div className="border border-black/10 bg-white p-8 shadow-sm">
        <div className="flex min-h-[360px] items-center justify-center bg-[#eef1f1] p-6 text-center md:min-h-[520px]">
          <div>
            <p className="text-xl font-black text-graphite">네이버지도 API 키가 필요합니다</p>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-steel">
              `.env.local` 파일에 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 값을 추가하면 실제 지도에 마하렉스 위치가 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black/10 bg-white p-4 shadow-sm">
      <Script
        id="naver-map-sdk"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder&callback=__initMaharexNaverMap`}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setMapError("네이버지도 API 스크립트를 불러오지 못했습니다.")}
      />
      <div className="relative overflow-hidden bg-[#eef1f1]">
        <div ref={mapElementRef} className="h-[380px] w-full md:h-[520px]" />
        {!scriptReady || mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/88 p-6 text-center">
            <div>
              <p className="text-lg font-black text-graphite">{mapError || "네이버지도를 불러오는 중입니다."}</p>
              <p className="mt-3 text-sm font-semibold leading-7 text-steel">API 설정과 도메인 등록 상태를 확인해 주세요.</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold leading-6 text-steel">{MAHAREX_ADDRESS}</p>
        <a href={naverMapUrl} target="_blank" className="bg-signal px-5 py-3 text-sm font-black text-white hover:bg-graphite">
          네이버지도에서 보기
        </a>
      </div>
    </div>
  );
}

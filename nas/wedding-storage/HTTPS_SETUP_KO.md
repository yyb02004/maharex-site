# 현재 청첩장 저장소 HTTPS 연결

**공개 API: https://wedding-api.maharex.com**

2026-10-26에 아래 연결을 확인했습니다. NAS의 `wedding-storage`와 `wedding-proxy`가 실행되고, Let's Encrypt 인증서와 TLS 1.3으로 외부 `/api/health`가 HTTP 200을 반환했습니다.

| 구간 | 현재 설정 |
| --- | --- |
| DNS | `wedding-api.maharex.com` CNAME → `maharex.iptime.org` |
| 공유기 | 외부 **TCP 443 → 192.168.0.12:8443** |
| HTTPS 처리 | Caddy 2.11.7, 컨테이너 내부 8443 |
| 백엔드 | 같은 앱 네트워크의 `wedding-storage:8000` |
| DB·사진 | 기존 외부 볼륨 `maharex-wedding-data` |
| 인증서·ACME 계정 | `maharex-wedding-tls-data` |

현재 연결은 QTS 관리 화면의 역방향 프록시를 사용하지 않습니다. 관리 화면의 443/5888이나 SMB 포트를 이 규칙의 대상으로 설정하지 않습니다. 외부 80과 UDP 포트도 사용하지 않습니다.

## 변경할 때

1. NAS `/share/main/wedding`의 최신 프로그램과 `proxy/Dockerfile`, `proxy/Caddyfile`을 갱신합니다.
2. Container Station에서 **Applications → 기존 `composeqnap` → Edit 옆 화살표 → Recreate**를 선택합니다. YAML 전체를 `compose.qnap.https.yaml` 내용으로 교체하고 메모리 제한 1024 MB를 확인합니다. 같은 볼륨을 사용하는 두 번째 앱을 만들지 않습니다.
3. 기존 `maharex-wedding-data`와 인증서 볼륨을 보존합니다. 데이터 삭제 옵션이나 볼륨 정리를 실행하지 않습니다.
4. 두 컨테이너 상태와 NAS 8443 연결을 확인한 뒤 외부 HTTPS 응답을 확인합니다. 기존 DNS와 공유기 규칙이 그대로라면 다시 만들 필요가 없습니다.

다른 NAS나 회선으로 옮긴다면 **전용 프록시 8443 실행 확인 → 공유기 규칙의 대상 확인 → DNS 변경 → 외부 인증서 확인** 순서로 진행합니다. 접근 가능한 IPv6 경로가 없다면 해당 이름에 AAAA 레코드를 추가하지 않습니다. 외부 TCP 443이 이미 다른 서비스에서 사용 중이면 기존 규칙을 덮어쓰지 않고 구성을 다시 정합니다.

## 인증서와 요청 처리

인증서는 Let's Encrypt TLS-ALPN 방식으로 자동 발급·갱신됩니다. DNS와 외부 TCP 443 연결을 유지해야 갱신됩니다. Caddy의 관리 API와 자동 HTTP 리디렉션은 꺼져 있습니다.

프록시는 `/api/*`, `/media/*` 경로를 그대로 전달합니다. 요청 본문 한도는 16 MiB, 앱의 사진 파일 한도는 15 MiB입니다. 업로드와 전송 제한 시간은 5분이며 CORS와 OPTIONS는 기존 앱이 처리합니다. 개인 요청의 접근 로그는 켜지 않습니다.

두 컨테이너는 UID 10001과 읽기 전용 시스템 파일로 실행됩니다. Caddy가 외부에서 받은 전달 IP 값을 덮어쓰고 백엔드는 `TRUST_PROXY_HOPS=1`로 한 단계만 신뢰합니다. 백엔드의 5080/8000 호스트 포트는 공개하지 않습니다.

## 아직 확인할 동작

사진 목록, CORS 사전 요청과 잘못된 사진의 415 응답까지 확인했습니다. **실제 사진 업로드 성공과 재시작 후 데이터 보존은 아직 확인하지 않았습니다.** 공개할 사진으로 등록·조회를 확인해야 하며, 관리자 삭제가 꺼져 있으므로 테스트용 사진을 임의로 올리지 않습니다.

청첩장 코드에는 Vercel 운영 배포에서만 사용하는 API 기본값이 준비되어 있습니다. GitHub 자동 배포가 완료된 뒤 실제 `maharex.com/love`의 방명록 작성·조회·삭제와 사진 표시를 확인해야 합니다. NAS API가 정상이라는 사실과 프런트엔드 배포 완료는 별개의 확인 항목입니다.

참고: [Caddy HTTPS 포트](https://caddyserver.com/docs/caddyfile/options#https-port), [TLS-ALPN 설정](https://caddyserver.com/docs/caddyfile/directives/tls#issuers), [공식 Docker 이미지](https://github.com/docker-library/official-images/blob/master/library/caddy).

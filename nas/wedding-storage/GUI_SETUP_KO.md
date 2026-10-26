# File Station과 Container Station에서 현재 앱 관리하기

현재 앱 이름은 **`composeqnap`**이며, **`compose.qnap.https.yaml`**을 사용합니다. 앱 안에서 `wedding-storage`와 `wedding-proxy` 두 컨테이너가 실행됩니다. 공개 API는 **https://wedding-api.maharex.com**입니다.

2026-10-26에 두 컨테이너 실행, Let's Encrypt 인증서, TLS 1.3과 외부 `/api/health`의 HTTP 200 응답을 확인했습니다. 실제 사진 업로드와 재시작 후 데이터 보존, 최신 Vercel 청첩장 반영은 아직 별도 확인이 필요합니다.

## 1. 프로그램 파일 갱신

File Station의 **`main` → `wedding`** 폴더를 사용합니다. 이 폴더는 프로그램 소스이며, 하객 사진과 방명록은 별도 `maharex-wedding-data` 볼륨에 있습니다. 회사 공유 폴더를 실행 중인 앱에 연결하지 않습니다.

최신 소스를 복사할 때 아래 구조를 유지합니다. 압축파일 이름이 같은지보다 실제 내용과 경로를 확인합니다. 예전 `acl2` 압축에는 HTTPS 프록시 파일이 없을 수 있습니다.

```text
main/wedding/
├─ Dockerfile
├─ app.py
├─ schema.sql
├─ requirements.txt
├─ compose.qnap.https.yaml
└─ proxy/
   ├─ Dockerfile
   └─ Caddyfile
```

`build.context`는 확인된 NAS 경로 **`/share/main/wedding`**입니다. `DataVol1`은 화면의 볼륨 이름이므로 `/share/DataVol1/...`로 바꾸지 않습니다. 폴더 권한을 모두에게 쓰기 허용으로 바꾸거나 `.env`를 새로 만들 필요가 없습니다.

## 2. 기존 앱 다시 만들기

1. **Applications → `composeqnap` → Edit 옆 화살표 → Recreate**를 엽니다.
2. YAML 전체를 최신 **`compose.qnap.https.yaml`** 내용으로 교체합니다. NAS의 파일만 고쳐도 이미 붙여 넣은 편집창은 자동으로 바뀌지 않습니다.
3. **Validate**를 누릅니다. Resources 설정 오류가 나오면 오래된 `mem_limit` 행이 남아 있지 않은지 확인합니다.
4. **Advanced Settings → Resources → Memory Limit**을 **1024 MB**로 설정합니다. `Memory Reservation`과는 다른 항목입니다. `pids_limit: 64`는 유지합니다.
5. 기존 앱을 갱신합니다. 같은 DB 볼륨을 쓰는 두 번째 앱을 새로 만들지 않습니다. **연결된 볼륨/데이터 삭제** 옵션은 선택하지 않습니다.
6. `wedding-storage`가 `running` / `healthy`이고 `wedding-proxy`가 실행 중인지 확인합니다. 실패하면 해당 컨테이너의 Logs를 확인합니다.
7. 외부에서 `https://wedding-api.maharex.com/api/health`의 인증서와 정상 응답을 확인합니다.

현재 YAML은 기존 **`maharex-wedding-data`를 external 볼륨**으로 참조합니다. 볼륨 이름을 바꾸거나 빈 볼륨으로 대체하지 않습니다. 인증서용 **`maharex-wedding-tls-data`**도 재생성 때 유지합니다. `compose.qnap.yaml`은 HTTPS 전 단계의 내부 확인용이고, `compose.yaml`은 별도 터미널 설치용입니다. 현재 앱을 갱신할 때 두 파일을 대신 붙여 넣지 않습니다.

## 3. 현재 외부 연결

- DNS: `wedding-api.maharex.com` → CNAME `maharex.iptime.org`
- 공유기: **외부 TCP 443 → 192.168.0.12의 TCP 8443**
- Caddy: 내부 8443에서 HTTPS 처리 → `wedding-storage:8000`
- 백엔드의 호스트 포트 5080/8000은 공개하지 않음
- `TRUST_PROXY_HOPS: "1"`: Caddy가 방문자의 전달 IP 헤더를 덮어쓴 뒤 한 단계 전달

현재 구성은 QTS 관리 화면의 역방향 프록시를 사용하지 않습니다. 공유기의 대상 포트를 NAS 관리 화면의 443 또는 5888로 바꾸지 않습니다. 인증서 갱신을 위해 DNS와 외부 TCP 443 연결을 유지합니다. 자세한 확인 순서는 [HTTPS_SETUP_KO.md](HTTPS_SETUP_KO.md)를 참고합니다.

## 청첩장 반영

API 주소는 `https://wedding-api.maharex.com`입니다. 코드에는 `VERCEL_ENV=production`이며 `LOVE_STORAGE_API_URL`이 없을 때만 이 주소를 사용하는 기본값이 준비되어 있습니다. 미리보기·로컬 환경에는 자동 적용하지 않습니다. 환경 변수에 주소를 지정하는 경우에도 다시 배포해야 합니다. GitHub 자동 배포가 끝난 뒤 실제 청첩장에서 반영을 확인합니다.

외부 API 정상 응답만으로 사진 업로드까지 검증된 것은 아닙니다. 공개할 사진으로 등록·조회를 확인하고 재시작 후 보존도 확인해야 합니다. 관리자 삭제는 현재 꺼져 있으므로 테스트 사진을 임의로 공개 저장소에 올리지 않습니다.

## 권한 오류 복구

과거 이미지에서 `/app/app.py` 읽기 권한 오류가 발생했습니다. 최신 백엔드 이미지는 **`maharex-wedding-storage:20261026-acl2`**이며, 이미지 내부의 POSIX ACL만 정리하고 새 프로그램 파일을 UID/GID 10001 소유로 만듭니다. 빌드 중 앱 가져오기·스키마 읽기·임시 파일 쓰기를 검사하고 DB를 생성하지 않습니다. 이 이미지의 실제 NAS 실행은 확인했습니다.

프로그램 권한 오류가 재발하면 최신 Dockerfile을 복사하고 위 Recreate 절차로 이미지를 다시 빌드합니다. 이전 이미지의 단순 재시작으로는 파일 수정이 반영되지 않습니다. 빌드의 `Image permissions verified for UID 10001`과 실행 로그를 확인합니다. 데이터 볼륨 권한 오류라면 정확한 파일 경로와 로그부터 확인합니다. 볼륨 삭제, 회사 공유 폴더 전체 권한 확대, 관리자 사용자 실행으로 우회하지 않습니다.

## 저장 공간과 백업

- `main/wedding` 소스 폴더만 복사해도 사진과 방명록이 백업되는 것은 아닙니다.
- `maharex-wedding-data`에는 DB와 사진이 함께 있습니다. 앱을 잠시 중지한 상태에서 볼륨 전체를 같은 시점으로 백업하는 절차를 준비합니다.
- `maharex-wedding-tls-data`에는 인증서와 ACME 계정이 있습니다. 함께 보존합니다.
- 앱 재생성·삭제 화면의 데이터 삭제나 Volumes의 Prune으로 두 볼륨을 지우지 않습니다.
- README의 호스트 `data` 폴더 복사 예시는 별도 `compose.yaml` 설치용이며 현재 이름 있는 볼륨에 그대로 적용하지 않습니다.

참고: [QNAP Container Station 3](https://www.qnap.com/en-us/how-to/tutorial/article/how-to-use-container-station-3), [Docker 볼륨](https://docs.docker.com/engine/storage/volumes/).

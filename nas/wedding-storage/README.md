# 청첩장 NAS 저장 서버

`maharex.com/love`의 방명록과 공개 게스트 사진만 저장하는 별도 서비스입니다. 청첩장 본체는 Vercel에 유지하고 사진은 방문자 브라우저에서 NAS의 HTTPS 주소로 직접 업로드합니다. 이 폴더를 만들거나 테스트하는 것만으로 NAS에 연결되거나 배포되지는 않습니다.

## 먼저 확인할 사항

- NAS 모델과 Container Station에서 Linux 컨테이너 및 Compose 프로젝트 실행을 지원하는지 확인합니다. 실제 NAS에서 Docker 이미지를 빌드·실행하는 검증은 아직 필요합니다.
- NAS에 **청첩장 전용 폴더와 전용 실행 사용자**를 준비합니다. 회사 공유 폴더 전체, `/share`, 홈 폴더, Docker 소켓 등을 컨테이너에 연결하지 않습니다. Compose는 현재 폴더의 `data`만 `/data`에 연결합니다.
- 유효한 인증서가 있는 별도 HTTPS API 주소가 필요합니다. 예를 들어 `https://wedding-api.example.com`이며 실제 사용할 소유 도메인으로 바꿉니다. HTTPS 청첩장에서 HTTP NAS 주소를 직접 사용하면 브라우저가 차단합니다.
- NAS 관리 화면 주소나 관리 포트는 API 주소가 아닙니다. 관리 화면·SMB 포트를 인터넷에 새로 열지 않습니다. 외부 HTTPS 역방향 프록시가 **이 서비스의 5080 포트만** 연결하도록 구성합니다.
- 현재 설정은 NAS 자체에서 실행하는 역방향 프록시가 `127.0.0.1:5080`으로 접근하는 구성을 전제로 합니다. 프록시가 다른 컨테이너에 있다면 그 컨테이너의 `127.0.0.1`은 NAS를 뜻하지 않습니다. 그 경우 전용 컨테이너 네트워크에서 서비스 이름과 8000 포트로 연결하고 공개 포트 없이 운영하도록 별도로 구성해야 합니다.

## 설치

### 확인된 NAS 모델

현재 대상은 **QNAP TS-453D / QTS 5.2.7.3297**입니다. [QNAP 공식 사양](https://www.qnap.com/en-us/product/ts-453d/specs/hardware)의 Intel Celeron J4125, 64비트 x86, Container Station/Docker 지원에 맞는 Linux 컨테이너 구성입니다. 실제 설치된 RAM 용량, 사용 중인 메모리, Container Station 버전과 포트 사용 여부는 NAS에서 확인해야 합니다. 기본 컨테이너 메모리 한도 1GiB는 현재 NAS에서 여유 공간이 확인되었다는 뜻은 아닙니다.

압축파일은 새 전용 폴더에 풀어 `wedding-storage/compose.yaml`과 `Dockerfile`이 같은 위치에 있도록 둡니다. 예를 들어 **청첩장만을 위한 공유 폴더 안의 `wedding-storage`**가 설치 위치가 될 수 있습니다. NAS의 실제 공유 폴더 경로는 확인 후 사용하며, 기존 회사 공유 폴더 전체를 마운트하지 않습니다.

이 Compose 파일은 해당 프로젝트 폴더에서 실행하는 구성을 전제로 합니다. [Container Station의 애플리케이션 생성 화면](https://www.qnap.com/en-us/how-to/tutorial/article/how-to-use-container-station-3)에 YAML만 붙여 넣는 경우에는 `build: .`, `env_file: .env`, `./data`의 상대 경로 기준이 달라질 수 있습니다. UI에서 배포한다면 `build.context`, `env_file`, 데이터 폴더 마운트를 **확인된 이 프로젝트의 NAS 절대 경로**로 지정하고 `.env` 변수도 해당 실행 방식에 맞게 전달해야 합니다. 소스 ZIP은 컨테이너 이미지 자체가 아니며, NAS에서 이미지를 빌드하려면 Docker Hub와 PyPI에 연결할 수 있어야 합니다.

[QTS 5.2 역방향 프록시 문서](https://docs.qnap.com/operating-system/qts/5.2.x/en-us/configuring-reverse-proxy-rule-settings-0CE50167.html)의 HTTPS 원본 주소와 HTTP 대상 `127.0.0.1:5080` 구성을 사용할 수 있습니다. 기본 서비스 포트는 NAS 루프백에만 바인딩하므로 다른 PC에서 `NAS의 내부 IP:5080`으로 직접 접속할 수 없습니다. 정상 여부는 NAS 내부 검사 또는 설정한 HTTPS 프록시를 통해 확인합니다.

아래 명령은 NAS의 **새 청첩장 전용 폴더**에서 실행하는 예시입니다. 기존 회사 데이터 폴더에 실행하지 않습니다. NAS 환경에 따라 관리자에게 폴더 소유권 설정을 요청해야 합니다.

```sh
cp config.env.example .env
mkdir -p data
```

`.env`의 `WEDDING_UID` / `WEDDING_GID`와 동일한 전용 사용자가 `data`에 읽고 쓸 수 있도록 NAS의 폴더 소유권/권한을 설정합니다. 이미지 기본 UID/GID는 `10001:10001`입니다. 모든 사용자에게 쓰기 권한을 주는 방식으로 해결하지 않습니다.

`.env`를 설정한 다음 실행합니다.

```sh
docker compose up -d --build
docker compose logs --tail=50 wedding-storage
curl http://127.0.0.1:5080/api/health
```

컨테이너는 읽기 전용 시스템 파일, 일반 사용자, 제한된 전용 데이터 마운트로 실행합니다. 메모리 한도는 기본 1GiB이며 NAS에 해당 여유 메모리가 있어야 합니다. 사진 변환은 프로세스당 한 장씩 처리하고, 처리 중 다른 사진 요청에는 재시도 안내를 반환합니다. 이미지 처리 중 방명록과 목록 요청은 계속 받을 수 있습니다.

HTTPS 역방향 프록시에는 16MiB 이상의 요청 본문 허용 크기와 충분한 업로드 제한 시간(예: 120초)을 설정합니다. `/api/*`와 `/media/*` 경로를 그대로 전달하고 API 응답을 캐시하지 않습니다. 임의의 응답 HTML 삽입이나 로그인 페이지 리디렉션을 사용하지 않습니다.

### 프록시와 요청 제한

`TRUST_PROXY_HOPS=0`은 요청의 전달 IP 헤더를 신뢰하지 않는 기본값입니다. 이 상태로 프록시를 거치면 모든 방문자가 프록시 한 개의 IP로 보이므로 요청 제한도 공유합니다.

외부 요청이 정확히 한 개의 신뢰된 프록시를 거치고, 직접 서비스 접근은 차단되어 있으며, 프록시가 외부에서 받은 `X-Forwarded-For`를 덮어쓰거나 신뢰할 수 있는 마지막 홉을 추가하는 것을 확인한 후 `TRUST_PROXY_HOPS=1`로 설정합니다. 여러 프록시가 있다면 실제 신뢰된 홉 수를 확인해야 합니다. 임의로 숫자를 늘리면 IP 기반 제한을 우회할 수 있습니다. 같은 Wi-Fi에 연결된 하객은 실제 공인 IP가 같을 수 있습니다.

## 청첩장 연결

NAS HTTPS 주소에서 `/api/health`가 정상 응답하는 것을 확인한 다음 Vercel 프로젝트의 서버 환경 변수에 다음을 설정하고 **다시 배포**합니다.

```text
LOVE_STORAGE_API_URL=https://실제-API-도메인
```

주소에는 `/api` 또는 다른 경로, 쿼리, 사용자 이름/비밀번호를 넣지 않습니다. 이 값이 없으면 청첩장에 방명록과 게스트 사진 영역이 표시되지 않습니다. 관리자 토큰은 Vercel이나 프런트엔드 환경 변수에 넣지 않습니다. 로컬 개발에서만 `http://localhost:포트` 또는 `http://127.0.0.1:포트`를 사용할 수 있습니다.

NAS의 `ALLOWED_ORIGINS`에는 실제 청첩장 출처를 쉼표로 구분해 정확히 등록합니다. 기본값은 `https://maharex.com,https://www.maharex.com`입니다. 개발/미리보기 주소가 필요한 경우 그 출처만 명시적으로 추가합니다. 와일드카드를 사용하지 않으며, URL 끝에 `/`를 붙이지 않습니다. POST/DELETE는 허용된 `Origin`이 있어야 하고 쿠키는 사용하지 않습니다. CORS/Origin 검사는 로그인 기능이 아니므로 공개 사진을 비공개로 만들지는 않습니다.

## 저장 내용과 기본 제한

| 항목 | 기본값 |
| --- | --- |
| 사진 입력 | JPEG, PNG, 정지 WebP만 지원, 한 파일 15MiB 이하, 4천만 화소 이하 |
| 전송 | 요청당 한 장, 청첩장에서는 한 번에 최대 10장 선택 후 순서대로 전송 |
| 저장본 | 긴 변 최대 2560px JPEG, 긴 변 최대 600px 썸네일 |
| 원본·부가정보 | 업로드 원본은 보관하지 않음. EXIF·GPS·XMP·프로필 등 부가정보 제거 |
| 사진 수·용량 | 최대 5,000장, 변환된 사진+썸네일 합계 최대 10GiB |
| NAS 디스크 여유 | 업로드 후 최소 512MiB 보존 검사 |
| 방명록 | 최대 5,000개, 이름 1–40자, 메시지 1–500자 |
| 삭제 비밀번호 | 4–64자, scrypt 해시만 보관, 공개 응답에는 포함하지 않음 |
| 사진 설명 | 0–200자 |
| 요청 제한 | IP별 방명록 20회/시간, 사진 60회/시간, 삭제 10회/10분 |

HEIC, GIF, 동영상, 움직이는 WebP/PNG는 지원하지 않습니다. 지원하지 않는 사진은 JPEG 등으로 변환해 올립니다. 실제 이미지 내용을 검사하므로 확장자만 바꿔도 허용되지 않습니다. 실패한 요청도 요청 제한 횟수에 포함될 수 있습니다.

사진 총량은 **저장본과 썸네일**의 실제 바이트 합계입니다. SQLite, 로그, 백업 등의 용량은 별도입니다. NAS의 다른 작업이 동시에 디스크를 사용하면 여유 공간이 달라질 수 있으므로 NAS 관리자에게 전용 폴더/볼륨 용량 제한도 설정하도록 요청하는 것이 좋습니다. 사진의 실제 용량은 구도와 화질에 따라 달라지며 5,000장을 반드시 보관할 수 있다는 뜻은 아닙니다.

제한은 `.env`에서 변경하고 `docker compose up -d`로 적용합니다. IP 기반 요청 제한은 DB에 저장되어 서버를 재시작해도 이어집니다. DB에는 원본 IP 대신 서버 고유 비밀값으로 만든 해시를 저장하며 요청 제한 기록은 오래되면 정리합니다.

### 공개 안내

사진과 작성자 이름/설명, 방명록 이름/내용은 등록 즉시 청첩장 방문자에게 공개됩니다. 업로드 화면에 이 사실과 원본을 보관하지 않는다는 안내를 보여 주고 공개 동의를 받아야 합니다. 공개해도 되는 사진과 정보만 올리도록 안내합니다. 사진 속 다른 사람에게도 공개 동의를 받도록 안내합니다.

자동 보관 종료일은 설정되어 있지 않습니다. 운영자가 정한 보관 기간 종료 후 삭제하거나 서비스를 종료해야 합니다. 관리자 삭제 뒤에도 방문자가 이미 내려받았거나 브라우저에 캐시한 사본은 회수할 수 없습니다. 미디어의 기본 브라우저 캐시는 최대 1시간입니다. `noindex`를 사용하지만 비공개 접근 제어를 제공하는 서비스는 아닙니다.

## API 계약

시간은 UTC ISO 8601 문자열이며, `id`는 32자리 UUID 문자열입니다. 목록은 최신 등록 순입니다. `nextCursor`는 불투명한 페이지 커서로, 다음 요청의 `before`에 받은 문자열을 그대로 보냅니다. **항목 id를 before에 넣지 않습니다.** `limit`은 1–50을 허용합니다.

| 요청 | 응답 |
| --- | --- |
| `GET /api/health` | `{ok: true, limits: {maxUploadBytes, maxFilesPerBatch, maxPhotoCount, maxStorageBytes, maxImagePixels, maxNameLength, maxMessageLength, maxCaptionLength}}` |
| `GET /api/guestbook?limit=6&before=...` | `{items: [{id,name,message,createdAt}], nextCursor: string 또는 null}` |
| `POST /api/guestbook` JSON `{name,message,password}` | 201 `{item: {id,name,message,createdAt}}` |
| `DELETE /api/guestbook/:id` JSON `{password}` | 204 빈 응답 |
| `GET /api/photos?limit=12&before=...` | `{items: [{id,name,caption,url,thumbnailUrl,width,height,createdAt}], nextCursor: string 또는 null}` |
| `POST /api/photos` multipart `file,name,caption,consent=true` | 201 `{item: {id,name,caption,url,thumbnailUrl,width,height,createdAt}}` |
| `GET /media/:filename` | 정규화한 JPEG 이미지 |
| `DELETE /api/photos/:id` | 관리자 토큰이 있는 경우 204 |

`url`과 `thumbnailUrl`은 `/media/...` 상대 경로입니다. NAS API 출처를 기준으로 해석합니다. 오류는 `{error: "한국어 안내"}`이며 잘못된 입력 400/415, 비밀번호·출처·권한 403, 크기 초과 413, 요청 제한 429, 저장소 사용 불가 503, 보관 한도/디스크 부족 507 등을 반환합니다. 429에는 `Retry-After`가 포함됩니다.

사진과 방명록 등록에는 자동 중복 제거 키가 없습니다. 서버가 저장한 뒤 네트워크 응답만 유실되면 다시 등록할 때 중복될 수 있습니다. 프런트엔드는 응답 확인에 실패한 경우 목록 새로고침으로 확인하도록 안내하고 자동 재전송하지 않습니다.

### 관리자 삭제

선택 기능인 `ADMIN_TOKEN`을 NAS의 `.env`에만 설정합니다. 32자 이상 임의 문자열을 사용하고 로그·브라우저 코드·저장소에 노출하지 않습니다. 예를 들어 Python의 `secrets.token_urlsafe(32)`로 생성할 수 있습니다. 빈 값이면 관리자 삭제는 비활성화됩니다.

허용된 `Origin`과 `Authorization: Bearer <관리자 토큰>` 헤더를 포함하면 사진 또는 방명록을 삭제할 수 있습니다. 방명록은 관리자 토큰 없이도 작성자의 삭제 비밀번호로 삭제할 수 있습니다. 별도 관리자 웹 화면은 포함하지 않습니다.

## 데이터·백업·복구

`data/wedding.sqlite3`에 방명록/사진 메타데이터/요청 제한 기록이, `data/media`에 변환 사진이 보관됩니다. 원본 파일명은 보관하지 않습니다. 파일 이름은 서버가 만든 임의 값이며 경로를 직접 입력해 회사 파일을 읽을 수 있는 API는 없습니다.

간단한 일관성 있는 백업 절차는 서비스를 잠시 중지한 뒤 **전용 `data` 폴더 전체**를 NAS의 별도 백업 위치로 복사하고 다시 시작하는 것입니다.

```sh
docker compose stop wedding-storage
# NAS 백업 도구로 이 프로젝트의 data 폴더 전체를 별도 위치에 백업합니다.
docker compose start wedding-storage
```

실행 중인 DB 파일 하나만 복사하면 SQLite WAL의 내용이나 사진과 시점이 어긋날 수 있습니다. 온라인 백업이 필요하면 SQLite backup API와 사진을 일관되게 백업하는 별도 운영 절차를 준비합니다. 복구할 때는 서비스를 중지하고 DB와 사진을 같은 백업 시점으로 함께 복원한 뒤 권한을 확인합니다. 기존 사진이 있는데 DB 파일이 없거나 초기화되지 않은 빈 DB이면 사진을 보존하고 시작을 거절합니다. 이때 같은 시점의 DB 백업을 복원하거나 새 빈 전용 폴더로 시작해야 합니다. 정상적으로 초기화된 DB가 있는 경우에만 DB에 없는 서비스 형식의 사진 파일을 중단된 업로드 잔여물로 정리합니다.

일반적인 업로드 실패는 파일과 DB 기록을 되돌립니다. 비정상 종료로 남은 서비스 소유의 사진 잔여물과 삭제 대기 기록은 다음 시작 때 정리합니다. 사진 수와 용량 확인·파일 생성·메타데이터 기록은 SQLite 쓰기 잠금 안에서 처리하여 동시 업로드가 할당량을 초과하지 않게 합니다. DB 스키마는 `schema.sql` 버전 1이며 시작 시 생성합니다. 기존 회사 DB/인증/스토리지를 사용하지 않습니다.

NAS가 꺼지거나 외부 회선이 끊기면 방명록과 게스트 사진은 사용할 수 없지만, Vercel의 청첩장 기본 내용과 기존 웨딩 사진은 계속 표시됩니다. NAS 업로드/다운로드 속도는 회사 인터넷 회선과 NAS 상태의 영향을 받습니다.

## 로컬 검증

Python 3.12 가상 환경 또는 별도 패키지 폴더에서 실행합니다. 운영 환경은 Docker의 gunicorn을 사용하고 Flask 개발 서버를 외부에 공개하지 않습니다.

```sh
python -m venv .venv
# 운영체제에 맞게 .venv를 활성화합니다.
pip install -r requirements.txt
python -m unittest discover -s tests -v
```

테스트는 개인 사진을 사용하지 않고 임시 폴더에 생성한 이미지와 DB만 사용합니다. Origin/CORS, 입력·삭제 비밀번호, 실제 이미지·메타데이터 제거, 큰 multipart 업로드, 경로 접근, 저장 실패 롤백, 디스크 여유·수량·용량 한도, 동시 저장, 재시작 후 데이터/요청 제한 보존을 확인합니다. 실제 QNAP Docker/HTTPS/외부 업로드 동작은 배포 환경에서 추가 확인해야 합니다.

의존성 정보: [Flask](https://pypi.org/project/Flask/), [Pillow](https://pypi.org/project/pillow/), [Gunicorn](https://pypi.org/project/gunicorn/). 고정 버전은 `requirements.txt`에 있으며, 운영 중 보안 업데이트를 확인해 테스트 후 갱신합니다.

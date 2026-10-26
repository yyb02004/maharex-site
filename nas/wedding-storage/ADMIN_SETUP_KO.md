# 사진 관리 · 참석 명단 공통 비밀번호 업데이트

사진 관리와 참석 명단에 같은 관리자 비밀번호를 사용합니다. 요청하신 비밀번호는 전달받은 업데이트 ZIP에 검증용 해시로 설정되어 있으며, 비밀번호 원문은 파일에 들어 있지 않습니다. 기존의 긴 접속 키는 이 설정을 적용한 뒤에는 사용할 수 없습니다.

이번 파일에는 원본 사진 보관·관리자 삭제·전체 ZIP 다운로드도 포함되어 있습니다. 이전 사진 관리 업데이트를 아직 적용하지 않았어도 이 파일로 바로 업데이트하면 됩니다.

## 업데이트 순서

1. `wedding-storage-qnap-admin-20261026.zip`을 PC에서 풉니다.
2. 압축을 푼 파일과 `proxy` 폴더를 NAS의 **main → wedding**에 복사하고 같은 이름은 덮어씁니다.
3. **Container Station → Applications → composeqnap → Edit 옆 화살표 → Recreate**를 엽니다.
4. 새 파일 **compose.qnap.admin.yaml**을 메모장으로 열어 전체 내용을 복사하고, Recreate 화면의 YAML 전체를 교체합니다.
5. **Advanced Settings → Resources → Memory limit → Limited / 1024 MB**로 설정합니다.
6. **Validate → Update**를 누릅니다. 새 이미지가 준비되고 두 컨테이너가 Running이 될 때까지 기다립니다.

기존 앱과 볼륨을 삭제하지 마세요. 기존 `maharex-wedding-data`와 `maharex-wedding-tls-data`를 그대로 사용하므로 사진·방명록·참석 명단과 인증서는 유지됩니다. 기존 데이터는 업데이트 전에 백업해 두는 것이 좋습니다.

## 로그인

- [사진 관리](https://wedding-api.maharex.com/api/photo-admin): 원본 저장, 사진 삭제, 전체 ZIP 다운로드
- [참석 명단](https://wedding-api.maharex.com/api/rsvp-admin): 참석 응답 확인, 전체 CSV 저장

두 화면 모두 요청하신 같은 관리자 비밀번호를 입력합니다. 사진 관리의 기존 로그인은 새 설정 적용 시 만료되므로 다시 로그인해 주세요. 참석 명단은 새로고침하거나 탭을 닫으면 비밀번호를 다시 입력합니다.

[연결 상태](https://wedding-api.maharex.com/api/health)에 `"managementPassword": true`, `"photoAdmin": true`, `"originalPhotos": true`, `"rsvp": true`가 표시되면 적용된 상태입니다.

원본 보관은 새 버전에서 올린 사진부터 적용됩니다. 기존에 이미 축소 저장된 사진은 기존 JPG로 내려받습니다. 사진 삭제는 공개 미리보기와 보관 원본을 함께 지우므로 필요한 파일을 먼저 내려받으세요.

ZIP과 설정 YAML에는 관리자 인증 설정이 포함되어 있으므로 하객에게 공유하거나 공개 저장소에 올리지 마세요. YAML의 `$$`는 정상적인 Docker Compose 표기이므로 임의로 수정하지 않습니다.

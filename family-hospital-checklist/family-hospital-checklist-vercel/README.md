# 가족 공동 병원 체크리스트 (Vercel)

## 배포
1. 이 폴더 안의 파일과 `public`, `api` 폴더를 GitHub 저장소의 `family-hospital-checklist/` 폴더에 업로드하거나 기존 파일을 교체합니다.
2. Upstash에서 Redis 데이터베이스를 생성하고 REST URL과 REST TOKEN을 복사합니다.
3. Vercel 프로젝트의 Environment Variables에 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`을 등록합니다. TOKEN은 절대 GitHub에 올리지 마세요.
4. Vercel Root Directory를 `family-hospital-checklist`로 설정하고 배포합니다.
5. 배포된 웹사이트를 열면 새 체크리스트가 생성됩니다. **반드시 주소에 `?room=...`이 포함된 상태에서 '링크 복사' 버튼으로 가족방에 공유하세요.**

## 작동 방식
- 3초 간격 동기화 (완전한 WebSocket 즉시 반영은 아님)
- Redis TTL 86400초(24시간)로 체크 기록 자동 만료
- 로그인 없음, 링크를 아는 누구나 수정 가능
- 24시간이 지나도 배포된 웹사이트 자체는 남아 있고, 체크 기록만 삭제됩니다.
- 체크 상태는 서버에 임시 저장됩니다. 개인 의료정보는 입력하지 마세요.

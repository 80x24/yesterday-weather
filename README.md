# 어제의 날씨

사용자의 위치를 기준으로 **어제의 기온과 날씨**를 하나의 기록물처럼 보여주는 미니멀 웹 프로젝트.

## 특징

- 실시간 정보 제공을 목표로 하지 않음
- 날씨를 기능적 데이터가 아닌 하루의 분위기와 기억을 구성하는 요소로 다룸
- 입력 없음, 클릭 없음, 스크롤 없음 — 단일 화면

## 기술 스택

- **서버**: Hono + Bun + Fly.io
- **클라이언트**: HTML/CSS + Alpine.js
- **날씨 API**: Open-Meteo (무료, API Key 불필요)

## 실행

```bash
bun install
bun run dev
```

http://localhost:3000

## 배포

```bash
fly deploy
```

## 날씨 타입

| 타입 | WMO 코드 |
|------|----------|
| clear | 0 |
| cloudy | 1-3 |
| fog | 4-49 |
| rain | 50-69 |
| snow | 70-79 |
| storm | 80-99 |

## 아트웍

`public/images/` 디렉토리에 날씨 타입별 이미지 필요:
- clear.jpg
- cloudy.jpg
- fog.jpg
- rain.jpg
- snow.jpg
- storm.jpg

---

*사업은 아니지만, 남길 가치는 있는 프로젝트.*

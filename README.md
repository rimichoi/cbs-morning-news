# CBS 아침뉴스 팟캐스트 (Unofficial PWA)

매일 아침 CBS 표준FM에서 방송되는 'CBS 아침뉴스' 다시듣기를 편리하게 제공하는 모바일 웹앱입니다.
공식 앱 없이도 브라우저에서 가볍게 청취할 수 있으며, **PWA(Progressive Web App)** 기술을 적용하여 앱처럼 홈 화면에 설치해 사용할 수 있습니다.

## ✨ 주요 기능

- **최신 뉴스 자동 업데이트**: CBS 공식 게시판 데이터를 실시간으로 가져와 목록을 보여줍니다.
- **연속 재생**: 현재 뉴스가 끝나면 자동으로 다음 날짜(과거)의 뉴스를 이어 재생합니다.
- **배속 재생**: `1.0x` ~ `2.0x`까지 재생 속도를 자유롭게 조절하여 뉴스를 빠르게 청취할 수 있습니다.
- **오프라인 모드**: 한 번 방문한 페이지와 뉴스 목록은 캐싱되어 인터넷이 불안정한 환경에서도 기본 UI가 로드됩니다.
- **모바일 최적화**: iOS 및 Android 스타일을 고려한 깔끔한 UI와 터치 친화적인 컨트롤을 제공합니다.
- **https 지원**: 혼합 콘텐츠(Mixed Content) 문제를 방지하기 위해 오디오 URL을 자동으로 HTTPS로 변환합니다.

## 🛠 기술 스택

- **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **PWA**: Service Worker, Web App Manifest (Offline support, Add to Home Screen)
- **Architecture**:
  - `index.html`: 구조 (Markup)
  - `styles.css`: 디자인 (Style)
  - `app.js`: 로직 (Logic)
  - `sw.js`: 캐싱 및 오프라인 지원 (Service Worker)

## 🚀 사용 방법

### 웹에서 바로 사용하기
GitHub Pages 등을 통해 배포된 URL로 접속합니다.
(배포 후 본인의 URL로 수정해서 사용하세요: `https://[Your-GitHub-ID].github.io/cbs-morning-news`)

### 로컬에서 실행하기

1. 이 저장소를 클론합니다.
   ```bash
   git clone https://github.com/your-username/cbs-morning-news.git
   ```
2. 폴더로 이동합니다.
   ```bash
   cd cbs-morning-news
   ```
3. 로컬 웹 서버를 실행합니다. (Service Worker 테스트를 위해 필요)
   - **VS Code**: 'Live Server' 확장 프로그램 사용 (추천)
   - **Python**: `python -m http.server`
   - **Node.js**: `npx http-server`
4. 브라우저에서 `http://localhost:포트번호`로 접속합니다.

## 📱 앱 설치 방법 (PWA)

웹사이트에 접속 후 브라우저 기능을 이용해 설치할 수 있습니다.

- **iPhone (Safari)**: 하단 '공유' 버튼 클릭 → '홈 화면에 추가' 선택
- **Android (Chrome)**: 상단 메뉴(⋮) 클릭 → '앱 설치' 또는 '홈 화면에 추가' 선택

## ⚠️ 저작권 및 고지사항

- 본 프로젝트는 개인적인 학습 및 편의를 위해 제작된 비공식 오픈소스 프로젝트입니다.
- 앱에서 재생되는 모든 오디오 콘텐츠의 저작권은 **[CBS i](https://www.cbs.co.kr/)**에 있습니다.
- 제공되는 데이터는 CBS 공식 홈페이지의 공개된 게시판 정보를 기반으로 합니다.

## 📝 라이선스

MIT License

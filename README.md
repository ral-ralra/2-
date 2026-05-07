# FocusFlow Todo

대학생 과제 제출과 포트폴리오 활용을 동시에 고려한, **미니멀 + 모던 스타일**의 TodoList 웹앱입니다.  
Vanilla JavaScript만 사용해 핵심 기능부터 UX 디테일까지 직접 구현했습니다.

## 1) 프로젝트 폴더 구조

```bash
project/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 2) 주요 기능

### 필수 기능
- Todo 추가 / 삭제 / 완료 체크 / 수정
- 전체 / 미완료 / 완료 필터
- 남은 할 일 개수 표시
- 전체 삭제, 완료 항목만 삭제
- `localStorage` 저장 및 새로고침 후 유지
- Enter 키 입력으로 추가
- 빈 입력 방지
- 중복 입력 최소화(공백/대소문자 정규화 비교)
- 현재 날짜 및 시간 실시간 표시

### 고급 기능
- 드래그 앤 드롭 정렬
- 다크모드 토글
- 카드 애니메이션, hover/transition 인터랙션
- 모바일 반응형 디자인
- 저장중 로딩 배지 인터랙션
- 키보드 접근성 및 `aria-label` 적용
- 상태/렌더링/이벤트/저장 로직 분리 구조

## 3) 실행 방법

1. `project` 폴더로 이동
2. `index.html`을 브라우저에서 열기
3. 바로 사용 가능

> 별도 패키지 설치나 빌드 과정이 필요하지 않습니다.

## 4) 코드 설명

### `index.html`
- SEO 메타 태그, 파비콘, 시맨틱 구조(`header`, `main`, `section`, `footer`) 적용
- 입력 폼/필터/목록/대량 삭제 액션을 명확히 분리
- 접근성을 위한 `aria-label`, `aria-live`, `sr-only` 레이블 적용

### `style.css`
- `:root` CSS 변수 기반 디자인 토큰 구성
- 파스텔톤 + 그림자 + 라운드 처리로 앱다운 카드 UI 구현
- 라이트/다크 테마를 CSS 변수 재정의로 일관 관리
- 반응형 미디어쿼리(모바일 최적화)
- 리스트 등장 애니메이션과 버튼 hover 전환 효과 적용

### `script.js`
- `appState`로 중앙 상태 관리 (`todos`, `filter`, `theme`)
- `loadStateFromStorage`, `saveStateToStorage`로 저장 로직 분리
- `renderTodoList`, `renderRemainingCount`, `render`로 렌더링 책임 분리
- 이벤트 핸들러 분리: 추가/삭제/수정/완료체크/필터/드래그/테마
- 예외 처리(`try-catch`) 및 입력 데이터 정규화 함수 제공

## 5) 유지보수 포인트

- 상태 구조 확장 용이: `appState`에 속성 추가만으로 기능 확장 가능
- 저장소 키를 `STORAGE_KEYS` 상수로 관리해 변경 영향 최소화
- 이벤트 위임(`todoList` click/change)으로 성능과 코드 단순성 확보
- UI 렌더링 함수 분리로 디버깅/리팩터링이 쉬움

## 6) 확장 아이디어

- 우선순위(상/중/하) 및 태그 기능
- 마감일(Due Date) + 캘린더 연동
- 검색/정렬 옵션(작성일/완료순/이름순)
- 완료율 차트 시각화
- PWA 적용(오프라인 사용 + 홈 화면 설치)

## 7) 성능 최적화 팁

- 현재는 전체 렌더링 방식이므로, 데이터가 매우 커질 경우 부분 렌더링(diff) 도입
- 드래그 앤 드롭 중 reflow 최소화를 위해 transform 기반 애니메이션 유지
- localStorage 저장 횟수를 줄이기 위해 debounce 저장 전략 적용 가능
- 큰 규모에서는 IndexedDB로 데이터 스토리지 전환 고려

## 8) 개선 포인트

- 수정 기능을 `prompt` 대신 인라인 입력 UI로 개선하면 UX 상승
- 필터 상태를 URL query와 동기화하면 공유/북마크 편의성 증가
- 완료 항목 삭제 전 토스트 알림 + 실행취소(Undo) 제공 가능
- E2E 테스트(Cypress/Playwright) 도입으로 신뢰성 강화

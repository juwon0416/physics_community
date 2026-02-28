# 물리학 커뮤니티 웹사이트 구조 (Website Structure)

이 문서는 `physics_community` 웹사이트 프로젝트의 전체적인 파일 구조와 각 파일/디렉토리의 역할을 설명합니다. 이 프로젝트는 React, Vite, TypeScript, TailwindCSS 및 Supabase를 기반으로 구축되었습니다.

## 🗂️ 디렉토리 트리 구조

```text
physics_community/
├── 📄 README.md                 # 프로젝트 개요 및 실행 방법
├── ⚙️ package.json              # 프로젝트 메타데이터 및 의존성 패키지 목록
├── ⚙️ vite.config.ts            # Vite 번들러 설정 파일
├── ⚙️ tsconfig.json             # TypeScript 설정 파일 (외 tsconfig.*.json)
├── ⚙️ tailwind.config.js        # TailwindCSS 스타일링 설정 파일
├── ⚙️ eslint.config.js          # ESLint 코드 린팅 설정 파일
├── 🌐 index.html                # 웹 애플리케이션의 HTML 진입점
├── 🗄️ *.sql                     # 데이터베이스 스키마 및 마이그레이션 스크립트 (schema.sql 등)
├── 📁 public/                   # 정적 자산 폴더 (이미지, 폰트 등)
└── 📁 src/                      # 애플리케이션 핵심 소스 코드
    ├── ⚛️ main.tsx              # React 애플리케이션 진입점 (DOM 렌더링)
    ├── ⚛️ App.tsx               # 메인 애플리케이션 컴포넌트 (라우팅 설정)
    ├── 🎨 index.css, App.css    # 전역 스타일시트
    ├── 📁 pages/                # 페이지 레벨 컴포넌트 (URL 라우트에 대응)
    │   ├── 📄 Home.tsx              # 메인 홈 화면
    │   ├── 📄 TimelinePage.tsx      # 물리학 개념의 발전 과정을 보여주는 타임라인 페이지
    │   ├── 📄 TopicPage.tsx         # 개별 물리학 주제(개념) 상세 페이지
    │   └── 📄 GraphOverviewPage.tsx # 전체 물리학 개념 간의 관계를 보여주는 그래프 페이지
    ├── 📁 components/           # 재사용 가능한 UI 컴포넌트 모음
    │   ├── 📁 layout/               # 레이아웃 관련 컴포넌트 (Navbar.tsx, Layout.tsx)
    │   ├── 📁 auth/                 # 인증 관련 컴포넌트 (LoginDialog.tsx)
    │   ├── 📁 editor/               # 텍스트 에디터 컴포넌트 (RichTextEditor.tsx)
    │   └── 📁 ui/                   # 기본 UI 요소 (Button, Input, Dialog 등)
    ├── 📁 lib/                  # 유틸리티 함수 및 핵심 비즈니스 로직
    │   ├── 🔌 supabase.ts           # Supabase DB 클라이언트 설정
    │   ├── 🔐 auth.ts               # 사용자 인증 관련 유틸리티
    │   ├── 🕸️ graphModel.ts         # 개념 그래프 데이터 모델
    │   ├── 📊 graphLayout.ts        # 그래프 시각화 레이아웃 계산 알고리즘
    │   ├── 📝 markdownUtils.tsx     # 마크다운 렌더링 유틸리티
    │   └── 🧮 latexMacros.ts        # 수식(LaTeX) 렌더링 매크로 설정
    └── 📁 data/                 # 초기 데이터 처리 및 스크립트
        ├── 🌱 seed.ts               # 데이터베이스 초기 시드 데이터 삽입 스크립트
        ├── 💾 storage.ts            # 파일 스토리지 처리 스크립트
        └── 🔄 migrate_to_db.ts      # 기존 데이터를 DB로 마이그레이션하는 스크립트
```

## 🔗 주요 파일 간의 연결 및 역할 흐름

1. **진입 및 라우팅 (Entry & Routing)**
   - 브라우저가 `index.html`을 로드하여 `src/main.tsx`를 실행합니다.
   - `main.tsx`는 React 트리의 최상위 컴포넌트인 `App.tsx`를 렌더링합니다.
   - `App.tsx`는 **React Router**를 사용하여 사용자가 접속한 URL에 따라 `src/pages/` 디렉토리 안의 적절한 페이지 컴포넌트(`Home.tsx`, `TimelinePage.tsx` 등)를 화면에 표시합니다.

2. **페이지 구성 (Page Composition)**
   - 각 페이지(`src/pages/*`)는 화면의 큰 뼈대를 구성하기 위해 `src/components/layout/`의 `Layout.tsx`와 `Navbar.tsx`를 사용합니다.
   - 페이지 내부의 세부적인 버튼, 모달 창, 입력 폼 등은 `src/components/ui/`에 정의된 공통 컴포넌트들을 가져와서 조립합니다.

3. **데이터 처리 및 비즈니스 로직 (Data & Logic)**
   - 화면에 보여줄 개념 데이터나 그래프 구조, 사용자 정보 등은 컴포넌트가 직접 처리하지 않고 `src/lib/` 안의 유틸리티들을 호출하여 처리합니다.
   - 데이터베이스 읽기/쓰기 작업이 필요할 때는 `lib/supabase.ts`에 정의된 클라이언트를 통해 **Supabase(PostgreSQL)**와 통신합니다. (`schema.sql` 등으로 정의된 구조를 따름)
   - 복잡한 수식이나 마크다운 콘텐츠를 화면에 그릴 때는 `lib/markdownUtils.tsx`와 `lib/latexMacros.ts`를 사용해 변환합니다.

4. **전역 스타일 (Global Styling)**
   - 색상 테마, 폰트, 기본 여백 등의 전역적인 레이아웃 규칙은 `tailwind.config.js`에 정의되며, `src/index.css`를 통해 앱 전체에 적용됩니다. 각 컴포넌트는 Tailwind의 유틸리티 클래스를 사용하여 개별적인 스타일을 조정합니다.

## 💡 개별 분야(Timeline) 페이지 UI 컴포넌트 구조 (TimelinePage.tsx)

항목(예: Quantum Mechanics) 클릭 시 보여지는 **연대순 사건 나열 페이지**(`src/pages/TimelinePage.tsx`)는 외부 라이브러리와 내부에 정의된 공용 UI 컴포넌트들을 조립하여 화면을 구성합니다. 구체적인 컴포넌트 사용 구조는 다음과 같습니다.

1. **상단 상세 정보 영역 (Active Topic Details)**
   - **애니메이션 처리**: `framer-motion` 라이브러리의 `AnimatePresence`와 `motion.div`를 사용하여 사용자가 연도를 클릭해 다른 사건으로 바뀔 때 부드러운 전환 효과를 구현합니다.
   - **연도 및 태그 표시**: `src/components/ui` 폴더에서 가져온 추상화된 `<Badge>` 컴포넌트를 사용하여 연도와 여러 태그들을 일관된 형태로 표시합니다.
   - **버튼 및 아이콘**: 
     - "Read More" 등 주요 조작은 `src/components/ui`의 `<Button>` 컴포넌트를 사용합니다.
     - 화살표, 수정, 삭제 등의 아이콘은 `lucide-react` 패키지에서 `<ArrowRight>`, `<Edit2>`, `<Trash2>` 컴포넌트를 가져와 사용합니다.

2. **하단 타임라인 내비게이션 영역 (Timeline List & Controls)**
   - **조작부**: 
     - 필터링용 검색창: `src/components/ui`의 `<Input>` 컴포넌트를 사용합니다.
     - 좌/우 스크롤 이동 및 항목 추가: `src/components/ui`의 `<Button>` 안에 `lucide-react`의 `<ChevronLeft>`, `<ChevronRight>`, `<Plus>` 아이콘을 감싸서 구현합니다.
   - **데이터 바인딩 리스트**: 
     - 별도의 하위 컴포넌트로 분리하지 않고 `TimelinePage.tsx` 파일 내에서 `.map()` 함수를 통해 커스텀 `<div>` 태그들과 Tailwind CSS 조합으로 원형 연도 마커와 연결선(가로 스크롤 시각화)을 직접 렌더링합니다.

3. **편집/추가 다이얼로그 (Modal)**
   - **모달 창 기본 구조**: `src/components/ui`에서 내보내는 `<Dialog>`, `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>` 컴포넌트를 조합하여 전체 모달의 뼈대를 만듭니다. (일반적으로 Radix UI나 자체 구현된 Headless UI를 래핑한 형태입니다.)
   - **입력 폼**:
     - 텍스트 입력: `src/components/ui`의 `<Input>` 컴포넌트를 재사용합니다. 요약문 같이 긴 글은 기본 `<textarea>` 태그를 사용합니다.
     - 이미지 업로드: `src/components/ui/ImageUpload.tsx`에 구체화된 `<ImageUpload>` 컴포넌트를 가져와 단독으로 사용합니다.

## 📥 데이터 로드 및 렌더링 파이프라인 (Supabase Data Flow)

웹사이트는 Supabase 데이터베이스와 긴밀히 연결되어 있으며, 데이터를 로컬 메모리(State)로 가져와 화면을 그리는 일련의 파이프라인을 거칩니다. 오프라인이나 네트워크 스로틀링 환경을 대비해 Fallback 로직 또한 내장되어 있습니다. 이 흐름에 관여하는 핵심 파일과 유기적 단계는 다음과 같습니다.

1. **데이터 통신 규격 정의 (`src/lib/supabase.ts`)**
   - Supabase 프로젝트 URL과 Anon Key 환경 변수를 주입받아 애플리케이션 전역에서 사용할 수 있는 `supabase` 클라이언트 객체를 생성합니다.

2. **도메인별 데이터 패칭 모듈 (`src/data/storage.ts` & `src/lib/graphModel.ts`)**
   - 컴포넌트 내부에서 직접 SQL이나 API 쿼리를 짜지 않고, 데이터 베이스 접근 계층(Data Access Layer)을 분리합니다.
   - **`storage.ts` (타임라인/상세 조회 담당)**: `getTopics(fieldId)`와 같은 함수들이 포함되며, 특정 분야에 속한 Topic 목록을 Supabase `topics` 테이블에서 필터링해서 받아옵니다.
   - **`graphModel.ts` (네트워크 그래프 담당)**: `fetchGraphModel()` 함수가 `graph_nodes`와 `graph_edges` 테이블에서 전체 지식 그래프 구조를 한 번에 패치(fetch)해 온 뒤, 관계(위계, 시대순)에 맞춰 `GraphModel` 타입 객체로 조립하고 중복을 제거합니다. 

3. **기본 데이터 클라이언트 저장소 Fallback (`src/data/seed.ts`)**
   - Supabase와의 연결이 끊어지거나 빈 테이블 반환 시, 앱이 하얗게 멈추지(Crash) 않도록 하드코딩된 기본 백업본(`FIELDS`, `TIMELINE_TOPICS`) 템플릿을 보관합니다. 패칭 계층 모듈들이 `try-catch`로 에러를 가로챈 뒤, 이 시드 파일에서 데이터를 끌어다 자동으로 대체(Fallback) 반환합니다.

4. **React 컴포넌트 렌더링 (`TimelinePage.tsx`, `GraphOverviewPage.tsx`)**
   - 페이지가 처음 렌더링(`mount`) 될 때, React의 `useEffect` 훅이 발동하여 선언해둔 패칭 함수(예: `loadTopics()`)를 비동기로 호출시킵니다.
   - **상태 보관 (State)**: 데이터가 성공적으로 도착(또는 Seed 데이터로 Fallback)하면 React의 `useState` 배열(`topics`, `nodes`, `edges`)에 데이터를 주입합니다.
   - **DOM 그리기 (Rendering)**: `useState`가 업데이트됨에 따라 React 엔진이 화면을 재렌더링합니다. 
     - **TimelinePage**는 `.map()`을 돌며 각 항목을 수직 스크롤 카드 형태 `<section>`으로 찍어냅니다.
     - **GraphOverviewPage**는 노드 간의 좌표(x, y)를 물리/시간 엔진(`graphLayouts.ts`)에 넘겨 위치를 할당받은 뒤, SVG `<foreignObject>` 기반의 노드와 `<line>` 형태의 엣지로 네트워크를 화면에 그려냅니다.

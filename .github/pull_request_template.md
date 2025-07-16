### **체크리스트**
<!-- 
스스로 만족스러운 과제를 제출했는지 확인하기 위해 체크하는 항목들입니다. 최소한 다음의 기준을 만족시키지 못한다면, 좋은 피드백을 받을 수 없습니다.
-->
- [✔️] 요구사항을 구체화하고 분석하여 작업 가능한 단위로 정리하였는가?
- [✔️] 비즈니스 요구사항을 충족하는 ERD가 작성되었는가?
- [✔️] 핵심 기능에 대한 시퀀스 다이어그램이 작성되었는가?
- [] REST 규칙에 따라서 API를 문서화하였는가? (step4)
- [] 더미데이터를 제공하는 Mock API를 작성하였는가? (step4)

## 📝 커밋 기록

### 요구사항 분석 및 설계
- **요구사항 명세서 작성** ([8f384b9](https://github.com/seuthootDev/hanghae-plus-backend/commit/8f384b945dbceed3e87aee72b5717272e8a9f9e5))
- **API 명세서 작성** ([9a8099c](https://github.com/seuthootDev/hanghae-plus-backend/commit/9a8099c8c1b148ef42f8d0b4e418aa93c1fccaf1))

### 다이어그램 작성
- **유스케이스 다이어그램** ([08d93b9](https://github.com/seuthootDev/hanghae-plus-backend/commit/08d93b973c245888900a2eaf33f562c81c3a5ac1))
  - 주문생성 이후 결제처리하는 방식으로 수정
  - 머메이드 코드에 주석으로 의존관계 표기 (가독성 향상)

- **클래스 다이어그램** ([5c4e66a](https://github.com/seuthootDev/hanghae-plus-backend/commit/5c4e66a3dffb5400495d74c78f3490b91abf3b4f), [39d36a9](https://github.com/seuthootDev/hanghae-plus-backend/commit/39d36a91f9a1cd70f9f7d79c0114b3e9fe0156a4), [2d4c155](https://github.com/seuthootDev/hanghae-plus-backend/commit/2d4c155d69773d0207b76dca53312e622e024bf4))
  - 밸런스 → 포인트로 변경 (더 직관적)
  - 쿠폰서비스에 쿠폰 관련 기능 통합
  - 페이먼트 서비스에서 쿠폰서비스 의존성 제거
  - 오더 서비스에서 쿠폰 사용 유무, 할인률 결정

- **ERD 작성** ([ca29fe8](https://github.com/seuthootDev/hanghae-plus-backend/commit/ca29fe8a8bf0fdd95f22ce43c363b09ecec76d32), [b5f593e](https://github.com/seuthootDev/hanghae-plus-backend/commit/b5f593e919f3e8735f5e51df392cd398c4dc78a6))
  - 밸런스를 포인트로 수정
  - 클래스 다이어그램과 일치하도록 자료형 수정 및 컬럼 추가
  - FK 제거 (실무에서 FK를 잘 안 쓴다는 인사이트 반영, 학습내용 코멘트 추가)

- **시퀀스 다이어그램** ([ecd009a](https://github.com/seuthootDev/hanghae-plus-backend/commit/ecd009a8829e64e1fd073eab926dd2f9907f22e6), [1c20ca](https://github.com/seuthootDev/hanghae-plus-backend/commit/1c20cac4e303f1df6f972c0974bf01f594342b26), [725ace](https://github.com/seuthootDev/hanghae-plus-backend/commit/725acee74ae6c2c63ea2b611f9ee88fe32d01449))
  - 전체 플로우를 도메인 모델로 표현 (이후 기능별로 다시 정리리)
  - 쿠폰 사용을 opt로 변경
  - API 기능별로 구체화하여 분리 작성

- **상태 다이어그램** ([da2455d](https://github.com/seuthootDev/hanghae-plus-backend/commit/da2455d))
  - 작성 완료

## 🔍 리뷰 포인트

### 1. FK 관련 질문
- FK를 제거하면 조인이 많이 일어날 것 같은데, 성능 이슈는 어떻게 될지 궁금합니다.

### 2. 서비스 계층의 책임 분리
- 쿠폰 관련 로직을 쿠폰 서비스에 집중하면, 의존성 주입이 여러 군데에서 발생하게 되는데 이 방식이 올바른 설계인지 궁금합니다.
- (쿠폰을 주문 서비스에서 처리하는 게 나을지, 혹은 쿠폰 서비스가 책임지는 게 맞는지)
- 결제 대기가 있는 웹사이트를 참고해서 주문 생성과 결제 과정을 분리했는데, 이 구조가 실무를 잘 반영하고 있는지 궁금합니다.

## 📊 이번주 KPT 회고

### Keep (유지할 점)
- 요구사항을 단계별로 분석하고 설계한 점
- 다이어그램 간의 일관성을 유지하면서 개선한 점

### Problem (개선할 점)
- 시퀀스 다이어그램의 목적을 처음에는 전체 프로세스의 흐름을 한눈에 보여주는 것이라고 생각했지만 너무 복잡해져서 가독성이 매우 떨어졌음
- 기능별로 쪼개 명확하게 기능별 흐름을 보여주는게 더 효과적이라고 판단하여 구조를 변경

### Try (새롭게 시도할 점)
- prisma-markdow, nestia 등 자동 문서화? 사용해보기
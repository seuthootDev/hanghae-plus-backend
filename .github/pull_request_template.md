## :pushpin: PR 제목 규칙
[STEP14] 정승훈 - (e-commerce)

---
### **핵심 체크리스트** :white_check_mark:

#### one: ranking design 
- [✔] 적절한 설계를 기반으로 랭킹기능이 개발되었는가?
- [✔] 적절한 자료구조를 선택하였는가?

- [`05c2b9c`](https://github.com/whish/hanghae-plus-backend/commit/05c2b9cfe7d0b249a9e1e58dd1e3696086d9003f) [`f625a44`](https://github.com/whish/hanghae-plus-backend/commit/f625a4430ae5e3fa133d4e34b1b5e7381c424d33) [`8590803`](https://github.com/whish/hanghae-plus-backend/commit/85908034a00bca8b6d572e0aaa1584dc107d06d0) [`67c17bf`](https://github.com/whish/hanghae-plus-backend/commit/67c17bfe7eec79d7de22e2ded7ed7272677f35f6) [`dde73a9`](https://github.com/whish/hanghae-plus-backend/commit/dde73a91cab084bcc56ac140a30b4ac1721be920) [`d8be63b`](https://github.com/whish/hanghae-plus-backend/commit/d8be63b5c02cd44b83301b3c9e1fb009ed286285)


#### two: Asynchronous Design 
- [✔] 적절한 설계를 기반으로 쿠폰 발급 or 대기열 기능이 개발되었는가?
- [✔] 적절한 자료구조를 선택하였는가?


#### three: 통합 테스트 
- [✔] redis 테스트 컨테이너를 통해 적절하게 통합 테스트가 작성되었는가?(독립적 테스트 환경을 보장하는가?)
- [✔] 핵심 기능에 대한 흐름이 테스트에서 검증되었는가?
- [`8915db`](https://github.com/whish/hanghae-plus-backend/commit/8915dba3d0bc4e19303bc0c9d1c1262144b5ad40) [`400589`](https://github.com/whish/hanghae-plus-backend/commit/40058922ffb143bbc200458ccc821f888b335ca4) [`027a0f`](https://github.com/whish/hanghae-plus-backend/commit/027a0f55dbe05e0b81eba755be8c54a1db41613e)

---
### STEP 13 Ranking Design
- **이커머스 시나리오**
- [✔] 가장 많이 주문한 상품 랭킹을 Redis 기반으로 설계
- [✔] 설계를 기반으로 개발 및 구현
- [`dde73a9`](https://github.com/whish/hanghae-plus-backend/commit/dde73a91cab084bcc56ac140a30b4ac1721be920) [`d8be63b`](https://github.com/whish/hanghae-plus-backend/commit/d8be63b5c02cd44b83301b3c9e1fb009ed286285)

### STEP 14 Asynchronous Design
- **이커머스 시나리오**
- [✔] 선착순 쿠폰발급 기능에 대해 Redis 기반의 설계
- [✔] 적절하게 동작할 수 있도록 쿠폰 발급 로직을 개선해 제출
- [✔] 시스템 ( 랭킹, 비동기 ) 디자인 설계 및 개발 후 회고 내용을 담은 보고서 제출
- [`05c2b9c`](https://github.com/whish/hanghae-plus-backend/commit/05c2b9cfe7d0b249a9e1e58dd1e3696086d9003f) [`f625a44`](https://github.com/whish/hanghae-plus-backend/commit/f625a4430ae5e3fa133d4e34b1b5e7381c424d33) [`8590803`](https://github.com/whish/hanghae-plus-backend/commit/85908034a00bca8b6d572e0aaa1584dc107d06d0) [`dba41ce`](https://github.com/whish/hanghae-plus-backend/commit/dba41ce1980f0eb5097b60aea2d4503e7bdfd7ee) [`1bc331b`](https://github.com/whish/hanghae-plus-backend/commit/1bc331be59ea39342231293b0c7a830db47d9eb4) [`2647df8`](https://github.com/whish/hanghae-plus-backend/commit/2647df8a64d92ce5ff66d832d1d946c637a2c79c)

### **간단 회고** (3줄 이내)
- **잘한 점**: 레디스를 활용한 방법으로 선착순 쿠폰 발급, 인기상품 조회 기능 리팩토링
- **어려운 점**: 비동기 로직이 어디에 필요한지 생각하는게 어려웠음 쿠폰 발급은 몇 백개 정도로 생각했기 때문에 발급에 비동기 로직이 필요한가에 대한 의문이 있었음 그래서 로깅을 비동기적으로 구현하였는데 이는 랭킹화 이후 DB에 쿠폰이 저장되기 전에 장애가 발생하면, 랭킹에 대한 데이터가 메모리 기반 레디스에서 소멸할수 있기 때문에, 비동기적으로 로깅하여 차후 복귀가 가능한 설계를 위함임
- **다음 시도**: 비동기 로직을 더 많은 기능에 추가
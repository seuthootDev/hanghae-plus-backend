## :pushpin: PR 제목 규칙
[STEP07] 정승훈 - e-commerce

### 리뷰 받고싶은 포인트
 - 다른 도메인의 레포지토리를 직접 가지고 있게 하지 않지 위해서 유스케이스에서 조율하는 방식으로 리팩토링 했습니다.
 - 유스케이스에서는 서비스만 사용하는 방식이 좋을까요 아니면 지금처럼 레포지토리도 사용할 수 있을까요?
 - 제 생각에는 서비스만 사용하게 하려면 서비스의 메서드와 레포지토리의 메서드가 1:1 대응되는 경우가 생길거 같아서 재사용이 가능한 경우가 아니라면 유스케이스에서 레포지토리를 바로 사용해도 괜찮다고 생각했습니다.
---
### **핵심 체크리스트** :white_check_mark:

#### :one: Infrastructure Layer (3개)
- [✔] 기존 설계된 테이블 구조에 대한 개선점이 반영되었는가? (선택)
[932bd34](https://github.com/seuthootDev/hanghae-plus-backend/commit/932bd34713044c6931eb0c2041f53a8a40d637a3)
[e30ec5d](https://github.com/seuthootDev/hanghae-plus-backend/commit/e30ec5d8066771c0ecba4ecddf7dee6927f66525)
- [✔] Repository 및 데이터 접근 계층이 역할에 맞게 분리되어 있는가?
[18c91da](https://github.com/seuthootDev/hanghae-plus-backend/commit/18c91da723acc7230cafc6d670ff2b8cb1a9032e)
- [✔] MySQL 기반으로 연동되고 동작하는가?

#### :two: 통합 테스트 (2개)
- [✔] infrastructure 레이어를 포함하는 통합 테스트가 작성되었는가?
[0751430](https://github.com/seuthootDev/hanghae-plus-backend/commit/07514306424a3f14e7cf7087f1945a6a2cd9916c)
- [✔] 핵심 기능에 대한 흐름이 테스트에서 검증되었는가?

#### :three: DB 성능 최적화 (3개)
- [ ] 조회 성능 저하 가능성이 있는 기능을 식별하였는가? (step08)
- [ ] 쿼리 실행계획(Explain) 기반으로 문제를 분석하였는가? (step08)
- [ ] 인덱스 설계 또는 쿼리 구조 개선 등 해결방안을 도출하였는가? (step08)

---
#### STEP07
- [✔] 테이블 구조 개선안 (선택)
932bd34713044c6931eb0c2041f53a8a40d637a3
e30ec5d8066771c0ecba4ecddf7dee6927f66525
- [✔] Infrastructure Layer 구성
- [✔] 기능별 통합 테스트
07514306424a3f14e7cf7087f1945a6a2cd9916c

#### STEP08
- [ ] 조회 성능 저하 기능 식별
- [ ] 쿼리 실행계획 기반 문제 분석
- [ ] 인덱스/쿼리 재설계 및 개선안 도출

### **간단 회고** (3줄 이내)
- **잘한 점**: 지난주 미흡했던 클린 아키텍처 구조 보완
- **어려운 점**: 요구사항 외 추가적인 기능들이 미비함함
- **다음 시도**: 동시성 처리 구현
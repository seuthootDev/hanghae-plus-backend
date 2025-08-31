## :pushpin: PR 제목 규칙
[STEP15] 정승훈 - (e-commerce)

---
### STEP 15 Application Event
- [✔️] 주문/예약 정보를 원 트랜잭션이 종료된 이후에 전송
- [✔️] 주문/예약 정보를 전달하는 부가 로직에 대한 관심사를 메인 서비스에서 분리

**커밋 기록**
- [`5bcca22`](https://github.com/seuthootDev/hanghae-plus-backend/commit/5bcca22920c2e9a8e30e1a46eae1e7b8deae0188) - 이벤트 정의
- [`e78b24a`](https://github.com/seuthootDev/hanghae-plus-backend/commit/e78b24a1403efb0dea640da65b48fee55e2f70f7) - 이벤트 버스 인터페이스 및 구현체
- [`aadc386`](https://github.com/seuthootDev/hanghae-plus-backend/commit/aadc38665f2edf1de5ef111ffd626617adaab8e6) - 데이터 전송 Mock API
- [`c1f0515`](https://github.com/seuthootDev/hanghae-plus-backend/commit/c1f051564e7ae1cb190c583c12bdcdcc322dc995) -  이벤트 발행
- [`aff58f5`](https://github.com/seuthootDev/hanghae-plus-backend/commit/aff58f5e43b65b2fe611dd293c133eb371b7579b) -  이벤트 핸들러
- [`628f329`](https://github.com/seuthootDev/hanghae-plus-backend/commit/628f329ca458a79466d9d48090ecb25ec2924f3b) - 테스트 코드


### STEP 16 Transaction Diagnosis
- [✔️] 도메인별로 트랜잭션이 분리되었을 때 발생 가능한 문제 파악
- [✔️] 트랜잭션이 분리되더라도 데이터 일관성을 보장할 수 있는 분산 트랜잭션 설계 
- [`8021b3c`](https://github.com/seuthootDev/hanghae-plus-backend/commit/8021b3c40e45326f213e1f1ada17b5a49f7f70d3) - 설계문서

### **간단 회고** (3줄 이내)
- **잘한 점**: 주문생성과 결제처리를 이벤트 기반으로 구현했습니다. 주문생성 시 10분의 결제시간을 부여하고, Redis에 TTL을 설정하여 시간 만료 시 보상 트랜잭션이 실행되도록 했습니다.
- **어려운 점**: 보상 트랜잭션의 범위를 어디까지 설정해야 할지 고민했습니다. 결제 처리 중 카드 오류 등은 사용자가 재시도할 수 있으므로 보상 트랜잭션이 불필요하지만, 결제 시간 만료 시에는 주문 생성 시 차감된 재고와 쿠폰을 원복해야 합니다.
- **다음 시도**: 모든 서비스를 이벤트 방식으로 리팩토링하고, 보상 트랜잭션을 체계적으로 구현하겠습니다.


#### 피드백받고 싶은점
- 모놀리식에서 마이크로서비스로 전환할 경우, 기존 트랜잭션은 다른 서비스에 API 요청을 보내는 방식이라 속도 저하와 실패 시 보상 트랜잭션 설계가 어렵다고 생각했습니다. 해결 방안으로 이벤트 기반 비동기 처리를 적용하면 속도 문제를 어느정도 해결할 수 있고, 실패 이벤트를 기반으로 보상 트랜잭션을 수행할 수 있습니다. 데이터 일관성을 위해 Saga 패턴을 도입할 수도 있는 것 같습니다(역순 롤백이 데이터 일관성에 도움을 줄거라고 생각).

- 위와 같이 생각해보면 마이크로 서비스에서느 이벤트 기반의 트랜젝션이 필수인거 같은데 다른 방법으로 구현하기도 하나요?
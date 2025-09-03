## :pushpin: PR 제목 규칙
[STEP17] 정승훈 - (e-commerce)

---

### STEP 17 카프카 기초 학습 및 활용
- [✅] 카프카에 대한 기본 개념 학습 문서 작성
- [`문서작성 7d898fa`](https://github.com/seuthootDev/hanghae-plus-backend/commit/7d898fa6e495fdbd0c9a6bc5d40397b6d06c03df) | [`kafka 기본예제 ed4b46b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ed4b46b83fc5228b52751b5f5a6698a29bfbc3c8) | [`kafka 토픽,스트림 예제 36df67b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/36df67be9e6b1bba627af02ceb1b9b701e9fce1f)
- [✅] 실시간 주문/예약 정보를 카프카 메시지로 발행
- [`d1f49fc`](https://github.com/seuthootDev/hanghae-plus-backend/commit/d1f49fc40d75ca1a2230c6e0a57753a597df4c3b) | [`6bec65b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/6bec65b9a48049f0895ba12023ef97e8f3f08021)

### STEP 18 카프카를 활용하여 비즈니스 프로세스 개선
- [] 카프카를 특징을 활용하도록 쿠폰/대기열 설계문서 작성
- [] 설계문서대로 카프카를 활용한 기능 구현

### **간단 회고** (3줄 이내)
- **잘한 점**: Kafka 프로듀서, 컨슈머 예제를 각각의 터미널에서 실행시켜 보면서 메세지를 등록하고, 컨슈밍하는 과정을 직접 실행해봄
- **어려운 점**: 테스트 컨테이너 환경에서 모킹이 아닌 KafkaContainer를 사용해보고 싶었는데 환경 세팅이 잘 되지 않았음
- **다음 시도**: KafkaContainer를 활용한 테스트 진행해보기
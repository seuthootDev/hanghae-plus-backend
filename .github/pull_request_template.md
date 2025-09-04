## :pushpin: PR 제목 규칙
[STEP18] 정승훈 - (e-commerce)

---

### STEP 17 카프카 기초 학습 및 활용
- [✅] 카프카에 대한 기본 개념 학습 문서 작성
- [`문서작성 7d898fa`](https://github.com/seuthootDev/hanghae-plus-backend/commit/7d898fa6e495fdbd0c9a6bc5d40397b6d06c03df) | [`kafka 기본예제 ed4b46b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ed4b46b83fc5228b52751b5f5a6698a29bfbc3c8) | [`kafka 토픽,스트림 예제 36df67b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/36df67be9e6b1bba627af02ceb1b9b701e9fce1f)
- [✅] 실시간 주문 정보를 카프카 메시지로 발행
- [`d1f49fc`](https://github.com/seuthootDev/hanghae-plus-backend/commit/d1f49fc40d75ca1a2230c6e0a57753a597df4c3b) | [`6bec65b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/6bec65b9a48049f0895ba12023ef97e8f3f08021)

### STEP 18 카프카를 활용하여 비즈니스 프로세스 개선
- [✅] 카프카를 특징을 활용하도록 쿠폰 설계문서 작성
- [`문서작성 fcf7bbb`](https://github.com/seuthootDev/hanghae-plus-backend/commit/fcf7bbb0cba01e40c639b35f163ab6dbb9fca47f)
- [✅] 설계문서대로 카프카를 활용한 기능 구현
- [`2b1e911`](https://github.com/seuthootDev/hanghae-plus-backend/commit/2b1e9119ee6a87345448bc0fc47992cd37de7fcf) | [`bde243f`](https://github.com/seuthootDev/hanghae-plus-backend/commit/bde243f0210c173f8df7ea098336fee6c6c968b4) | [`ef0c7a8`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ef0c7a83d7435e40b63333c575df1abb5a9b811d) | [`9751b3b`](https://github.com/seuthootDev/hanghae-plus-backend/commit/9751b3bf9c27072a27ebf4ab0b43c33b3aebeafd) |[`7fb709e`](https://github.com/seuthootDev/hanghae-plus-backend/commit/7fb709e26ffddcc95d297a5a6ccfc51b0a3c22ce) |[`b708c7c`](https://github.com/seuthootDev/hanghae-plus-backend/commit/b708c7c4b2c31b5ef4130d36d7981db53e7fb0d3)   

### **간단 회고** (3줄 이내)
- **잘한 점**: Kafka 프로듀서, 컨슈머 예제를 각각의 터미널에서 실행시켜 보면서 메세지를 등록하고, 컨슈밍하는 과정을 직접 실행해봄
- **어려운 점**: 테스트 컨테이너 환경에서 모킹이 아닌 KafkaContainer를 사용해보고 싶었는데 환경 세팅이 잘 되지 않았음
- **다음 시도**: KafkaContainer를 활용한 테스트 진행해보기


### 피드백 받고 싶은점
- 중요한 것은 아닌것 같지만, 기존 분산락을 통한 쿠폰 발급 로직을 삭제하려다가 문득 2가지 로직을 트래픽에 따라 혼용해서 사용할 수도 있지 않을까? 라는 생각이 들어서 그냥 놔두었습니다. 실무에서 2가지 로직을 모두 구현해놓고 배포 환경이나, 트래픽에 따라서 혼용으로 사용하는 경우도 있을까요?
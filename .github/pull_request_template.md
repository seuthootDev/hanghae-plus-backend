## :pushpin: PR 제목 규칙
[STEP11] 정승훈 - e-commerce

---
### **핵심 체크리스트** :white_check_mark:

#### :one: 분산락 적용 (3개)
- [✔️] 적절한 곳에 분산락이 사용되었는가? 
- [`79a61a7`](https://github.com/seuthootDev/hanghae-plus-backend/commit/79a61a7b7814171293bbbe92dc03a1c4ba1aedc0)
[`0f4c3c0`](https://github.com/seuthootDev/hanghae-plus-backend/commit/0f4c3c09f325e07269a32d9317c087d9ca848c83)
- [✔️] 트랜젝션 순서와 락순서가 보장되었는가?
- [`ae2dcea`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ae2dcea2e024abc2ffe8de389854089a6c4309b7)

#### :two: 통합 테스트 (2개)
- [✔️] infrastructure 레이어를 포함하는 통합 테스트가 작성되었는가?
- [✔️] 핵심 기능에 대한 흐름이 테스트에서 검증되었는가?
- [✔️] 동시성을 검증할 수 있는 테스트코드로 작성 되었는가?
- [✔️] Test Container 가 적용 되었는가?
- [`2d5eebf`](https://github.com/seuthootDev/hanghae-plus-backend/commit/ae2dcea2e024abc2ffe8de3898540892d5eebf0576671b9f0474bce5dec6f36d7a5baa3a6c4309b7) [`08d2c95`](https://github.com/seuthootDev/hanghae-plus-backend/commit/08d2c95bcb382142b85fcf55cbc5de72d25132be)

#### :three: Cache 적용 (3개)
- [ ] 적절하게 Key 적용이 되었는가?

---
#### STEP11
- [✔️] Redis 분산락 적용
- [✔️] Test Container 구성
- [✔️] 기능별 통합 테스트

#### STEP12
- [ ] 캐시 필요한 부분 분석
- [ ] redis 기반의 캐시 적용
- [ ] 성능 개선 등을 포함한 보고서 제출

### **간단 회고** (3줄 이내)
- **잘한 점**: 테스트 컨테이너에서 레디스를 실제로 사용하는 지 검증
- **어려운 점**: 지금 쿠폰 발급은 100개의 요청이 오면 1개만 성공하는 방식인데, 선착순 쿠폰발급이라면 동시에 요청이 오더라도 선착순으로 발급량 만큼이 발급되어야 함 이걸 구현하기 위해서는 펍섭을 구현하는 방법밖에는 없는것 같아서 고민중
- **다음 시도**: 스핀락을 펍섭으로 리팩토링해보기, 프리스마, 마이크로orm으로 리팩토링 해보기
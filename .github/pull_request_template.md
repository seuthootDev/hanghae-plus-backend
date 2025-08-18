## :pushpin: PR 제목 규칙
[STEP12] 정승훈 - e-commerce

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
- [`8090699`](https://github.com/seuthootDev/hanghae-plus-backend/commit/8090699760fd478dbd4a94637d212977613e33b4)
- [✔️] 동시성을 검증할 수 있는 테스트코드로 작성 되었는가?
- [`84d0629`](https://github.com/seuthootDev/hanghae-plus-backend/commit/84d06294e65b5ff86ecb0a5124610e2e0717ceb7)
- [✔️] Test Container 가 적용 되었는가?
- [`2d5eebf`](https://github.com/seuthootDev/hanghae-plus-backend/commit/2d5eebf0576671b9f0474bce5dec6f36d7a5baa3) [`08d2c95`](https://github.com/seuthootDev/hanghae-plus-backend/commit/08d2c95bcb382142b85fcf55cbc5de72d25132be)

#### :three: Cache 적용 (3개)
- [✔️] 적절하게 Key 적용이 되었는가?

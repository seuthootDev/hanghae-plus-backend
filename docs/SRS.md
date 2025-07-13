# 요구사항 명세서

<link rel="stylesheet" href="table-styles.css">

## 1. 기능적 요구사항

<table class="api-table">
  <thead>
    <tr>
      <th style="width: 10%;">ID</th>
      <th style="width: 15%;">분류</th>
      <th style="width: 20%;">기능 항목</th>
      <th style="width: 40%;">설명</th>
      <th style="width: 15%;" class="text-center">비고</th>
    </tr>
  </thead>
  
  <tbody>
    <tr>
      <td class="text-bold">FR-01-01</td>
      <td rowspan="2">잔액</td>
      <td>잔액 충전</td>
      <td>사용자는 잔액을 충전할 수 있다</td>
      <td class="text-center">최소,최대 금액 있음</td>
    </tr>
    <tr>
      <td class="text-bold">FR-01-02</td>
      <td>잔액 조회</td>
      <td>사용자는 잔액을 조회할 수 있다</td>
      <td class="text-center"></td>
    </tr>
    <tr>
      <td class="text-bold">FR-02-01</td>
      <td rowspan="3">상품</td>
      <td>상품 조회</td>
      <td>상품을 검색할 수 있음</td>
      <td class="text-center"></td>
    </tr>
    <tr>
      <td class="text-bold">FR-02-02</td>
      <td>상위 상품 조회</td>
      <td>최근 3일간 가장 많이 팔린 상위 5개 상품 정보 제공</td>
      <td class="text-center"></td>
    </tr>
    <tr>
      <td class="text-bold">FR-02-03</td>
      <td>상품 주문 / 결제</td>
      <td>여러 상품을 한 번에 주문 가능해야 함</td>
      <td class="text-center">쿠폰 사용가능</td>
    </tr>
    <tr>
      <td class="text-bold">FR-03-01</td>
      <td  rowspan="3">쿠폰</td>
      <td>선착순 쿠폰 발급</td>
      <td>선착순 쿠폰을 발급 받을 수 있다</td>
      <td class="text-center"></td>
    </tr>
    <tr>
      <td class="text-bold">FR-03-02</td>
      <td>쿠폰 조회</td>
      <td>보유 쿠폰 목록을 조회할 수 있다</td>
      <td class="text-center">모든 쿠폰 조회</td>
    </tr>
    <tr>
      <td class="text-bold">FR-03-03</td>
      <td>쿠폰 사용</td>
      <td>유효한 쿠폰을 결제 시 사용할 수 있다</td>
      <td class="text-center"></td>
    </tr>
  </tbody>
</table>

## 2. 비기능적 요구사항

<table class="api-table">
  <thead>
    <tr>
      <th style="width: 15%;">ID</th>
      <th style="width: 20%;">항목</th>
      <th style="width: 45%;">설명</th>
      <th style="width: 20%;">기준</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-bold">NFR-01</td>
      <td>성능</td>
      <td>API 응답 시간은 평균 1초 이내여야 한다</td>
      <td>95% 이상 요청에서</td>
    </tr>
    <tr>
      <td class="text-bold">NFR-02</td>
      <td>동시성 처리</td>
      <td>재고 감소 및 잔액 차감 등 상태 변화는 동시 요청에도 정확히 처리되어야 한다</td>
      <td>멀티 스레드/인스턴스 환경에서도 정합성 보장</td>
    </tr>
    <tr>
      <td class="text-bold">NFR-03</td>
      <td>신뢰성</td>
      <td>결제 성공 시 주문 정보는 외부 시스템에 정확히 전송되어야 한다</td>
      <td>재시도/로깅 기반 전송 실패 대응 포함</td>
    </tr>
    <tr>
      <td class="text-bold">NFR-04</td>
      <td>통계 정확도</td>
      <td>인기 상품 통계는 최신 주문 데이터를 기반으로 정확히 계산되어야 한다</td>
      <td>최근 3일, Top 5 기준</td>
    </tr>
    <tr>
      <td class="text-bold">NFR-05</td>
      <td>테스트 커버리지</td>
      <td>모든 주요 기능은 단위 테스트를 포함해야 한다</td>
      <td>기능별 1개 이상 테스트</td>
    </tr>
  </tbody>
</table>
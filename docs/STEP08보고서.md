# STEP08 - DB 성능 최적화 보고서

## 1. 조회 성능 저하 가능성이 있는 기능 식별

### 1.1 주요 성능 저하 기능
| 기능 | 쿼리 패턴 | 성능 저하 원인 | 해결 방안 |
|------|------------|----------------|-----------|
| 사용자별 주문 조회 | `WHERE userId = ?` | `orders.userId` 인덱스 없음 | ✅ 인덱스 추가 |
| 상태별 주문 조회 | `WHERE status = ?` | `orders.status` 인덱스 없음 | ✅ 인덱스 추가 |
| 사용자별 쿠폰 조회 | `WHERE userId = ?` | `coupons.userId` 인덱스 없음 | ✅ 인덱스 추가 |
| 사용된/미사용 쿠폰 조회 | `WHERE isUsed = ?` | `coupons.isUsed` 인덱스 없음 | ✅ 인덱스 추가 |
| 카테고리별 상품 조회 | `WHERE category = ?` | `products.category` 인덱스 없음 | ✅ 인덱스 추가 |
| 인기 상품 조회 | `ORDER BY salesCount DESC` | `product_sales_aggregation.productId` 인덱스 없음 | ✅ 인덱스 추가 |

## 2. 쿼리 실행계획 분석

### 2.1 인덱스 적용 전 상황
```sql
EXPLAIN SELECT * FROM orders WHERE userId = 1;
```
**결과**: `type: ALL` (전체 테이블 스캔) - O(n) 복잡도

### 2.2 인덱스 적용 후 개선된 상황
```sql
EXPLAIN SELECT * FROM orders WHERE userId = 1;
```
**결과**: `type: ref` (인덱스 사용) - O(log n) 복잡도

## 3. 최적화 방안

### 3.1 인덱스 설계
```sql
-- 핵심 인덱스 추가 완료
CREATE INDEX idx_orders_user_id ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_coupons_user_id ON coupons(userId);
CREATE INDEX idx_coupons_is_used ON coupons(isUsed);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_product_sales_product_id ON product_sales_aggregation(productId);
```

### 3.2 쿼리 최적화
```sql
-- SELECT 컬럼 명시
SELECT id, userId, totalAmount, status FROM orders WHERE userId = 1;

-- 페이지네이션 적용
SELECT * FROM orders WHERE userId = 1 LIMIT 20 OFFSET 0;
```

## 4. 결론

1. **✅ 단일 컬럼 인덱스 추가**: 모든 식별된 컬럼에 인덱스 적용 완료
2. **쿼리 최적화**: SELECT 컬럼 명시 및 LIMIT 적용
3. **모니터링 설정**: 느린 쿼리 로그 활성화
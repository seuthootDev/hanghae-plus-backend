@echo off
echo 🚀 Redis 캐시 성능 테스트 실행
echo ================================

REM API URL 설정 (필요시 수정)
set API_URL=http://localhost:3000

echo 📍 API URL: %API_URL%
echo.

REM 결과 디렉토리 생성
if not exist "results" mkdir results

echo 🧪 1. 캐시 성능 테스트 실행 중...
k6 run -e API_URL=%API_URL% --out json=results/cache-performance.json cache-performance.k6.js

echo.
echo 🔄 2. 캐시 무효화 테스트 실행 중...
k6 run -e API_URL=%API_URL% --out json=results/cache-invalidation.json cache-invalidation.k6.js

echo.
echo ✅ 모든 테스트 완료!
echo 📊 결과 파일 위치: performance/results/
echo.
pause


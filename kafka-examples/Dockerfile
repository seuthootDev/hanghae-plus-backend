FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출 (카프카 UI용)
EXPOSE 3000

# 기본 명령어
CMD ["npm", "run", "start:producer"]

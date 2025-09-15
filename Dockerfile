FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Node.js 18에서 crypto 모듈을 전역으로 사용할 수 있도록 설정
# IPv4 우선 사용으로 Docker 네트워크 문제 해결
ENV NODE_OPTIONS="--experimental-global-webcrypto --dns-result-order=ipv4first"
ENV NODE_NO_WARNINGS=1

CMD ["npm", "run", "start:prod"] 
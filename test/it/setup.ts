import { DataSource } from "typeorm";
import * as fs from "fs";
import { MySqlContainer } from "@testcontainers/mysql";
import { RedisContainer } from "@testcontainers/redis";
import { getDatasource } from "./util";

const init = async () => {
  await Promise.all([initMysql(), initRedis()]);
};

const initMysql = async () => {
  const mysql = await new MySqlContainer("mysql:8")
    .withDatabase("dbname")
    .withUser("root")
    .withRootPassword("pw")
    .start();

  global.mysql = mysql;

  process.env.DB_HOST = mysql.getHost();
  process.env.DB_PORT = mysql.getPort().toString();
  process.env.DB_USERNAME = mysql.getUsername();
  process.env.DB_PASSWORD = mysql.getUserPassword();
  process.env.DB_DATABASE = mysql.getDatabase();
  process.env.DB_LOGGING_ENABLED = "true";

  const datasource = await getDatasource();
  await datasource.runMigrations();
  await insertTestData(datasource);
};

const initRedis = async () => {
  const redis = await new RedisContainer("redis:7-alpine")
    .withExposedPorts(6379)
    .start();

  global.redis = redis;

  process.env.REDIS_HOST = redis.getHost();
  process.env.REDIS_PORT = redis.getMappedPort(6379).toString();
  process.env.NODE_ENV = "test"; // 테스트 환경이지만 실제 Redis 사용

  console.log(`🌐 Redis 환경변수 설정:`);
  console.log(`   - REDIS_HOST: ${process.env.REDIS_HOST}`);
  console.log(`   - REDIS_PORT: ${process.env.REDIS_PORT}`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);

  // Redis가 완전히 준비될 때까지 대기
  await waitForRedis(redis.getHost(), redis.getMappedPort(6379));
  
  console.log(`🐳 Redis 컨테이너 정보:`);
  console.log(`   - 컨테이너 ID: ${redis.getId()}`);
  console.log(`   - 호스트: ${redis.getHost()}`);
  console.log(`   - 포트: ${redis.getMappedPort(6379)}`);
  console.log(`   - 내부 포트: 6379`);
};

// Redis 연결 대기 함수
const waitForRedis = async (host: string, port: number): Promise<void> => {
  const maxRetries = 30;
  const retryDelay = 1000; // 1초

  for (let i = 0; i < maxRetries; i++) {
    try {
      const net = require('net');
      const socket = new net.Socket();
      
      await new Promise<void>((resolve, reject) => {
        socket.setTimeout(5000);
        socket.connect(port, host, () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', reject);
        socket.on('timeout', () => reject(new Error('Connection timeout')));
      });
      
      console.log(`✅ Redis 연결 성공: ${host}:${port}`);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Redis 연결 실패: ${host}:${port} - ${error.message}`);
      }
      console.log(`⏳ Redis 연결 대기 중... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

const insertTestData = async (datasource: DataSource) => {
  const importSql = fs.readFileSync("./test/it/import.sql").toString();
  for (const sql of importSql.split(";").filter((s) => s.trim() !== "")) {
    await datasource.query(sql);
  }
};

export default init;

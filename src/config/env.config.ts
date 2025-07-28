export const envConfig = {
  // JWT 설정
  jwt: {
    secret: (process.env.JWT_SECRET || 'hanghae-plus-secret') as string,
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
  },

  // 비밀번호 해싱 설정
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },

  // 관리자 계정 설정
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: process.env.ADMIN_NAME || 'admin',
  },

  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'hanghae_plus',
    loggingEnabled: process.env.DB_LOGGING_ENABLED === 'true',
  },

  // 애플리케이션 설정
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
}; 
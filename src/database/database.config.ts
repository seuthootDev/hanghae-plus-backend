export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  logging: boolean;
  family?: number;
}

export const dbConfig = () => ({
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    database: process.env.DB_DATABASE || "dbname",
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "pw",
    logging: process.env.DB_LOGGING_ENABLED == "true" || false,
    // IPv4 강제 사용
    family: 4,
  } as DatabaseConfig,
});

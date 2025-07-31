import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTeams1709499839546 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS users;");
  }
}

export class AddProductSalesAggregation1709499839547 implements MigrationInterface {
  name = 'AddProductSalesAggregation1709499839547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_sales_aggregation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        sales_count INT DEFAULT 0,
        total_revenue INT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sales_count (sales_count DESC),
        INDEX idx_last_updated (last_updated DESC)
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_sales_aggregation`);
  }
}

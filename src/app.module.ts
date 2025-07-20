import { Module } from "@nestjs/common";
// import { DatabaseModule } from "./database/database.module";
import { UserController } from "./users/controllers/user.controller";

@Module({
  imports: [], // DatabaseModule 주석처리
  controllers: [UserController],
  providers: [],
})
export class AppModule {}

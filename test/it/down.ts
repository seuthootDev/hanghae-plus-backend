import { getDatasource } from "./util";

const down = async () => {
  await global.mysql.stop();
  if (global.redis) {
    await global.redis.stop();
  }
  await (await getDatasource()).destroy();
};

export default down;

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";
import { configuration } from "./configuration";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const dbConfig = configuration().database;

const AppDataSource = new DataSource(
  dbConfig.url
    ? {
        type: "postgres",
        url: dbConfig.url,
        entities: [__dirname + "/../**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/../migrations/*{.ts,.js}"],
        synchronize: dbConfig.synchronize,
        logging: dbConfig.logging,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
      }
    : {
        type: "postgres",
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        entities: [__dirname + "/../**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/../migrations/*{.ts,.js}"],
        synchronize: dbConfig.synchronize,
        logging: dbConfig.logging,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
      },
);

export default AppDataSource;

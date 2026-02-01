import { DataSource } from "typeorm";
import { HealingContent } from "./modules/healing/entities/healing-content.entity";
import {
  PostCategory,
  CommunityPost,
} from "./modules/community/entities/community.entity";
import { Tenant } from "./modules/tenants/entities/tenant.entity";
import { Profile } from "./modules/users/entities/profile.entity";
import { config } from "dotenv";
import { resolve } from "path";
import * as bcrypt from "bcrypt";

config({ path: resolve(__dirname, "../.env") });

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "123056",
  database: process.env.DB_DATABASE || "mindcareai",
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  synchronize: false,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    const healingRepo = AppDataSource.getRepository(HealingContent);
    const categoryRepo = AppDataSource.getRepository(PostCategory);
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const profileRepo = AppDataSource.getRepository(Profile);
    const postRepo = AppDataSource.getRepository(CommunityPost);

    let testUserId = "";

    // 0. Seed Test User
    console.log("Checking for test users...");
    const testTenant = await tenantRepo.findOne({
      where: { username: "testuser" },
    });
    if (!testTenant) {
      console.log("Creating testuser...");
      const hashedPassword = await bcrypt.hash("123456", 10);
      const tenant = tenantRepo.create({
        username: "testuser",
        password: hashedPassword,
        display_name: "测试用户",
        email: "test@example.com",
      });
      const savedTenant = await tenantRepo.save(tenant);
      testUserId = savedTenant.id;

      const profile = profileRepo.create({
        id: savedTenant.id,
        username: savedTenant.username,
        full_name: savedTenant.display_name,
        role: "user",
      });
      await profileRepo.save(profile);
    } else {
      console.log("testuser already exists.");
      testUserId = testTenant.id;
    }

    const doctorTenant = await tenantRepo.findOne({
      where: { username: "doctor" },
    });
    if (!doctorTenant) {
      console.log("Creating doctor...");
      const doctorHashedPassword = await bcrypt.hash("123456", 10);
      const doctorTenant = tenantRepo.create({
        username: "doctor",
        password: doctorHashedPassword,
        display_name: "李医生",
        email: "doctor@example.com",
      });
      const savedDoctorTenant = await tenantRepo.save(doctorTenant);
      const doctorProfile = profileRepo.create({
        id: savedDoctorTenant.id,
        username: savedDoctorTenant.username,
        full_name: "李医生",
        role: "doctor",
      });
      await profileRepo.save(doctorProfile);
    }

    // 1. Seed Healing Contents
    const count = await healingRepo.count();
    if (count === 0) {
      console.log("Seeding healing contents...");
      const contents = [
        {
          title: "5分钟正念呼吸",
          description: "简单的呼吸引导，帮助你找回当下的平静",
          category: "relax",
          content_type: "audio",
          duration: 300,
          tags: ["呼吸", "正念", "快速"],
        },
        {
          title: "深夜助眠冥想",
          description: "舒缓的身心放松，引导你进入深度睡眠",
          category: "sleep",
          content_type: "audio",
          duration: 1200,
          tags: ["睡眠", "放松", "深夜"],
        },
        {
          title: "高效专注练习",
          description: "提升注意力的白噪音与引导",
          category: "focus",
          content_type: "audio",
          duration: 1500,
          tags: ["专注", "工作", "学习"],
        },
      ];
      await healingRepo.save(contents);
      console.log("Healing contents seeded!");
    }

    // 2. Seed Community Categories
    const catCount = await categoryRepo.count();
    if (catCount === 0) {
      console.log("Seeding community categories...");
      const categories = [
        { name: "情绪树洞", description: "在这里倾诉你的喜怒哀乐" },
        { name: "康复经验", description: "分享你的康复历程" },
        { name: "互助小组", description: "寻找志同道合的小伙伴" },
      ];
      await categoryRepo.save(categories);
      console.log("Community categories seeded!");
    }

    // 3. Seed some initial posts
    const postCount = await postRepo.count();
    console.log(`Current community post count: ${postCount}`);
    if (postCount === 0 && testUserId) {
      console.log("Finding categories for posts...");
      const categories = await categoryRepo.find();
      console.log(`Found ${categories.length} categories.`);
      const treeHole = categories.find((c) => c.name === "情绪树洞");
      const recovery = categories.find((c) => c.name === "康复经验");

      if (treeHole) {
        console.log("Adding tree hole posts...");
        await postRepo.save([
          {
            user_id: testUserId,
            anonymous_name: "温暖的小太阳",
            title: "今天心情有点低落",
            content: "感觉压力好大，希望大家都能好好的。",
            category_id: treeHole.id,
            like_count: 5,
            comment_count: 2,
          },
          {
            user_id: testUserId,
            anonymous_name: "星光",
            title: "终于完成了一天的挑战",
            content: "虽然很累，但是很有成就感！",
            category_id: treeHole.id,
            like_count: 12,
            comment_count: 1,
          },
        ]);
      } else {
        console.log('Category "情绪树洞" not found!');
      }

      if (recovery) {
        console.log("Adding recovery story...");
        await postRepo.save([
          {
            user_id: testUserId,
            anonymous_name: "重生者",
            title: "我的康复历程分享",
            content:
              "经过三个月的冥想和日常记录，我感觉到自己的情绪状态有了明显的改善。希望这些经验能帮到大家。",
            category_id: recovery.id,
            is_recovery_story: true,
            like_count: 45,
            comment_count: 8,
          },
        ]);
      } else {
        console.log('Category "康复经验" not found!');
      }
      console.log("Community posts seeded!");
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import Member from "../src/models/Member";

// Load .env.local manually since this is a standalone script
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Member.deleteMany({});
    console.log("Cleared existing members");

    // Thủy Tổ (Ông nội)
    const grandPa = await Member.create({
      name: "Phạm Văn A",
      gender: "male",
      birthDate: new Date("1930-01-01"),
      deathDate: new Date("2010-05-15"),
      address: "Hà Nội, Việt Nam",
      bio: "Người sáng lập gia tộc họ Phạm tại Hà Nội.",
      culturalInfo: {
        title: "Thủy Tổ",
        generation: 1,
      },
    });

    // Bà nội
    const grandMa = await Member.create({
      name: "Nguyễn Thị B",
      gender: "female",
      birthDate: new Date("1935-02-10"),
      deathDate: new Date("2015-08-20"),
      spouseId: grandPa._id,
      bio: "Vợ ông Phạm Văn A.",
    });

    // Cập nhật spouseId cho Thủy Tổ
    grandPa.spouseId = grandMa._id;
    await grandPa.save();

    // Cha (Đời 2)
    const father1 = await Member.create({
      name: "Phạm Văn C",
      gender: "male",
      birthDate: new Date("1960-05-10"),
      parentId: grandPa._id,
      address: "Hà Nội",
      job: "Giáo viên",
      culturalInfo: {
        generation: 2,
      },
    });

    // Mẹ
    const mother1 = await Member.create({
      name: "Trần Thị D",
      gender: "female",
      birthDate: new Date("1962-08-15"),
      spouseId: father1._id,
    });
    father1.spouseId = mother1._id;
    await father1.save();

    // Chú (Đời 2)
    const uncle1 = await Member.create({
      name: "Phạm Văn E",
      gender: "male",
      birthDate: new Date("1965-10-20"),
      parentId: grandPa._id,
      address: "Hồ Chí Minh",
      job: "Kinh doanh",
      culturalInfo: {
        generation: 2,
      },
    });

    // Con của Cha (Đời 3)
    const child1 = await Member.create({
      name: "Phạm Nhật Quang",
      gender: "male",
      birthDate: new Date("1995-02-07"),
      parentId: father1._id,
      address: "Hà Nội",
      job: "Lập trình viên",
      culturalInfo: {
        generation: 3,
      },
    });

    const child2 = await Member.create({
      name: "Phạm Thị F",
      gender: "female",
      birthDate: new Date("1998-11-20"),
      parentId: father1._id,
      address: "Đà Nẵng",
      culturalInfo: {
        generation: 3,
      },
    });

    console.log("Seeding complete! 7 members added.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();

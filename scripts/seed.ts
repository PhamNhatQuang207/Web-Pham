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

    // Thủy Tổ (Ông nội) - Có 2 vợ
    const grandPa = await Member.create({
      name: "Phạm Văn A (Thủy Tổ)",
      gender: "male",
      birthDate: new Date("1930-01-01"),
      deathDate: new Date("2010-05-15"),
      address: "Hà Nội, Việt Nam",
      bio: "Người sáng lập gia tộc họ Phạm tại Hà Nội. Có 2 người vợ.",
      culturalInfo: {
        title: "Thủy Tổ",
        generation: 1,
      },
    });

    // Vợ Cả
    const grandMa1 = await Member.create({
      name: "Nguyễn Thị B (Vợ Cả)",
      gender: "female",
      birthDate: new Date("1935-02-10"),
      deathDate: new Date("2000-08-20"),
    });

    // Vợ Hai
    const grandMa2 = await Member.create({
      name: "Trần Thị C (Vợ Hai)",
      gender: "female",
      birthDate: new Date("1945-05-15"),
    });

    // Cập nhật spouseIds cho Thủy Tổ
    grandPa.spouseIds = [grandMa1._id, grandMa2._id];
    await grandPa.save();

    grandMa1.spouseIds = [grandPa._id];
    await grandMa1.save();
    
    grandMa2.spouseIds = [grandPa._id];
    await grandMa2.save();

    // ----------------------------------------------------------------------
    // Nhánh Vợ Cả (Con của Ông A và Bà B)
    // ----------------------------------------------------------------------
    
    // Cha 1 (Con vợ cả)
    const father1 = await Member.create({
      name: "Phạm Văn D",
      gender: "male",
      birthDate: new Date("1960-05-10"),
      fatherId: grandPa._id,
      motherId: grandMa1._id,
      address: "Hà Nội",
      job: "Giáo viên",
      culturalInfo: { generation: 2 },
    });

    // Mẹ 1
    const mother1 = await Member.create({
      name: "Lê Thị E",
      gender: "female",
      birthDate: new Date("1962-08-15"),
      spouseIds: [father1._id],
    });
    father1.spouseIds = [mother1._id];
    await father1.save();

    // Con của Cha 1
    const child1 = await Member.create({
      name: "Phạm Nhật Quang",
      gender: "male",
      birthDate: new Date("1995-02-07"),
      fatherId: father1._id,
      motherId: mother1._id,
      address: "Hà Nội",
      job: "Lập trình viên",
      culturalInfo: { generation: 3 },
    });

    // ----------------------------------------------------------------------
    // Nhánh Vợ Hai (Con của Ông A và Bà C)
    // ----------------------------------------------------------------------
    
    // Chú 1 (Con vợ hai)
    const uncle1 = await Member.create({
      name: "Phạm Văn F",
      gender: "male",
      birthDate: new Date("1970-10-20"),
      fatherId: grandPa._id,
      motherId: grandMa2._id,
      address: "Hồ Chí Minh",
      job: "Kinh doanh",
      culturalInfo: { generation: 2 },
    });

    // Cô 1 (Con vợ hai)
    const aunt1 = await Member.create({
      name: "Phạm Thị G",
      gender: "female",
      birthDate: new Date("1975-11-20"),
      fatherId: grandPa._id,
      motherId: grandMa2._id,
      address: "Đà Nẵng",
      culturalInfo: { generation: 2 },
    });

    console.log("Seeding complete! Added polygamous structure.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();

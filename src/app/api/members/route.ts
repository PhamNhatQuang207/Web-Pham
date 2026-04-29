import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    let filter = {};
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { address: { $regex: query, $options: "i" } },
          { "culturalInfo.hanNomName": { $regex: query, $options: "i" } },
        ],
      };
    }

    const members = await Member.find(filter).lean();
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

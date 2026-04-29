import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Member from "@/models/Member";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const member = await Member.findById(id)
      .populate("parentId", "name birthDate gender")
      .populate("spouseId", "name birthDate gender")
      .lean();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member details" },
      { status: 500 }
    );
  }
}

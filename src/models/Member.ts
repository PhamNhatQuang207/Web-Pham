import { Schema, model, models, Types } from "mongoose";

export interface IMember {
  _id: string;
  // Basic info
  name: string;
  birthDate?: Date;
  deathDate?: Date;
  gender: "male" | "female" | "other";
  address?: string;
  job?: string;
  // Relations
  parentId?: Types.ObjectId;
  spouseId?: Types.ObjectId;
  // Documentation
  bio?: string;
  images?: string[];
  // Cultural info
  culturalInfo?: {
    hanNomName?: string;    // Tên Hán-Nôm
    generation?: number;    // Đời thứ
    title?: string;         // Vai vế
  };
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true, index: true },
    birthDate: { type: Date },
    deathDate: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    address: { type: String, trim: true },
    job: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Member" },
    spouseId: { type: Schema.Types.ObjectId, ref: "Member" },
    bio: { type: String },
    images: [{ type: String }],
    culturalInfo: {
      hanNomName: { type: String },
      generation: { type: Number },
      title: { type: String },
    },
  },
  { timestamps: true }
);

// Index for search
MemberSchema.index({ name: "text", address: "text", "culturalInfo.hanNomName": "text" });

const Member = models.Member || model<IMember>("Member", MemberSchema);
export default Member;

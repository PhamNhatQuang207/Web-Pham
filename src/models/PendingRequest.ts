import { Schema, model, models, Types } from "mongoose";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RequestType = "CREATE" | "UPDATE" | "DELETE";

export interface IPendingRequest {
  _id: string;
  submittedBy: Types.ObjectId;      // User who submitted
  memberId?: Types.ObjectId;        // Target member (for UPDATE/DELETE)
  type: RequestType;
  payload: Record<string, unknown>; // The proposed data
  status: RequestStatus;
  reviewedBy?: Types.ObjectId;      // Admin who reviewed
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PendingRequestSchema = new Schema<IPendingRequest>(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    type: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE"],
      required: true,
    },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String },
  },
  { timestamps: true }
);

const PendingRequest =
  models.PendingRequest || model<IPendingRequest>("PendingRequest", PendingRequestSchema);
export default PendingRequest;

import { model, Schema } from "mongoose";
import { IAuthProvider, IsActive, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerID: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, "User name is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },

    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
    password: {
      type: String,
      required: function () {
        return this.auths?.some((auth: any) => auth.provider === "credentials");
      },
    },
    isDeleted: { type: Boolean, default: false },
    picture: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      unique: true,
      sparse: true,
    },

    agentApproved: { type: Boolean, default: false },
    agentCommissionRate: { type: Number },
  },
  { timestamps: true, versionKey: false },
);

export const User = model<IUser>("User", userSchema);

import { Types } from "mongoose";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  AGENT = "AGENT",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerID: string;
}

export interface IUser {
  auths: any;
  [x: string]: any;
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  picture?: string;
  isActive?: IsActive;
  isVerified?: boolean;
  isDeleted?: boolean;
  role: Role;
  wallet?: Types.ObjectId; // referencing the wallet
  agentApproved?: boolean;
  auths: IAuthProvider[];
  agentCommissionRate?: number;
}

import { StatusCodes } from "http-status-codes";
import { IUser, Role } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs";
import AppError from "../../errorHelpers/AppError";
import { envVars } from "../../config/env";
import { userSearchableFields } from "./user.constant";
import QueryBuilder from "../../utils/QueryBuilder";
import mongoose from "mongoose";
import { Wallet } from "../wallet/wallet.model";
import { JwtPayload } from "jsonwebtoken";
import { createUserWithWallet } from "../../utils/createUserWithWallet";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, role, agentCommissionRate, ...rest } = payload;

  if (role === Role.AGENT && !agentCommissionRate) {
    throw new AppError(400, "Agent commission rate is required");
  }

  const userExist = await User.findOne({ email });

  if (userExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User Already Exist");
  }

  if (!password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Password is required");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await createUserWithWallet(
      { email, password: hashedPassword, role, agentCommissionRate, ...rest },
      session,
    );

    await session.commitTransaction();
    session.endSession();
    return user;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  const isUserExist = await User.findById(userId);

  if (!isUserExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }

    if (payload.role === Role.ADMIN && decodedToken.role === Role.AGENT) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }
    if (payload.role === Role.AGENT && decodedToken.role === Role.ADMIN) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized");
    }
  }

  if (payload.password) {
    payload.password = await bcryptjs.hash(
      payload.password,
      envVars.BCRYPT_SALT_ROUND,
    );
  }

  const newUpdateUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdateUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const users = await queryBuilder
    .search(userSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([users.build(), users.getMeta()]);

  return {
    data,
    meta,
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
};

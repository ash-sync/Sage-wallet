import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Wallet } from "./wallet.model";
import { Transaction } from "../transaction/transaction.model";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../transaction/transaction.interface";
import { v4 as uuidv4 } from "uuid";
import QueryBuilder from "../../utils/QueryBuilder";

const getAllWallets = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Wallet.find(), query);
  const wallets = await queryBuilder.filter().sort().paginate().fields();

  const [data, meta] = await Promise.all([wallets.build(), wallets.getMeta()]);

  return {
    data,
    meta,
  };
};

const getSingleWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({
    user: userId,
  }).populate("user", "name email role phone");
  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
  }

  return wallet;
};

const addMoney = async (userId: string, amount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!amount || amount <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid amount");
    }

    const wallet = await Wallet.findOne({
      user: new Types.ObjectId(userId),
    }).session(session);

    console.log(wallet);
    if (!wallet) {
      throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
    }

    if (wallet.status === "blocked") {
      throw new AppError(StatusCodes.FORBIDDEN, "Wallet is blocked");
    }

    wallet.balance += amount;
    await wallet.save({ session });

    await Transaction.create(
      [
        {
          user: userId,
          wallet: wallet._id,
          type: TRANSACTION_TYPE.ADD_MONEY,
          amount,
          status: TRANSACTION_STATUS.COMPLETED,
          referenceId: uuidv4(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      balance: wallet.balance,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const withdrawMoney = async (userId: string, amount: number) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (amount <= 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Amount");
    }

    const wallet = await Wallet.findOne({ user: userId }).session(session);

    if (!wallet) {
      throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
    }

    if (wallet.status === "blocked") {
      throw new AppError(StatusCodes.FORBIDDEN, "Wallet is blocked");
    }

    if (wallet.balance < amount) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient balance");
    }

    wallet.balance -= amount;

    await wallet.save({ session });

    await Transaction.create(
      [
        {
          user: userId,
          wallet: wallet._id,
          type: TRANSACTION_TYPE.WITHDRAW,
          amount,
          status: TRANSACTION_STATUS.COMPLETED,
          referenceId: uuidv4(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Withdrawal successful",
      balance: wallet.balance,
    };
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// admin services
const blockWallet = async (walletId: string) => {
  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
  }

  if (wallet.status === "blocked") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Wallet already blocked");
  }

  wallet.status = "blocked";
  await wallet.save();
  return wallet;
};

const unBlockWallet = async (walletId: string) => {
  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Wallet not found");
  }

  if (wallet.status === "active") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Wallet is already active");
  }

  wallet.status = "active";
  await wallet.save();
  return wallet;
};

export const WalletService = {
  getAllWallets,
  getSingleWallet,
  addMoney,
  withdrawMoney,
  blockWallet,
  unBlockWallet,
};

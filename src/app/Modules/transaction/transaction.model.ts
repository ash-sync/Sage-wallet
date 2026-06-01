import { model, Schema } from "mongoose";
import {
  ITransaction,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "./transaction.interface";
import { v4 as uuidv4 } from "uuid";

const transactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    agent: { type: Schema.Types.ObjectId, ref: "User" },

    amount: { type: Number, required: true },

    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPE),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
    },

    balanceAfterTransaction: { type: Number },

    referenceId: {
      type: String,
      default: uuidv4(), // auto-generate unique referenceId
      unique: true,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema,
);

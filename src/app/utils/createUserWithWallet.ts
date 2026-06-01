// src/utils/createUserWithWallet.ts
import mongoose from "mongoose";
import { User } from "../Modules/user/user.model";
import { Wallet } from "../Modules/wallet/wallet.model";
import { Transaction } from "../Modules/transaction/transaction.model";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../Modules/transaction/transaction.interface";
import { IUser } from "../Modules/user/user.interface";
import { envVars } from "../config/env";
import { v4 as uuidv4 } from "uuid";

export const createUserWithWallet = async (
  payload: Partial<IUser>,
  session: mongoose.ClientSession,
) => {
  const [user] = await User.create([payload], { session });

  const [wallet] = await Wallet.create(
    [
      {
        user: user._id,
        balance: Number(envVars.INITIAL_BALANCE),
      },
    ],
    { session },
  );

  // set the foreign key on user
  user.wallet = wallet._id;
  await user.save({ session });

  // initial deposit transaction so wallet history isn't empty
  await Transaction.create(
    [
      {
        user: user._id,
        wallet: wallet._id,
        type: TRANSACTION_TYPE.ADD_MONEY,
        amount: Number(envVars.INITIAL_BALANCE),
        status: TRANSACTION_STATUS.COMPLETED,
        referenceId: uuidv4(),
      },
    ],
    { session },
  );

  return user;
};

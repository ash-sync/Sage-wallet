import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { WalletService } from "./wallet.service";
import { StatusCodes } from "http-status-codes";

const getAllWallets = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await WalletService.getAllWallets(
    query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "All transactions Retrieved Successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  console.log("DECODED USER", req.user);
  const user = req.user as { userId: string; role: string };

  const wallet = await WalletService.getSingleWallet(user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wallet fetched successfully",
    data: wallet,
  });
});

const addMoney = catchAsync(async (req: Request, res: Response) => {
  console.log("Decoded user", req.user);
  const user = req.user as { userId: string };
  const { amount } = req.body;

  const result = await WalletService.addMoney(user.userId, amount);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Money added successfully",
    data: result,
  });
});

const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as { userId: string };
  const { amount } = req.body;

  const result = await WalletService.withdrawMoney(user.userId, amount);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "withdraw money successfully",
    data: result,
  });
});

const blockWallet = catchAsync(async (req: Request, res: Response) => {
  const { walletId } = req.body;

  const wallet = await WalletService.blockWallet(walletId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wallet blocked successfully",
    data: wallet,
  });
});

const unblockWallet = catchAsync(async (req: Request, res: Response) => {
  const { walletId } = req.body;

  const wallet = await WalletService.unBlockWallet(walletId);

  wallet.status = "active";
  await wallet.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wallet unblocked successfully",
    data: wallet,
  });
});

export const WalletController = {
  getAllWallets,
  getMyWallet,
  addMoney,
  withdrawMoney,
  blockWallet,
  unblockWallet,
};

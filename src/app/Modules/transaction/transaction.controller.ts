import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { TransactionService } from "./transaction.service";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";

interface JWTPayloadWithId {
  userId: string;
  email?: string;
  role?: string;
}

const getTransactionHistory = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JWTPayloadWithId;

    if (!user.userId) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "User ID not found in payload",
      );
    }

    const query = req.query as Record<string, string>;

    const result = await TransactionService.getTransactionHistory(
      user.userId,
      query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Transaction history fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllTransaction = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await TransactionService.getAllTransaction(
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

const sendMoney = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JWTPayloadWithId;
  const senderId = user.userId;
  const receiver = req.body.receiver;
  const amount = req.body.amount;

  const result = await TransactionService.sendMoney(senderId, receiver, amount);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Send money successful",
    data: result,
  });
});

// agent

const agentCashIn = catchAsync(async (req: Request, res: Response) => {
  const agent = req.user as JWTPayloadWithId;
  const agentId = agent.userId;
  const { userId, amount } = req.body;

  const result = await TransactionService.agentCashIn(agentId, userId, amount);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Cash-in successful",
    data: result,
  });
});

const agentCashOut = catchAsync(async (req: Request, res: Response) => {
  const agent = req.user as JWTPayloadWithId;
  const agentId = agent.userId;
  const { userId, amount } = req.body;

  const result = await TransactionService.agentCashOut(agentId, userId, amount);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Cash-out successful",
    data: result,
  });
});

const approvedAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.body;

  const agent = await TransactionService.approveAgent(agentId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Agent approved successfully",
    data: agent,
  });
});

const suspendedAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentId } = req.body;

  const agent = await TransactionService.suspendAgent(agentId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Agent suspended successfully",
    data: agent,
  });
});

export const TransactionController = {
  getTransactionHistory,
  getAllTransaction,
  sendMoney,
  agentCashIn,
  agentCashOut,
  approvedAgent,
  suspendedAgent,
};

import { Router } from "express";
import { UserRoutes } from "../Modules/user/user.route";
import { AuthRoutes } from "../Modules/auth/auth.route";
import { WalletRoutes } from "../Modules/wallet/wallet.route";
import { TransactionRoute } from "../Modules/transaction/transaction.route";
import { OtpRoutes } from "../Modules/otp/otp.route";
// import { WalletRoute } from "../Modules/wallet/wallet.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/wallet",
    route: WalletRoutes,
  },
  {
    path: "/transactions",
    route: TransactionRoute,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

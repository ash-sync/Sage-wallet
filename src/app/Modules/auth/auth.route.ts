import { NextFunction, Request, Response, Router } from "express";
import { AuthControllers } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../user/user.interface";
import passport from "passport";

const router = Router();

router.post("/login", AuthControllers.credentialsLogin);

router.post("/refresh-token", AuthControllers.getNewAccessToken);

router.get(
  "/google",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  },
);

// api/v1/auth/google/callback?state=/booking
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  AuthControllers.googleCallBackController,
);

router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  AuthControllers.changePassword,
);
router.post("/forgot-password", AuthControllers.forgotPassword);
router.post("/logout", AuthControllers.logOut);

export const AuthRoutes = router;

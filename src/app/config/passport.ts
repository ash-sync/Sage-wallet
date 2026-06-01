import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as localStrategy } from "passport-local";
import { User } from "../Modules/user/user.model";
import bcryptjs from "bcryptjs";
import passport from "passport";
import { envVars } from "./env";
import { Role } from "../Modules/user/user.interface";
import mongoose from "mongoose";
import { createUserWithWallet } from "../utils/createUserWithWallet";

passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        const isUserExist = await User.findOne({ email });

        if (!isUserExist) {
          return done("User does not exist");
        }

        const isGoogleAuthenticated = isUserExist.auths.some(
          (providerObjects) => providerObjects.provider === "google",
        );

        if (isGoogleAuthenticated && !isUserExist.password) {
          return done(null, false, {
            message:
              "You have authenticated through Google. If you want to log in with credentials. then at first login with google and set a password and your email and then you can login with email and password",
          });
        }

        const isPasswordMatched = await bcryptjs.compare(
          password as string,
          isUserExist.password as string,
        );

        if (!isPasswordMatched) {
          return done(null, false, { message: "Password does not match" });
        }

        return done(null, isUserExist);
      } catch (error) {
        console.log(error);
        done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: "No email found" });
        }

        let user = await User.findOne({ email });

        if (!user) {
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            user = await createUserWithWallet(
              {
                email,
                name: profile.displayName,
                picture: profile.photos?.[0].value,
                role: Role.USER,
                isVerified: true,
                auths: [{ provider: "google", providerID: profile.id }],
              },
              session,
            );

            await session.commitTransaction();
            session.endSession();
          } catch (error) {
            await session.abortTransaction();
            session.endSession();
            return done(error);
          }
        }

        return done(null, user as any);
      } catch (error) {
        console.log("Google strategy error", error);
        return done(error);
      }
    },
  ),
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
  } catch (error) {
    console.log(error);
    done(error);
  }
});

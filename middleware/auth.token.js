// middleware/checkUser.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

const ACCESS_TOKEN_MAX_AGE =  30 * 1000;
const REFRESH_TOKEN_MAX_AGE =  60 * 60 * 1000;

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
  path: "/",
});

export const checkUser = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      try {
        req.user = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET
        );
        return next();
      } catch (error) {
        // If access token expired or is invalid, try the refresh token.
      }
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.clearCookie("accessToken", cookieOptions(0));
      res.redirect("/login");
    }

    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefresh._id);

    if (!user || user.refreshToken !== refreshToken) {
      res.clearCookie("accessToken", cookieOptions(0));
      res.clearCookie("refreshToken", cookieOptions(0));
      return res.redirect("/login");
    }

    const newAccessToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" }
    );

    res.cookie("accessToken", newAccessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));

    req.user = { _id: user._id, email: user.email };
    return next();
  } catch (error) {
    res.clearCookie("accessToken", cookieOptions(0));
    res.clearCookie("refreshToken", cookieOptions(0));
    return res.redirect("/login");
  }
};

// middleware/checkLogin.js
export const checkLogin = (req, res, next) => {
  res.locals.isLoggedIn = req.cookies.accessToken;
  next();
};
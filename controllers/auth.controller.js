import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const ACCESS_TOKEN_MAX_AGE = 30 * 1000;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 1000;

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge,
  path: "/",
});

export const getHomePage = (req, res) => {
  res.render("home", {
    title: "Home",
  });
};

export const getAboutPage = (req, res) => {
  res.render("about", {
    title: "About",
  });
};

export const getServicesPage = (req, res) => {
  res.render("service", {
    title: "Services",
  });
};

export const getProjectsPage = (req, res) => {
  res.render("project", {
    title: "Projects",
  });
};

export const getContactPage = (req, res) => {
  res.render("contact", {
    title: "Contact",
  });
};

export const getLoginPage = (req, res) => {
  res.render("login", {
    title: "Login",
  });
};

export const PostLoginPage = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
      return res.send("You don't have an account !");
    }

    const isMatch = await bcrypt.compare(password, userInfo.password);
    if (!isMatch) {
      return res.send("Invalid Credentials!");
    }

    const accessToken = jwt.sign(
      { _id: userInfo._id, email: userInfo.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" },
    );

    const refreshToken = jwt.sign(
      { _id: userInfo._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60m" },
    );

    userInfo.refreshToken = refreshToken;
    await userInfo.save();

    res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE),
    );

    return res.redirect("/about");
  } catch (error) {
    return next(error);
  }
};

export const getSignupPage = (req, res) => {
  res.render("signup", {
    title: "Signup",
  });
};

export const PostSignupPage = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send("Email already exists!");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" },
    );

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "60m" },
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE),
    );

    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
};

export const getRefreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "refreshSecret456",
    );
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.redirect("/login");
    }
    const newAccessToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET || "accessSecret123",
      { expiresIn: "30s" },
    );
    res.cookie("accessToken", newAccessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
    res.send("Token refreshed successfully");
  } catch (error) {
    res.redirect("/login")
  }
};

export const getLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken : refreshToken },
        { set: { refreshToken: null } }
      );
    }

    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    return res.redirect("/login");
  } catch (error) {
    return res.status(500).send("Logout failed");
  }
};
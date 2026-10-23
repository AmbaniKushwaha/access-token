import {Router} from "express";
import { getAboutPage, getContactPage, getHomePage, getLoginPage, getLogout, getProjectsPage, getRefreshToken, getServicesPage, getSignupPage, PostLoginPage, PostSignupPage } from "../controllers/auth.controller.js";
import { checkUser } from "../middleware/auth.token.js";
   
export const router = Router();

router.get("/", getHomePage);
router.get("/about", checkUser, getAboutPage);
router.get("/services", checkUser, getServicesPage);
router.get("/projects", checkUser, getProjectsPage);
router.get("/contact", checkUser, getContactPage);

// router.get("/refresh-token", getRefreshToken);

router.get("/login", getLoginPage);
router.post("/login", PostLoginPage);

router.get("/signup", getSignupPage);
router.post("/signup", PostSignupPage);

router.get("/logout",getLogout);
router.post("/logout",getLogout);


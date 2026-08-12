import express, { Router } from "express";
import { addNewAdmin, getAllAdmins, getAllCustomizations, getAllEvents, getAllProducts, getAllSellers, getAllUsers, getSiteConfig, uploadBanner, uploadLogo, updateCategories } from "../controller/admin.controller";
import { isAdmin } from "../../../../packages/middleware/isAdmin";



const router: Router = express.Router();

router.get("/get-all-products", isAdmin, getAllProducts);
router.get("/get-all-events", isAdmin, getAllEvents);
router.get("/get-all-admins",isAdmin,getAllAdmins);
router.get("/get-all-sellers",isAdmin,getAllSellers);
router.get("/get-all-users",isAdmin,getAllUsers);
router.put("/add-new-admin",isAdmin,addNewAdmin);
router.get("/get-all",getAllCustomizations);
router.get("/get-site-config",isAdmin,getSiteConfig);
router.put("/update-categories", isAdmin, updateCategories);
router.post("/upload-logo",isAdmin, uploadLogo);
router.post("/upload-banner", isAdmin, uploadBanner);

export default router;

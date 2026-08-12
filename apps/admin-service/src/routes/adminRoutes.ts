import express, { Router } from "express";
import { addNewAdmin, getAllAdmins, getAllCustomizations, getAllEvents, getAllProducts, getAllSellers, getAllUsers } from "../controller/admin.controller";
import { isAdmin } from "../../../../packages/middleware/isAdmin";



const router: Router = express.Router();

router.get("/get-all-products", isAdmin, getAllProducts);
router.get("/get-all-events", isAdmin, getAllEvents);
router.get("/get-all-admins",isAdmin,getAllAdmins);
router.get("/get-all-sellers",isAdmin,getAllSellers);
router.get("/get-all-users",isAdmin,getAllUsers);
router.put("/add-new-admin",isAdmin,addNewAdmin);
router.get("/get-all",getAllCustomizations);

export default router;

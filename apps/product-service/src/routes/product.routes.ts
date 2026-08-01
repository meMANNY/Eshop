import express, {Router} from "express";
import { createDiscountCodes, deleteDiscountCode, deleteProductImage, getCategories, getDiscountCodes, uploadProductImage } from "../controllers/product.controller";
import { isSeller } from "../../../../packages/middleware/isSeller";

const router: Router = express.Router();

router.get("/get-categories", getCategories);
router.post("/create-discount-code",isSeller,createDiscountCodes);
router.get("/get-discount-codes",isSeller,getDiscountCodes);
router.delete("/delete-discount-code/:id",isSeller,deleteDiscountCode);
router.post("/upload-product-image",isSeller,uploadProductImage);
router.delete("/delete-product-image",isSeller,deleteProductImage);

export default router;
import express, {Router} from "express";
import { createDiscountCodes, createProduct, deleteDiscountCode, deleteProduct, deleteProductImage, getCategories, getDiscountCodes, getShopProducts, restoreProduct, uploadProductImage,getAllProducts, getProductDetails, getFilteredEvents, getFilteredProducts, getFilteredShops,searchProducts } from "../controllers/product.controller";
import { isSeller } from "../../../../packages/middleware/isSeller";

const router: Router = express.Router();

router.get("/get-categories", getCategories);
router.post("/create-discount-code",isSeller,createDiscountCodes);
router.get("/get-discount-codes",isSeller,getDiscountCodes);
router.delete("/delete-discount-code/:id",isSeller,deleteDiscountCode);
router.post("/upload-product-image",isSeller,uploadProductImage);
router.delete("/delete-product-image",isSeller,deleteProductImage);
router.post("/create-product",isSeller,createProduct);
router.get("/get-shop-products",isSeller,getShopProducts);
router.delete("/delete-product/:productId",isSeller,deleteProduct);
router.put("/restore-product/:productId",isSeller,restoreProduct);
router.get("/get-all-products",getAllProducts);
router.get("/get-product/:slug", getProductDetails);
router.get("/get-filtered-products",getFilteredProducts);
router.get("/get-filtered-offers",getFilteredEvents);
router.get("/get-filtered-shops",getFilteredShops);
router.get("/search-products",searchProducts);



export default router;
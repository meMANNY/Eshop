import express, { Router } from "express";
import { isAuthenticated } from "../../../../packages/middleware/isAuthenticated"
import { isSeller } from "../../../../packages/middleware/isSeller"
import { 
  fetchSellerMessages,
  fetchUserMessages,
  getSellerConversations,
  getUserConversations,
  newConversation,
} from "../controller/chatting.controller";

const router: Router = express.Router();

router.post("/create-user-conversationGroup", isAuthenticated, newConversation);
router.get("/get-user-conversations", isAuthenticated, getUserConversations);
router.get(
  "/get-seller-conversations",
  isSeller,
  getSellerConversations
);
router.get(
  "/get-user-messages/:conversationId",
  isAuthenticated,
  fetchUserMessages
);
router.get(
  "/get-seller-messages/:conversationId",
  isSeller,
  fetchSellerMessages
);

export default router;
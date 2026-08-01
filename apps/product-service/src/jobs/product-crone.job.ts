import cron from "node-cron";
import prisma from "../../../../packages/libs/primsa";

/**
 * Permanently removes products that were soft-deleted and whose scheduled
 * deletion time has passed.
 *
 * `deleteProduct` sets `deletedAt = now + 24h` — the moment a product becomes
 * due for permanent removal. So a product is ripe for deletion once
 * `deletedAt <= now`, which is exactly 24 hours after the seller deleted it.
 *
 * Runs once every hour.
 */
export const startProductDeletionCron = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            const now = new Date();

            const { count } = await prisma.products.deleteMany({
                where: {
                    isDeleted: true,
                    deletedAt: {
                        lte: now,
                    },
                },
            });

            if (count > 0) {
                console.log(`[product-cron] Permanently deleted ${count} expired product(s).`);
            }
        } catch (error) {
            console.error("[product-cron] Failed to delete expired products:", error);
        }
    });

    console.log("[product-cron] Product deletion cron scheduled (hourly).");
};

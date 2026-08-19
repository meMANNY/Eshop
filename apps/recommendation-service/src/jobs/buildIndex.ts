import "dotenv/config";
import prisma from "../../../../packages/libs/primsa";
import { closeProducer } from "../../../../packages/utils/kafka/producer";
import { buildSimilarityIndex } from "../services/similarity";

/*
  Entry point for the index build, so it can run from cron, a container job, or
  by hand — anywhere except a shopper's request.

    npm run build-recommendations
*/
buildSimilarityIndex()
  .then((report) => {
    console.log(
      `\n✅ Similarity index built\n` +
        `   products              ${report.products}\n` +
        `   indexed               ${report.indexed}\n` +
        `   buyers seen           ${report.buyers}\n` +
        `   bought-together pairs ${report.boughtTogetherPairs}\n` +
        `   took                  ${report.ms}ms\n`
    );
    if (report.boughtTogetherPairs === 0) {
      console.log(
        "   Note: no co-occurrence yet — every neighbour is content-based.\n" +
          "   That is expected until more buyers have ordered more products.\n"
      );
    }
  })
  .catch((err) => {
    console.error("❌ Index build failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await closeProducer().catch(() => undefined);

    /*
      The index build logs its result through the Kafka log producer, and that
      client retries a connection eight times with exponential backoff. In a
      long-running service that is fine; in a one-shot job it holds the event
      loop open long after the work is done — the first run of this script sat
      there with its output still buffered, looking hung when it had already
      finished.

      The timer is unref'd, so it never keeps the process alive on its own: if
      the loop has drained, the job exits normally and this never fires.
    */
    setTimeout(() => process.exit(process.exitCode ?? 0), 250).unref();
  });

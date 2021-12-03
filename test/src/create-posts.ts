require("dotenv").config();

import programUtil from "./program-util";

/**
 * Helper script which creates posts up to a limit, defined below. This can
 * be used to create a lot of posts for testing or development purposes. You
 * probably want the backend server and TestWeave running as well, which will
 * handle saving the posts to Arweave and caching them for lookup.
 *
 * Adjust the LIMIT value below to change how many posts are created.
 */
const main = async () => {
  const LIMIT = 10;
  console.log(`- Creating ${LIMIT} authors and posts...`);
  await programUtil.createRandomPosts(LIMIT, true);
  console.log("\n - Done!");
};

main();

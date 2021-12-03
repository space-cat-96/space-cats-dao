require("dotenv").config();

import programUtil from "./program-util";

/**
 * Handle creating a new storage account. This should only be run once,
 * unless you want to create a new storage account keypair. After running
 * if will create the storage account on chain and store the storage
 * account keypair locally for future reference.
 */
const main = async () => {
  console.log("- Initializing contract account storage.");
  programUtil.createStorageAccountKeyPair();
  await programUtil.handleInitializeStorageAccount();
  console.log("\n- Done!");
};

main();

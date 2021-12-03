import programUtil from "./program-util";

jest.setTimeout(300_000); // 5 minutes

/**
 * Basic program tests which test the main functionality:
 *
 * - Running garbage collection.
 * - Creating posts.
 * - Creating author accounts and updating their profiles.
 */
describe("Solis", () => {
  /**
   * This test takes a long time because it needs to create up to ~250 posts,
   * so it is skipped under normal conditions.
   */
  test.skip("Storage account garbage collection.", async () => {
    let state = await programUtil.getStorageAccountState();
    const initialIndex = state.index.toNumber();
    const limit = 250;
    const gap = limit - initialIndex;

    // Create posts up to the limit plus 5 more, then garbage collect and
    // assert that the resulting index is equal to 5.
    await programUtil.createRandomPosts(gap + 5, true);
    await programUtil.garbageCollect();

    state = await programUtil.getStorageAccountState();
    const finalIndex = state.index.toNumber();
    expect(finalIndex).toBe(5);
  });

  test("Storage account garbageCollect transaction.", async () => {
    await programUtil.garbageCollect();
  });

  test("Authors can create posts.", async () => {
    await programUtil.createRandomPosts(5);
    const posts = await programUtil.fetchAllPosts();
    expect(posts.length).toBe(5);
  });

  test("Authors can update their profile.", async () => {
    const user = programUtil.generateKeyPair();
    await programUtil.createAuthor(user);
    let bio = "Just another Solana guy";
    let username = null;

    {
      await programUtil.updateAuthorProfile(bio, username, user);
      const { authorAccount } = await programUtil.getAuthorAccount(
        user.publicKey
      );
      const state = await programUtil.getAuthorAccountState(authorAccount);
      expect(state.bio).toBe(bio);
      expect(state.username).toBe("");
    }

    {
      const bio = "I like to buy Solana coins.";
      const username = "solana_coin_guy";
      await programUtil.updateAuthorProfile(bio, username, user);
      const { authorAccount } = await programUtil.getAuthorAccount(
        user.publicKey
      );
      const state = await programUtil.getAuthorAccountState(authorAccount);
      expect(state.bio).toBe(bio);
      expect(state.username).toBe(username);
    }
  });
});

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.GCLOUD_PROJECT = "demo-pesmad";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error("Run only through the local Firestore emulator.");
const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const { getFirestore } = require("firebase-admin/firestore");
const { deleteApp, getApp } = require("firebase-admin/app");
const { loginAccount } = await import("../functions/index.js");
const db = getFirestore(
  "ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e",
);
before(async () => {
  await db
    .doc("users/test-anas")
    .set({
      id: "test-anas",
      username: "Anas",
      password: "fixture-only",
      role: "Superadmin",
      nama: "Fixture",
    });
});
after(async () => {
  await db.terminate();
  await deleteApp(getApp());
});
test("server checks case-insensitive username and returns signed identity without password", async () => {
  const result = await loginAccount.run({
    data: { username: " ANAS ", password: "fixture-only" },
  });
  assert.equal(result.user.id, "test-anas");
  assert.equal(result.user.role, "Superadmin");
  assert.equal("password" in result.user, false);
  const claims = JSON.parse(
    Buffer.from(result.token.split(".")[1], "base64url").toString(),
  );
  assert.equal(claims.uid, "test-anas");
});
test("wrong password and duplicate usernames cannot authenticate", async () => {
  await assert.rejects(
    loginAccount.run({ data: { username: "Anas", password: "wrong" } }),
    { code: "unauthenticated" },
  );
  await db
    .doc("users/duplicate")
    .set({ username: "anas", password: "fixture-only" });
  await assert.rejects(
    loginAccount.run({ data: { username: "Anas", password: "fixture-only" } }),
    { code: "unauthenticated" },
  );
  await db.doc("users/duplicate").delete();
});
test("repeated failed attempts are rate limited", async () => {
  for (let i = 0; i < 10; i++)
    await assert.rejects(
      loginAccount.run({
        data: { username: "missing-user", password: "wrong" },
      }),
      { code: "unauthenticated" },
    );
  await assert.rejects(
    loginAccount.run({ data: { username: "missing-user", password: "wrong" } }),
    { code: "resource-exhausted" },
  );
});

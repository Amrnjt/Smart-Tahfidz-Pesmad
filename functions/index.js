import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { createHash, timingSafeEqual } from "node:crypto";

initializeApp();
const db = getFirestore(
  "ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e",
);
const digest = (value) => createHash("sha256").update(value).digest();

// Bridge existing username accounts to signed Firebase identity. Never trust a browser role.
export const loginAccount = onCall(
  { region: "asia-southeast2", maxInstances: 5 },
  async (request) => {
    const username =
      typeof request.data?.username === "string"
        ? request.data.username.trim().toLowerCase()
        : "";
    const password =
      typeof request.data?.password === "string"
        ? request.data.password.trim()
        : "";
    if (
      !username ||
      !password ||
      username.length > 128 ||
      password.length > 256
    )
      throw new HttpsError("invalid-argument", "Isi username dan password.");
    const limitRef = db.doc(`login_limits/${digest(username).toString("hex")}`);
    await db.runTransaction(async (tx) => {
      const state = (await tx.get(limitRef)).data();
      const now = Date.now();
      const active = state && now - state.startedAt < 15 * 60 * 1000;
      if (active && state.count >= 10)
        throw new HttpsError(
          "resource-exhausted",
          "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
        );
      tx.set(limitRef, {
        startedAt: active ? state.startedAt : now,
        count: active ? state.count + 1 : 1,
      });
    });
    // Existing usernames have mixed case; fail on ambiguity rather than pick the wrong account.
    const users = await db.collection("users").get();
    const matches = users.docs.filter(
      (d) =>
        String(d.data().username || "")
          .trim()
          .toLowerCase() === username,
    );
    if (
      matches.length !== 1 ||
      !timingSafeEqual(
        digest(String(matches[0]?.data().password || "")),
        digest(password),
      )
    )
      throw new HttpsError("unauthenticated", "Username atau password salah.");
    const account = matches[0];
    const { password: omitted, ...user } = account.data();
    const token = await getAuth().createCustomToken(account.id);
    await limitRef.delete();
    return { token, user: { ...user, id: account.id } };
  },
);

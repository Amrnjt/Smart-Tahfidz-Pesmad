import { createRequire } from "node:module";
const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
  projectId: "tonal-garage-pn96h",
});
const db = getFirestore(
  "ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e",
);
const users = await db.collection("users").get();
const matches = users.docs.filter(
  (d) =>
    String(d.data().username || "")
      .trim()
      .toLowerCase() === "anas",
);
if (matches.length !== 1)
  throw new Error(
    "Harus ada tepat satu akun dengan username Anas; tidak ada data diubah.",
  );
const target = matches[0];
await db.runTransaction(async (tx) => {
  const protection = await tx.get(db.doc("security/superadmin"));
  const user = await tx.get(target.ref);
  if (protection.exists && protection.data().userId !== target.id)
    throw new Error("Superadmin lain sudah ditetapkan.");
  if (
    String(user.data()?.username || "")
      .trim()
      .toLowerCase() !== "anas"
  )
    throw new Error("Identitas akun berubah.");
  tx.set(db.doc("security/superadmin"), { userId: target.id });
  tx.update(target.ref, {
    id: target.id,
    role: "Superadmin",
    nama: "Ust. Anas Amrullah",
  });
});
console.log("Superadmin dilindungi:", target.id);

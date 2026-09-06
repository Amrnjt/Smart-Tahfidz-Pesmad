import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

let env;
test('reserved Anas username cannot be duplicated by a client', async () => {
  await assertFails(setDoc(doc(dbFor('admin'), 'users/duplicate-anas'), { id: 'duplicate-anas', username: 'Anas', role: 'Admin' }));
});
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-pesmad",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [id, role, idSantri] of [
      ["anas", "Superadmin", ""],
      ["admin", "Admin", ""],
      ["ustadz", "Ustadz", ""],
      ["wali", "Wali", "STR001"],
      ["other", "Wali", "STR002"],
      ["santri", "Santri", "STR001"],
    ])
      await setDoc(doc(db, "users", id), { id, username: id, role, idSantri });
    await setDoc(doc(db, "security/superadmin"), { userId: "anas" });
    await setDoc(doc(db, "pantauan_config/pantauan-config-001"), {
      id: "pantauan-config-001",
      isEnabled: true,
      lastUpdated: "2026-09-06",
      updatedBy: "admin",
    });
  });
});
const dbFor = (id) => env.authenticatedContext(id).firestore();
const record = () => ({
  id: "STR001_2026-09-06",
  idSantri: "STR001",
  timestamp: "2026-09-06 12:00",
  inputBy: "wali",
  alWaqiah: true,
  alMulk: false,
  alInsyirah: true,
  shubuh: "Jama'ah",
  dzuhur: "Berhalangan",
  ashar: "Sakit",
  maghrib: "Jama'ah",
  isya: "Jama'ah",
});
const recordRef = (db) => doc(db, "wirid_yaumiyyah/STR001_2026-09-06");

test("staff can delete every ordinary role including Admin", async () => {
  for (const id of ["admin", "wali", "other", "santri"])
    await assertSucceeds(deleteDoc(doc(dbFor("ustadz"), "users", id)));
});
test("superadmin cannot be deleted, demoted, or renamed by any app account", async () => {
  for (const id of ["anas", "admin", "ustadz", "wali"]) {
    await assertFails(deleteDoc(doc(dbFor(id), "users/anas")));
    await assertFails(
      updateDoc(doc(dbFor(id), "users/anas"), { role: "Admin" }),
    );
    await assertFails(
      updateDoc(doc(dbFor(id), "users/anas"), { username: "renamed" }),
    );
  }
});
test("protected identity cannot be changed or forged", async () => {
  await assertFails(deleteDoc(doc(dbFor("anas"), "security/superadmin")));
  await assertFails(
    setDoc(doc(dbFor("admin"), "users/forged"), {
      id: "forged",
      role: "Superadmin",
    }),
  );
});
test("wali cannot delete accounts or elevate their role", async () => {
  await assertFails(deleteDoc(doc(dbFor("wali"), "users/admin")));
  await assertFails(
    updateDoc(doc(dbFor("wali"), "users/wali"), { role: "Admin" }),
  );
});
test("wali and superadmin can keep their notification preference without changing role", async () => {
  for (const id of ["wali", "anas"])
    await assertSucceeds(
      updateDoc(doc(dbFor(id), "users", id), {
        notificationPermission: "granted",
      }),
    );
  await assertFails(
    updateDoc(doc(dbFor("wali"), "users/wali"), {
      notificationPermission: "granted",
      role: "Admin",
    }),
  );
});
test("only Admin and Superadmin can change switch", async () => {
  for (const id of ["wali", "ustadz", "santri"])
    await assertFails(
      updateDoc(doc(dbFor(id), "pantauan_config/pantauan-config-001"), {
        isEnabled: false,
        updatedBy: id,
      }),
    );
  for (const id of ["admin", "anas"])
    await assertSucceeds(
      updateDoc(doc(dbFor(id), "pantauan_config/pantauan-config-001"), {
        isEnabled: false,
        updatedBy: id,
      }),
    );
});
test("ON accepts three prayer statuses and daily updates", async () => {
  await assertSucceeds(setDoc(recordRef(dbFor("wali")), record()));
  await assertSucceeds(updateDoc(recordRef(dbFor("wali")), { alMulk: true }));
});
test("OFF blocks new entries and changes to existing entries", async () => {
  await setDoc(recordRef(dbFor("wali")), record());
  await updateDoc(doc(dbFor("admin"), "pantauan_config/pantauan-config-001"), {
    isEnabled: false,
  });
  await assertFails(updateDoc(recordRef(dbFor("wali")), { alMulk: true }));
  await assertFails(
    setDoc(doc(dbFor("wali"), "wirid_yaumiyyah/new"), {
      ...record(),
      id: "new",
    }),
  );
  await assertSucceeds(getDoc(recordRef(dbFor("wali"))));
});
test("wali cannot read or change another child records", async () => {
  await setDoc(recordRef(dbFor("wali")), record());
  await assertFails(getDoc(recordRef(dbFor("other"))));
  await assertFails(
    setDoc(recordRef(dbFor("other")), { ...record(), inputBy: "other" }),
  );
  await assertFails(
    updateDoc(recordRef(dbFor("wali")), { idSantri: "STR002" }),
  );
});
test("invalid prayer, forged author, and nonboolean wirid fail", async () => {
  for (const change of [
    { shubuh: "Sendiri" },
    { inputBy: "admin" },
    { alMulk: "yes" },
  ])
    await assertFails(
      setDoc(recordRef(dbFor("wali")), { ...record(), ...change }),
    );
});
test("anonymous and deleted accounts cannot access the program", async () => {
  await assertFails(
    setDoc(recordRef(env.unauthenticatedContext().firestore()), record()),
  );
  await deleteDoc(doc(dbFor("admin"), "users/wali"));
  await assertFails(setDoc(recordRef(dbFor("wali")), record()));
});

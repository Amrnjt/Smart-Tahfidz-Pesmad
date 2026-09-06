import React, { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { storageService } from "../services/storageService";
import { User, WiridYaumiyyahRecord } from "../types";
import { isAdminRole } from "../utils/roles";

const CONFIG_ID = "pantauan-config-001";
const prayers = [
  ["shubuh", "Subuh"],
  ["dzuhur", "Dzuhur"],
  ["ashar", "Ashar"],
  ["maghrib", "Maghrib"],
  ["isya", "Isya"],
] as const;
const surahs = [
  ["alWaqiah", "Al-Waqi’ah"],
  ["alMulk", "Al-Mulk"],
  ["alInsyirah", "Al-Insyirah"],
] as const;
const statuses = ["Jama'ah", "Berhalangan", "Sakit"] as const;
type Prayer = (typeof prayers)[number][0];
type Form = Pick<WiridYaumiyyahRecord, "alWaqiah" | "alMulk" | "alInsyirah"> &
  Record<Prayer, (typeof statuses)[number] | "">;
const emptyForm = (): Form => ({
  alWaqiah: false,
  alMulk: false,
  alInsyirah: false,
  shubuh: "",
  dzuhur: "",
  ashar: "",
  maghrib: "",
  isya: "",
});
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function ProgramPantauan({ currentUser }: { currentUser: User }) {
  const admin = isAdminRole(currentUser.role);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(today);
  const [form, setForm] = useState<Form>(emptyForm);
  const [records, setRecords] = useState<WiridYaumiyyahRecord[]>([]);
  const [recordsReady, setRecordsReady] = useState(admin);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "pantauan_config", CONFIG_ID),
        { includeMetadataChanges: true },
        (snap) => {
          // Cached ON state must not enable submission while disconnected.
          setReady(!snap.metadata.fromCache);
          setEnabled(
            !snap.metadata.fromCache && snap.data()?.isEnabled === true,
          );
        },
        () => {
          setReady(false);
          setEnabled(false);
          setMessage(
            "Status program belum dapat dimuat. Periksa koneksi atau izin akses.",
          );
        },
      ),
    [],
  );

  useEffect(() => {
    if (admin || !currentUser.idSantri) return;
    setRecordsReady(false);
    return onSnapshot(
      query(
        collection(db, "wirid_yaumiyyah"),
        where("idSantri", "==", currentUser.idSantri),
      ),
      { includeMetadataChanges: true },
      (snap) => {
        setRecords(
          snap.docs
            .map((d) => ({ ...d.data(), id: d.id }) as WiridYaumiyyahRecord)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
        );
        setRecordsReady(!snap.metadata.fromCache);
      },
      () => {
        setRecordsReady(false);
        setMessage("Catatan pantauan belum dapat dimuat.");
      },
    );
  }, [admin, currentUser.idSantri]);

  useEffect(() => {
    const record = records.find((r) => r.timestamp.slice(0, 10) === date);
    setForm(
      record
        ? {
            alWaqiah: record.alWaqiah,
            alMulk: record.alMulk,
            alInsyirah: record.alInsyirah,
            shubuh: record.shubuh,
            dzuhur: record.dzuhur,
            ashar: record.ashar,
            maghrib: record.maghrib,
            isya: record.isya,
          }
        : emptyForm(),
    );
  }, [date, records]);

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      await storageService.setPantauanConfig({
        id: CONFIG_ID,
        isEnabled: !enabled,
        updatedBy: currentUser.id,
        lastUpdated: new Date().toISOString(),
      });
      setMessage("Pengaturan program tersimpan.");
    } catch {
      setMessage("Pengaturan gagal disimpan. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (
      !enabled ||
      !ready ||
      !recordsReady ||
      !currentUser.idSantri ||
      prayers.some(([key]) => !form[key])
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await storageService.saveWiridYaumiyyah({
        ...form,
        idSantri: currentUser.idSantri,
        inputBy: currentUser.id,
        timestamp: date + " 12:00",
      } as Omit<WiridYaumiyyahRecord, "id">);
      setMessage("Pantauan harian berhasil disimpan.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Catatan gagal disimpan. Silakan coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!admin && currentUser.role !== "Wali") return null;
  return (
    <section
      className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6 space-y-4 min-w-0"
      aria-label="Program Pantauan Liburan Santri"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-emerald-950">
            Program Pantauan Liburan Santri
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Wirid Yaumiyyah dan shalat berjama’ah selama liburan.
          </p>
        </div>
        {admin ? (
          <button
            type="button"
            role="switch"
            aria-label="Aktifkan Program Pantauan Liburan Santri"
            aria-checked={enabled}
            disabled={!ready || busy}
            onClick={toggle}
            className={`shrink-0 min-h-11 px-4 rounded-full font-bold text-sm disabled:opacity-50 ${enabled ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {busy ? "Menyimpan…" : enabled ? "ON" : "OFF"}
          </button>
        ) : (
          <span className="text-xs font-bold rounded-full bg-slate-100 px-3 py-2">
            {enabled ? "Aktif" : "Nonaktif"}
          </span>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm text-slate-700">
          {message}
        </p>
      )}
      {admin ? (
        <p className="text-xs text-slate-500">
          Saat OFF, wali tidak dapat mengisi atau mengubah catatan. Catatan yang
          sudah tersimpan tetap dipertahankan.
        </p>
      ) : !currentUser.idSantri ? (
        <p className="text-sm">
          Akun wali belum terhubung dengan santri. Hubungi admin.
        </p>
      ) : !enabled ? (
        <p className="text-sm text-slate-500">
          {ready
            ? "Program sedang dinonaktifkan oleh admin."
            : "Menunggu status program dari server…"}
        </p>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <fieldset
            disabled={busy || !ready || !recordsReady}
            className="space-y-4 disabled:opacity-60"
          >
            <label className="block text-sm font-semibold">
              Tanggal pantauan
              <input
                type="date"
                required
                max={today()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setMessage("");
                }}
                className="block mt-2 w-full min-h-11 border border-slate-300 rounded-xl px-3"
              />
            </label>
            <div>
              <h4 className="text-sm font-bold mb-2">Bacaan Wirid Yaumiyyah</h4>
              <div className="grid sm:grid-cols-3 gap-2">
                {surahs.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 border rounded-xl p-3 min-h-12 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.checked }))
                      }
                      className="h-5 w-5 accent-emerald-700"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Centang surah yang sudah dibaca.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2">Shalat berjama’ah</h4>
              <div className="space-y-3">
                {prayers.map(([key, label]) => (
                  <fieldset key={key} className="border rounded-xl p-3">
                    <legend className="px-1 text-sm font-semibold">
                      {label}
                    </legend>
                    <div className="grid grid-cols-3 gap-1.5">
                      {statuses.map((status) => (
                        <label
                          key={status}
                          className={`flex items-center justify-center gap-1 min-h-11 px-1 rounded-lg border text-xs cursor-pointer ${form[key] === status ? "bg-emerald-50 border-emerald-600 text-emerald-900" : "border-slate-200"}`}
                        >
                          <input
                            type="radio"
                            required
                            name={key}
                            value={status}
                            checked={form[key] === status}
                            onChange={() =>
                              setForm((f) => ({ ...f, [key]: status }))
                            }
                            className="accent-emerald-700"
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full min-h-12 rounded-xl bg-emerald-800 text-white font-bold"
            >
              {busy ? "Menyimpan…" : "Simpan pantauan harian"}
            </button>
          </fieldset>
          {records.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-sm font-bold mb-2">Catatan sebelumnya</h4>
              <div className="flex flex-wrap gap-2">
                {records.slice(0, 7).map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setDate(r.timestamp.slice(0, 10))}
                    className="min-h-11 rounded-lg bg-slate-100 px-3 text-xs"
                  >
                    {r.timestamp.slice(0, 10)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

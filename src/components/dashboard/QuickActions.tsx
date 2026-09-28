import { useState } from "react";
import { MessageCircle, Plus, Receipt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appendRow, isSheetDbConfigured, nextId, SHEETS } from "@/services/sheetdb";
import { PAYMENT_MODES } from "@/services/sheetSchema";
import type { DashboardData, FlatRow } from "@/types/dashboard";
import { formatINR } from "@/utils/currency";

type Mode = "payment" | "expense" | "remind" | "receipt" | null;

const today = () => new Date().toISOString().slice(0, 10);

function waLink(phone: string | undefined, text: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const num = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function openReceipt(row: FlatRow, month: string, year: number) {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  w.document.write(`<!doctype html><html><head><title>Receipt ${esc(row.flat.flatNo)} ${esc(month)} ${year}</title>
<style>body{font-family:system-ui,sans-serif;max-width:520px;margin:40px auto;color:#1f2937}
h1{font-size:20px;margin:0}.box{border:1px solid #d1d5db;border-radius:12px;padding:24px}
td{padding:6px 0}td:first-child{color:#6b7280;width:45%}.amt{font-size:28px;font-weight:700;color:#15803d}
@media print{button{display:none}}</style></head><body><div class="box">
<h1>Water Maintenance Receipt</h1><p style="color:#6b7280">Payment received with thanks</p>
<p class="amt">${esc(formatINR(row.amountPaid))}</p><table>
<tr><td>Flat</td><td>${esc(row.flat.flatNo)}</td></tr>
<tr><td>Owner</td><td>${esc(row.flat.ownerName)}</td></tr>
<tr><td>For month</td><td>${esc(month)} ${year}</td></tr>
<tr><td>Paid on</td><td>${esc(row.paymentDate ?? "-")}</td></tr>
<tr><td>Mode</td><td>${esc(row.paymentMode ?? "-")}</td></tr>
</table></div><p style="text-align:center"><button onclick="print()">Download / Print as PDF</button></p></body></html>`);
  w.document.close();
}

export function QuickActions({
  data,
  rows,
  year,
  month,
  onSaved,
}: {
  data: DashboardData;
  rows: FlatRow[];
  year: number;
  month: string;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const pending = rows.filter((r) => r.status === "PENDING");
  const paid = rows.filter((r) => r.status === "PAID");

  const open = (m: Mode) => {
    setError("");
    setDone("");
    setMode(m);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const amount = Number(get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return setError("Please enter an amount above 0.");
    setSaving(true);
    setError("");
    try {
      if (mode === "payment") {
        const flat = get("flat_no");
        if (!flat) throw new Error("Please choose a flat.");
        if (data.payments.some((p) => p.flatNo === flat && p.year === year && p.month.toLowerCase() === month.toLowerCase() && p.status === "PAID"))
          throw new Error(`Flat ${flat} has already paid for ${month} ${year}.`);
        await appendRow(SHEETS.payments, {
          payment_id: nextId("P", data.payments.map((p) => p.paymentId)),
          flat_no: flat, year, month, amount,
          payment_date: get("date") || today(), status: "PAID",
          payment_mode: get("mode"), remarks: get("remarks").slice(0, 200),
        });
        setDone(`Payment for flat ${flat} saved.`);
      } else {
        const description = get("description");
        if (!description) throw new Error("Please say what the money was spent on.");
        await appendRow(SHEETS.expenses, {
          expense_id: nextId("E", data.expenses.map((x) => x.expenseId)),
          year, month, expense_date: get("date") || today(),
          description: description.slice(0, 200), amount, status: "PAID",
          remarks: get("remarks").slice(0, 200),
        });
        setDone("Expense saved.");
      }
      e.currentTarget?.reset();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const reminderText = (r: FlatRow) =>
    `Hello ${r.flat.ownerName}, a gentle reminder that the water maintenance of ${formatINR(r.expectedAmount)} for flat ${r.flat.flatNo} (${month} ${year}) is pending. Kindly pay at the earliest. Thank you!`;

  return (
    <Card className="gap-3 p-5 shadow-card">
      <h2 className="text-lg font-semibold">Quick actions — {month} {year}</h2>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => open("payment")} disabled={!isSheetDbConfigured}><Wallet className="size-4" /> Record payment</Button>
        <Button variant="outline" onClick={() => open("expense")} disabled={!isSheetDbConfigured}><Plus className="size-4" /> Log expense</Button>
        <Button variant="outline" onClick={() => open("remind")}><MessageCircle className="size-4" /> WhatsApp reminders ({pending.length})</Button>
        <Button variant="outline" onClick={() => open("receipt")}><Receipt className="size-4" /> Receipts ({paid.length})</Button>
      </div>
      {!isSheetDbConfigured ? <p className="text-xs text-muted-foreground">Connect your Google Sheet to save payments and expenses.</p> : null}

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "payment" ? `Record payment — ${month} ${year}` : mode === "expense" ? `Log expense — ${month} ${year}` : mode === "remind" ? "Send WhatsApp reminders" : "Payment receipts"}
            </DialogTitle>
          </DialogHeader>

          {mode === "payment" || mode === "expense" ? (
            <form onSubmit={submit} className="space-y-3">
              {mode === "payment" ? (
                <div className="space-y-1">
                  <Label htmlFor="flat_no">Flat</Label>
                  <select id="flat_no" name="flat_no" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue={pending[0]?.flat.flatNo ?? ""}>
                    <option value="">Choose a flat</option>
                    {rows.filter((r) => r.status !== "NOT_OCCUPIED").map((r) => (
                      <option key={r.flat.flatNo} value={r.flat.flatNo}>{r.flat.flatNo} — {r.flat.ownerName}{r.status === "PAID" ? " (already paid)" : ""}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="description">What was it for?</Label>
                  <Input id="description" name="description" maxLength={200} placeholder="Filter cleaning" required />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" type="number" min={1} step="any" required defaultValue={mode === "payment" ? pending[0]?.expectedAmount || "" : ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={today()} />
                </div>
              </div>
              {mode === "payment" ? (
                <div className="space-y-1">
                  <Label htmlFor="mode">Paid by</Label>
                  <select id="mode" name="mode" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </div>
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="remarks">Note (optional)</Label>
                <Input id="remarks" name="remarks" maxLength={200} />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {done ? <p className="text-sm text-success">{done}</p> : null}
              <Button type="submit" disabled={saving} className="w-full">{saving ? "Saving…" : "Save to Google Sheet"}</Button>
            </form>
          ) : null}

          {mode === "remind" ? (
            pending.length ? (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={r.flat.flatNo} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span><b>{r.flat.flatNo}</b> · {r.flat.ownerName} · {formatINR(r.expectedAmount)}
                      {!r.flat.phone ? <span className="block text-xs text-muted-foreground">No phone in sheet — you'll pick the contact</span> : null}
                    </span>
                    <Button size="sm" asChild>
                      <a href={waLink(r.flat.phone, reminderText(r))} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> Send</a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No pending flats this month.</p>
          ) : null}

          {mode === "receipt" ? (
            paid.length ? (
              <ul className="space-y-2">
                {paid.map((r) => (
                  <li key={r.flat.flatNo} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span><b>{r.flat.flatNo}</b> · {r.flat.ownerName} · {formatINR(r.amountPaid)}</span>
                    <Button size="sm" variant="outline" onClick={() => openReceipt(r, month, year)}><Receipt className="size-4" /> Receipt</Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No payments yet this month.</p>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

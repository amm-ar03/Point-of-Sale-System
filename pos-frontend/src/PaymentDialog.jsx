import { useEffect, useState } from "react";

const METHODS = ["Cash", "Credit Card", "Cheque", "Debit Card", "Vouchers", "Other", "Rounding"];
const money = (n) => Number(n || 0).toFixed(2);

export default function PaymentDialog({ open, amountDue, onClose, onConfirm }) {
  const [vals, setVals] = useState({});

  useEffect(() => {
    if (open) setVals({ Cash: money(amountDue) });
  }, [open, amountDue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tendered = METHODS.reduce((s, m) => s + (Number(vals[m]) || 0), 0);
  const change = Math.max(0, tendered - amountDue);
  const enough = tendered + 0.005 >= amountDue;

  return (
    <div className="overlay">
      <div className="dialog pay">
        <div className="dtitle">Payment Due</div>
        <div className="row big"><label>Amount Due</label><div className="box red">{money(amountDue)}</div></div>
        {METHODS.map((m) => (
          <div className="row" key={m}>
            <label>{m}</label>
            <input type="number" step="0.01" value={vals[m] ?? ""} placeholder="0.00"
              onChange={(e) => setVals({ ...vals, [m]: e.target.value })} />
          </div>
        ))}
        <div className="row big"><label>Tendered</label><div className="box red">{money(tendered)}</div></div>
        <div className="row big"><label>Change</label><div className="box red">{money(change)}</div></div>
        <div className="dfoot">
          <em>(Press ESC. to close)</em>
          <button className="primary" disabled={!enough} onClick={onConfirm}>Continue ➜</button>
        </div>
      </div>
    </div>
  );
}
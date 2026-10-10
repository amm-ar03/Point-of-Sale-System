import { useEffect, useState } from "react";

export default function CustomerPickerDialog({ open, customers, current, onPick, onClose }) {
  const [q, setQ] = useState("");

  useEffect(() => { if (open) setQ(""); }, [open]);
  if (!open) return null;

  const shown = customers.filter((c) =>
    [c.name, c.phone, c.email].some((v) => (v ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="overlay" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="dialog" style={{ minWidth: 520 }}>
        <div className="dtitle">Select customer</div>
        <input autoFocus placeholder="Search name, phone, email" value={q}
               onChange={(e) => setQ(e.target.value)} style={{ textAlign: "left" }} />
        <div className="grid-wrap" style={{ minHeight: 200, maxHeight: 320 }}>
          <table className="grid">
            <tbody>
              {shown.length === 0 && <tr><td>No customers found.</td></tr>}
              {shown.map((c) => (
                <tr key={c.id} className={current?.id === c.id ? "sel" : ""} onClick={() => onPick(c)}>
                  <td>{c.name}</td><td>{c.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dfoot">
          <button onClick={() => onPick(null)}>No customer</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
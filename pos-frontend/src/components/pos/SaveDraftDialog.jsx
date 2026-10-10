import { useEffect, useState } from "react";

export default function SaveDraftDialog({ open, initialName, customers, onSave, onClose }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName(initialName ?? "");
  }, [open, initialName]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const match = customers.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    onSave(match ? match.name : trimmed, match ? match.id : null);
  }

  return (
    <div className="overlay" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <form className="dialog" onSubmit={submit}>
        <div className="dtitle">Save as draft</div>
        <div className="row">
          <label htmlFor="cust">Customer</label>
          <input id="cust" list="custlist" autoFocus value={name}
                 onChange={(e) => setName(e.target.value)} style={{ textAlign: "left" }} required />
          <datalist id="custlist">
            {customers.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>
        <div className="dfoot">
          <em>Stock is not reduced until the draft is paid.</em>
          <span>
            <button type="button" onClick={onClose}>Cancel</button>{" "}
            <button className="primary" type="submit">Save draft</button>
          </span>
        </div>
      </form>
    </div>
  );
}
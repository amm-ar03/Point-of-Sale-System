import { useEffect, useState } from "react";
import * as api from "../../api/business";

export default function BusinessScreen({ notify, canEdit }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.getBusiness().then(setForm).catch((e) => notify(e.message));
  }, []);

  if (!form) return <div className="loading">Loading…</div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      setForm(await api.saveBusiness(form));
      notify("Business details saved", "ok");
    } catch (err) {
      notify(err.message);
    }
  }

  return (
    <section className="screen">
      <h2>Business details</h2>
      <form className="panel formgrid" onSubmit={submit}>
        <label>Business name<input value={form.name ?? ""} onChange={set("name")} disabled={!canEdit} required /></label>
        <label>Phone<input value={form.phone ?? ""} onChange={set("phone")} disabled={!canEdit} /></label>
        <label>Email<input type="email" value={form.email ?? ""} onChange={set("email")} disabled={!canEdit} /></label>
        <label>Tax / GST number<input value={form.taxNumber ?? ""} onChange={set("taxNumber")} disabled={!canEdit} /></label>
        <label className="wide">Address<input value={form.address ?? ""} onChange={set("address")} disabled={!canEdit} /></label>
        <label className="wide">Invoice footer note<input value={form.footerNote ?? ""} onChange={set("footerNote")} disabled={!canEdit} /></label>
        {canEdit
          ? <div className="btns"><button className="primary" type="submit">Save</button></div>
          : <p className="hint">Only the master account can change these details.</p>}
      </form>
    </section>
  );
}
import { useState } from "react";
import { money } from "../../utils/money";

export default function PosScreen({
  cart, selected, setSelected, totals, taxRate,
  onSku, onNewSale, onInsert, onQty, onDelete, onCancel, onPay, onSaveDraft, customer, customers: customersProp, onPickCustomer,
}) {
  const [skuSearch, setSkuSearch] = useState("");
  const customers = Array.isArray(customersProp) ? customersProp : [];


  async function submit(e) {
    e.preventDefault();
    const term = skuSearch.trim();
    if (!term) return;
    const ok = await onSku(term);
    if (ok) setSkuSearch("");
  }

  return (
    <section className="screen">
      <header className="panel head">
        <div className="field-group">
          <div className="field"><label>Store</label><div className="box">01 / Demonstration System</div></div>

          <label className="field">
            Customer
            <select
              className="cust-select"
              value={customer ? (customer.id ?? "__text") : ""}
              onChange={(e) => onPickCustomer(e.target.value)}
            >
              <option value="">Walk-in (no customer)</option>
              {customer && !customer.id && <option value="__text">{customer.name}</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mode">CASH SALE<small>Till : 00</small></div>
        <div className="due"><span>DUE</span><strong>{money(totals.grand)}</strong></div>
      </header>

      <form className="panel skubar" onSubmit={submit}>
        <label>SKU</label>
        <input autoFocus value={skuSearch} onChange={(e) => setSkuSearch(e.target.value)} placeholder="Scan or type SKU, press Enter" />
        <button type="submit">Find</button>
      </form>
    
      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr><th>Line</th><th>Code</th><th>Description</th><th className="r">Quantity</th><th className="r">Price</th><th className="r">Discount</th><th className="r">Total</th></tr>
          </thead>
          <tbody>
            {cart.map((i, idx) => (
              <tr key={i.id} className={selected === i.id ? "sel" : ""} onClick={() => setSelected(i.id)}>
                <td>{idx + 1}</td><td>{i.sku}</td><td>{i.name}</td>
                <td className="r">{money(i.quantity)}</td>
                <td className="r">{money(i.price)}</td>
                <td className="r">0.00</td>
                <td className="r">{money(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="bottom">
        
            
            
        <div className="btns">
          <button onClick={onInsert}><u>I</u>nsert</button>
          <button onClick={onSaveDraft}><u>S</u>ave Draft</button>
          <button className="primary" onClick={onNewSale}>New Sale</button>
          <button disabled={!selected} onClick={() => onQty(selected, 1)}>Qty +</button>
          <button disabled={!selected} onClick={() => onQty(selected, -1)}>Qty −</button>
          <button disabled={!selected} onClick={() => onDelete(selected)}><u>D</u>elete</button>
          <button onClick={onCancel}>Cancel</button>
          <button className="update" disabled={!cart.length} onClick={onPay}>Pay</button>
        </div>
        <div className="sums">
          <div className="mini"><span>Lines</span><b>{totals.lines}</b><span>Qty</span><b>{money(totals.qty)}</b></div>
          <div className="mini big">
            <span>Sub Total</span><b>{money(totals.net)}</b>
            <span>VAT {(taxRate * 100).toFixed(0)}%</span><b>{money(totals.tax)}</b>
            <span>Total</span><b>{money(totals.grand)}</b>
          </div>
        </div>
      </footer>
    </section>
  );
}
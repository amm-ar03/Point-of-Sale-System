import { useState } from "react";
import { money } from "../../utils/money";

const EMPTY = { name: "", sku: "", price: "", stock: "", taxExempt: false };

export default function StockScreen({ products, onAddProduct, onAddToSale, onDelete }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    const ok = await onAddProduct({
      name: form.name,
      sku: form.sku,
      price: Number(form.price),
      stockQuantity: Number(form.stock),
      taxExempt: form.taxExempt,
    });
    if (ok) setForm(EMPTY);
  }

  return (
    <section className="screen">
      <form className="panel formrow" onSubmit={submit}>
        <input placeholder="Name" value={form.name} required onChange={(e) => set("name", e.target.value)} />
        <input placeholder="SKU" value={form.sku} required onChange={(e) => set("sku", e.target.value)} />
        <input type="number" step="0.01" placeholder="Price" value={form.price} required onChange={(e) => set("price", e.target.value)} />
        <input type="number" placeholder="Stock" value={form.stock} required onChange={(e) => set("stock", e.target.value)} />
        <label className="chk">
          <input type="checkbox" checked={form.taxExempt} onChange={(e) => set("taxExempt", e.target.checked)} /> Tax exempt
        </label>
        <button type="submit">Add Product</button>
      </form>

      <div className="grid-wrap">
        <table className="grid">
          <thead><tr><th>ID</th><th>SKU</th><th>Name</th><th className="r">Price</th><th className="r">Stock</th><th>Tax</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.sku}</td><td>{p.name}</td>
                <td className="r">{money(p.price)}</td><td className="r">{p.stockQuantity}</td>
                <td>{p.taxExempt ? "Exempt" : "Yes"}</td>
                <td>
                  <button onClick={() => onAddToSale(p)}>Add to sale</button>{" "}
                  <button onClick={() => onDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
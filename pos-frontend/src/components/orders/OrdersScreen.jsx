import { money } from "../../utils/money";

export default function OrdersScreen({ orders }) {
  return (
    <section className="screen">
      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr><th>ID</th><th>Date</th><th className="r">Net</th><th className="r">Tax</th><th className="r">Total</th><th className="r">Items</th></tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6}>No orders yet.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td><td>{o.createdAt}</td>
                <td className="r">{money(o.netTotal)}</td>
                <td className="r">{money(o.taxAmount)}</td>
                <td className="r">{money(o.grandTotal)}</td>
                <td className="r">{o.items?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
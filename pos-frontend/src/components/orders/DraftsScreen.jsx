import { money } from "../../utils/money";

export default function DraftsScreen({ drafts, onResume, onDelete }) {
  return (
    <section className="screen">
      <h2>Draft sales</h2>
      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr><th>#</th><th>Customer</th><th className="r">Items</th><th className="r">Total</th><th>Saved by</th><th>Updated</th><th></th></tr>
          </thead>
          <tbody>
            {drafts.length === 0 && <tr><td colSpan={7}>No drafts saved.</td></tr>}
            {drafts.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.customerName}</td>
                <td className="r">{d.items.length}</td>
                <td className="r">{money(d.grandTotal)}</td>
                <td>{d.createdBy}</td>
                <td>{new Date(d.updatedAt ?? d.createdAt).toLocaleString()}</td>
                <td className="r">
                  <button className="primary" onClick={() => onResume(d)}>Resume</button>{" "}
                  <button onClick={() => onDelete(d)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
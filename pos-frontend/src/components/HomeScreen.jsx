import { useState } from "react";

export default function HomeScreen({ user, onGo }) {
  const [invOpen, setInvOpen] = useState(false);
  const isMaster = user.role === "MASTER";

  const Card = ({ title, desc, onClick, disabled, children }) => (
    <div className={`hcard ${disabled ? "disabled" : ""}`}>
      <button className="hcard-btn" onClick={onClick} disabled={disabled}>
        <strong>{title}</strong>
        <span>{disabled ? "Coming soon" : desc}</span>
      </button>
      {children}
    </div>
  );

  return (
    <section className="screen home">
      <h2>Welcome, {user.username}</h2>
      <div className="hgrid">
        <Card title="New Sale" desc="Open the sale window" onClick={() => onGo("newsale")} />
        <Card title="Drafts" desc="Saved sales" disabled />

        <div className="hcard">
          <button className="hcard-btn" onClick={() => setInvOpen((v) => !v)} aria-expanded={invOpen}>
            <strong>Inventory {invOpen ? "▴" : "▾"}</strong>
            <span>Stock and supplier invoices</span>
          </button>
          {invOpen && (
            <div className="hsub">
              <button onClick={() => onGo("stock")}>Create new stock</button>
              <button disabled>Scan supplier invoice (soon)</button>
            </div>
          )}
        </div>

        <Card title="Orders" desc="Completed sales" onClick={() => onGo("orders")} />
        <Card title="Customers" desc="Customer accounts" disabled />
        {isMaster && <Card title="Business Details" desc="Name, address, tax no." disabled />}
        {isMaster && <Card title="Stock Sessions" desc="Supplier invoice history" disabled />}
        {isMaster && <Card title="Users" desc="Manage accounts and roles" onClick={() => onGo("users")} />}
      </div>
    </section>
  );
}
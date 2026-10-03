export default function MenuBar({ tab, onTab, user, onLogout }) {
  const items = [
    ["home", "Home"],
    ["pos", "Sale"],
    ["stock", "Stock"],
    ["orders", "Orders"],
    ...(user.role === "MASTER" ? [["users", "Users"]] : []),
  ];
  return (
    <nav className="menubar">
      {items.map(([key, label]) => (
        <button key={key} className={tab === key ? "active" : ""} onClick={() => onTab(key)}>
          {label}
        </button>
      ))}
      <span className="spacer" />
      <span className="who">{user.username} ({user.role})</span>
      <button onClick={onLogout}>Sign out</button>
    </nav>
  );
}
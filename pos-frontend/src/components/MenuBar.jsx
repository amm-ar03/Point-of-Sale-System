export default function MenuBar({ tab, onTab }) {
  const tabs = [
    ["pos", "POS"],
    ["stock", "Stock"],
    ["orders", "Orders"],
  ];
  return (
    <nav className="menubar">
      {tabs.map(([key, label]) => (
        <button key={key} className={tab === key ? "on" : ""} onClick={() => onTab(key)}>
          {label}
        </button>
      ))}
    </nav>
  );
}
export default function StatusBar({ status, onDismiss }) {
  if (!status.msg) return null;
  return (
    <div className={`status ${status.type}`}>
      {status.msg} <button onClick={onDismiss}>×</button>
    </div>
  );
}
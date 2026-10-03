import { useState } from "react";
import { login } from "../api/auth";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      onLogin(await login(username.trim(), password));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="overlay" style={{ background: "var(--bg)" }}>
      <form className="dialog" onSubmit={submit}>
        <div className="dtitle">POS — Sign in</div>
        <div className="row"><label>Username</label>
          <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
        <div className="row"><label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <div className="hint warn">{error}</div>}
        <div className="dfoot"><span></span><button className="primary" type="submit">Sign in</button></div>
      </form>
    </div>
  );
}
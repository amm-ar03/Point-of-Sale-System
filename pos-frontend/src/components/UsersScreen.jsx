import { useEffect, useState } from "react";
import { listUsers, createUser, setUserActive } from "../api/auth";

export default function UsersScreen({ notify, currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "USER" });

  async function load() {
    try { setUsers(await listUsers()); } catch (e) { notify(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await createUser(form);
      setForm({ username: "", password: "", role: "USER" });
      notify(`User ${form.username} created`, "ok");
      load();
    } catch (err) { notify(err.message); }
  }

  async function toggle(u) {
    try { await setUserActive(u.id, !u.active); load(); } catch (e) { notify(e.message); }
  }

  return (
    <section className="screen">
      <h2>Users</h2>
      <form className="panel formrow" onSubmit={submit}>
        <input placeholder="Username" value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input type="password" placeholder="Password (8+ chars)" minLength={8} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="USER">User</option>
          <option value="MASTER">Master</option>
        </select>
        <button className="primary" type="submit">Create user</button>
      </form>

      <div className="grid-wrap">
        <table className="grid">
          <thead><tr><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>{u.active ? "Active" : "Disabled"}</td>
                <td className="r">
                  <button onClick={() => toggle(u)} disabled={u.username === currentUser.username}>
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
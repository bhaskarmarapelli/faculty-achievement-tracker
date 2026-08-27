const { useState, useEffect, useCallback } = React;

const CATEGORIES = ["Academic", "Co-Curricular", "Extra-Curricular", "Other"];
const ROLES = ["Faculty", "Student"];

const CATEGORY_STYLES = {
  Academic: { bg: "#EAF1EE", text: "#1F5D45", dot: "#2E8B57" },
  "Co-Curricular": { bg: "#EFF0F7", text: "#3D3A78", dot: "#5B57A6" },
  "Extra-Curricular": { bg: "#FBF0E6", text: "#8A5324", dot: "#C97A2C" },
  Other: { bg: "#F1F1EE", text: "#55534A", dot: "#8A8778" },
};
const ROLE_STYLES = {
  Faculty: { bg: "#EAF0F5", text: "#234A63" },
  Student: { bg: "#F6EFE2", text: "#7A5A22" },
};

const emptyForm = {
  role: "Faculty", name: "", idNumber: "", category: "", details: "", date: "", proofLink: "",
};

// ---- tiny inline icon set (no external icon package needed) ----
const Icon = {
  download: (p) => <svg {...p} viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  check: (p) => <svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  alert: (p) => <svg {...p} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  trash: (p) => <svg {...p} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  file: (p) => <svg {...p} viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  search: (p) => <svg {...p} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  lock: (p) => <svg {...p} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  logout: (p) => <svg {...p} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  link: (p) => <svg {...p} viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
};

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "unknown"; // "2026-08"
}
function monthLabel(key) {
  if (key === "unknown") return "Undated";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function csvEscape(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Field({ label, required, error, children }) {
  return (
    <div className="field">
      <label className="field-label">{label} {required && <span className="required">*</span>}</label>
      {children}
      {error && <div className="error-text"><Icon.alert /> {error}</div>}
    </div>
  );
}

// ───────────────────────── Submission form ─────────────────────────
function SubmitForm({ db, showToast }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const idLabel = form.role === "Faculty" ? "Faculty ID" : "Roll Number";

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.idNumber.trim()) e.idNumber = `${idLabel} is required.`;
    if (!form.category) e.category = "Select a category.";
    if (!form.details.trim()) e.details = "Please describe the achievement.";
    if (!form.date) e.date = "Date is required.";
    if (!form.proofLink.trim()) {
      e.proofLink = "A Google Drive or OneDrive link is required.";
    } else if (!/^https?:\/\//i.test(form.proofLink.trim())) {
      e.proofLink = "Link should start with http:// or https://";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await db.collection("submissions").add({
        role: form.role,
        name: form.name.trim(),
        idNumber: form.idNumber.trim(),
        idLabel,
        category: form.category,
        details: form.details.trim(),
        date: form.date,
        proofLink: form.proofLink.trim(),
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      setForm({ ...emptyForm, role: form.role });
      setErrors({});
      showToast("Achievement submitted successfully.");
    } catch (err) {
      console.error(err);
      showToast("Could not submit — check your connection and try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-card">
      <div className="role-toggle" role="tablist" aria-label="Submitting as">
        {ROLES.map((r) => (
          <button key={r} type="button" role="tab" aria-selected={form.role === r}
            className={"role-btn" + (form.role === r ? " active" : "")}
            onClick={() => setForm({ ...emptyForm, role: r })}>
            {r}
          </button>
        ))}
      </div>

      <p className="form-intro">
        Record an academic, co-curricular, extra-curricular, or other achievement for department review.
        Fields marked with <span className="required">*</span> are required.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid-2">
          <Field label="Name" required error={errors.name}>
            <input className={"field-input" + (errors.name ? " error" : "")} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={form.role === "Faculty" ? "Dr. M. Bhaskar" : "Full name"} />
          </Field>
          <Field label={idLabel} required error={errors.idNumber}>
            <input className={"field-input" + (errors.idNumber ? " error" : "")} value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              placeholder={form.role === "Faculty" ? "e.g. 7367" : "e.g. 2200030123"} />
          </Field>
        </div>

        <div className="grid-2">
          <Field label="Achievement Category" required error={errors.category}>
            <select className={"field-input" + (errors.category ? " error" : "")} value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Date" required error={errors.date}>
            <input type="date" className={"field-input" + (errors.date ? " error" : "")} value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} max={new Date().toISOString().slice(0, 10)} />
          </Field>
        </div>

        <Field label="Achievement Details" required error={errors.details}>
          <textarea className={"field-input" + (errors.details ? " error" : "")} value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            placeholder="Describe the achievement — award, publication, event organized, competition result, etc." />
        </Field>

        <Field label="Proof Link" required error={errors.proofLink}>
          <input className={"field-input" + (errors.proofLink ? " error" : "")} value={form.proofLink}
            onChange={(e) => setForm({ ...form, proofLink: e.target.value })}
            placeholder="Google Drive / OneDrive link to certificate or photo" required />
        </Field>

        <button type="submit" disabled={saving} className="submit-btn">
          {saving ? "Submitting…" : "Submit achievement"}
        </button>
      </form>
    </div>
  );
}

// ───────────────────────── Admin login ─────────────────────────
function AdminLogin({ auth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (ev) => {
    ev.preventDefault();
    setError("");
    setBusy(true);
    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found"
          ? "Incorrect email or password."
          : "Sign-in failed: " + err.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-card">
      <div className="login-icon"><Icon.lock /></div>
      <h2 className="login-title">Admin sign-in</h2>
      <p className="login-sub">Sign in to view and export submitted records.</p>
      <form onSubmit={handleLogin} noValidate>
        <Field label="Email">
          <input type="email" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <input type="password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <div className="error-text" style={{ marginBottom: 12 }}><Icon.alert /> {error}</div>}
        <button type="submit" disabled={busy} className="submit-btn">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

// ───────────────────────── Admin dashboard ─────────────────────────
function AdminDashboard({ db, auth, user, showToast }) {
  const [tab, setTab] = useState("records"); // 'records' | 'summary'
  const [records, setRecords] = useState(null); // null = loading
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const unsub = db.collection("submissions").orderBy("date", "desc").onSnapshot(
      (snap) => setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(err);
        showToast("Could not load records: " + err.message, "error");
        setRecords([]);
      }
    );
    return () => unsub();
  }, [db, showToast]);

  const handleDelete = async (id) => {
    try {
      await db.collection("submissions").doc(id).delete();
      showToast("Record deleted.");
    } catch (err) {
      showToast("Could not delete this record.", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = (records || []).filter((r) => {
    const matchesCategory = filterCategory === "All" || r.category === filterCategory;
    const matchesRole = filterRole === "All" || r.role === filterRole;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (r.name || "").toLowerCase().includes(q) || (r.idNumber || "").toLowerCase().includes(q) || (r.details || "").toLowerCase().includes(q);
    return matchesCategory && matchesRole && matchesSearch;
  });

  // ---- month-wise consolidation ----
  const summary = {};
  (records || []).forEach((r) => {
    const key = monthKey(r.date);
    if (!summary[key]) summary[key] = { total: 0, byCategory: {}, byRole: { Faculty: 0, Student: 0 }, records: [] };
    summary[key].total += 1;
    summary[key].byCategory[r.category] = (summary[key].byCategory[r.category] || 0) + 1;
    summary[key].byRole[r.role] = (summary[key].byRole[r.role] || 0) + 1;
    summary[key].records.push(r);
  });
  const summaryMonths = Object.keys(summary).sort().reverse();

  const exportRecordsCSV = () => {
    if (!records || records.length === 0) { showToast("No records to export yet.", "error"); return; }
    downloadCSV(
      `achievements-detailed-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Role", "Name", "ID", "Category", "Details", "Date", "Proof Link"],
      records.map((r) => [r.role, r.name, r.idNumber, r.category, r.details, formatDate(r.date), r.proofLink || ""])
    );
  };

  const exportSummaryCSV = () => {
    if (summaryMonths.length === 0) { showToast("No records to summarize yet.", "error"); return; }
    const summaryHeaders = [
      "Month", "Row Type", "Total", ...CATEGORIES, "Faculty", "Student",
      "Role", "Name", "ID", "Category", "Details", "Date", "Proof Link",
    ];
    const summaryRows = [];
    summaryMonths.forEach((key) => {
      const month = summary[key];
      summaryRows.push([
        monthLabel(key), "Monthly count", month.total,
        ...CATEGORIES.map((c) => month.byCategory[c] || 0),
        month.byRole.Faculty || 0, month.byRole.Student || 0,
        "", "", "", "", "", "", "",
      ]);
      month.records.forEach((r) => {
        summaryRows.push([
          monthLabel(key), "Achievement detail", "", "", "", "", "", "", "",
          r.role, r.name, r.idNumber, r.category, r.details, formatDate(r.date), r.proofLink || "",
        ]);
      });
    });
    downloadCSV(
      `achievements-monthly-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      summaryHeaders,
      summaryRows
    );
  };

  return (
    <div>
      <div className="admin-topbar">
        <div className="admin-tabs">
          <button className={"tab-btn" + (tab === "records" ? " active" : "")} onClick={() => setTab("records")}>All records</button>
          <button className={"tab-btn" + (tab === "summary" ? " active" : "")} onClick={() => setTab("summary")}>Monthly summary</button>
        </div>
        <div className="admin-user">
          <span className="admin-email">{user.email}</span>
          <button className="logout-btn" onClick={() => auth.signOut()}><Icon.logout /> Sign out</button>
        </div>
      </div>

      {tab === "records" ? (
        <div>
          <div className="toolbar">
            <div className="search-box">
              <Icon.search color="#8A8778" />
              <input className="search-input" placeholder="Search by name, ID, or detail…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="All">Faculty & Students</option>
              {ROLES.map((r) => <option key={r} value={r}>{r} only</option>)}
            </select>
            <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={exportRecordsCSV} className="export-btn"><Icon.download /> Export CSV</button>
          </div>

          <div className="table-card">
            {records === null ? (
              <div className="empty-state">Loading records…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Icon.file color="#B7B4A6" />
                <span>{records.length === 0 ? "No achievements submitted yet." : "No records match your filters."}</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>{["Role", "Name", "ID", "Category", "Details", "Date", "Proof", ""].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const cat = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.Other;
                      const role = ROLE_STYLES[r.role] || ROLE_STYLES.Faculty;
                      return (
                        <tr key={r.id}>
                          <td><span className="pill" style={{ background: role.bg, color: role.text }}>{r.role}</span></td>
                          <td>{r.name}</td>
                          <td className="td-id">{r.idNumber}</td>
                          <td>
                            <span className="pill" style={{ background: cat.bg, color: cat.text }}>
                              <span className="pill-dot" style={{ background: cat.dot }} /> {r.category}
                            </span>
                          </td>
                          <td><span className="td-details" title={r.details}>{r.details}</span></td>
                          <td style={{ whiteSpace: "nowrap" }}>{formatDate(r.date)}</td>
                          <td>
                            {r.proofLink ? (
                              <a href={r.proofLink} target="_blank" rel="noopener noreferrer" className="proof-link"><Icon.link /> Open</a>
                            ) : <span style={{ color: "#C7C4B6" }}>—</span>}
                          </td>
                          <td>
                            {confirmDelete === r.id ? (
                              <span style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => handleDelete(r.id)} className="confirm-yes">Delete</button>
                                <button onClick={() => setConfirmDelete(null)} className="confirm-no">Cancel</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmDelete(r.id)} className="delete-btn" aria-label="Delete record"><Icon.trash /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {records && records.length > 0 && (
            <p className="footnote">Showing {filtered.length} of {records.length} record{records.length === 1 ? "" : "s"}.</p>
          )}
        </div>
      ) : (
        <div>
          <div className="toolbar" style={{ justifyContent: "flex-end" }}>
            <button onClick={exportSummaryCSV} className="export-btn"><Icon.download /> Export summary CSV</button>
          </div>
          <div className="table-card">
            {summaryMonths.length === 0 ? (
              <div className="empty-state">
                <Icon.file color="#B7B4A6" />
                <span>No records to summarize yet.</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total</th>
                      {CATEGORIES.map((c) => <th key={c}>{c}</th>)}
                      <th>Faculty</th>
                      <th>Student</th>
                      <th>Role</th>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th>Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryMonths.map((key) => (
                      <React.Fragment key={key}>
                        <tr className="summary-count-row">
                          <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{monthLabel(key)}</td>
                          <td>{summary[key].total}</td>
                          {CATEGORIES.map((c) => <td key={c}>{summary[key].byCategory[c] || 0}</td>)}
                          <td>{summary[key].byRole.Faculty || 0}</td>
                          <td>{summary[key].byRole.Student || 0}</td>
                          <td colSpan="7" style={{ color: "#8A8778", fontStyle: "italic" }}>Monthly count</td>
                        </tr>
                        {summary[key].records.map((r) => {
                          const cat = CATEGORY_STYLES[r.category] || CATEGORY_STYLES.Other;
                          const role = ROLE_STYLES[r.role] || ROLE_STYLES.Faculty;
                          return (
                            <tr key={r.id}>
                              <td colSpan="7" />
                              <td><span className="pill" style={{ background: role.bg, color: role.text }}>{r.role}</span></td>
                              <td>{r.name}</td>
                              <td className="td-id">{r.idNumber}</td>
                              <td>
                                <span className="pill" style={{ background: cat.bg, color: cat.text }}>
                                  <span className="pill-dot" style={{ background: cat.dot }} /> {r.category}
                                </span>
                              </td>
                              <td><span className="td-details" title={r.details}>{r.details}</span></td>
                              <td style={{ whiteSpace: "nowrap" }}>{formatDate(r.date)}</td>
                              <td>
                                {r.proofLink ? (
                                  <a href={r.proofLink} target="_blank" rel="noopener noreferrer" className="proof-link"><Icon.link /> Open</a>
                                ) : <span style={{ color: "#C7C4B6" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {summaryMonths.length > 0 && (
            <p className="footnote">Consolidated across {summaryMonths.length} month{summaryMonths.length === 1 ? "" : "s"} of submissions.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── App shell ─────────────────────────
function App() {
  const [view, setView] = useState("submit");
  const [toast, setToast] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);

  const app = React.useMemo(() => firebase.initializeApp(firebaseConfig), []);
  const auth = React.useMemo(() => firebase.auth(), [app]);
  const db = React.useMemo(() => firebase.firestore(), [app]);

  const showToast = useCallback((message, kind = "success") => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, [auth]);

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div>
            <div className="eyebrow">CS&IT DEPARTMENT · ACHIEVEMENT RECORDS</div>
            <h1 className="title">Achievement Register</h1>
          </div>
          <nav className="nav">
            <button onClick={() => setView("admin")} className={"nav-btn" + (view === "admin" ? " active" : "")}>
              <Icon.lock /> Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {view === "submit" && <SubmitForm db={db} showToast={showToast} />}
        {view === "admin" && (
          !authReady ? (
            <div className="empty-state">Loading…</div>
          ) : user ? (
            <AdminDashboard db={db} auth={auth} user={user} showToast={showToast} />
          ) : (
            <AdminLogin auth={auth} />
          )
        )}
      </main>

      {toast && (
        <div className={"toast " + (toast.kind === "error" ? "toast-error" : "toast-success")}>
          {toast.kind === "error" ? <Icon.alert /> : <Icon.check />} {toast.message}
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

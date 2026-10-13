import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialTrips = [
  { id: 1, tripName: "A little weekend escape", destination: "Somewhere beautiful", startDate: "", endDate: "", coverImage: "", mood: "Dreamy", description: "A new story waiting to happen." },
];
const initialChecklist = [
  { id: 1, text: "Travel documents", done: false },
  { id: 2, text: "Phone charger", done: false },
  { id: 3, text: "Comfortable clothes", done: false },
  { id: 4, text: "Camera", done: false },
];
const moods = ["Dreamy ✨", "Adventurous 🌿", "Relaxed ☁️", "Romantic ♡", "Curious 🧭", "Playful 🌸"];
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

function SectionHeading({ icon, title, subtitle, action, onAction }) {
  return (
    <div className="section-heading">
      <div className="section-heading-icon">{icon}</div>
      <div className="section-heading-copy">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && <button className="primary-btn" type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state"><span>✧</span><p>{text}</p></div>;
}

function MemoryGrid({ memories, onEdit, onDelete }) {
  if (!memories.length) return <EmptyState text="Your little moments will live here. Add your first memory ♡" />;
  return (
    <div className="memory-grid">
      {memories.map((memory) => (
        <article className="memory-card" key={memory.id}>
          {memory.imageUrl && <img className="memory-image" src={memory.imageUrl} alt={memory.title} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          <div className="memory-card-content">
            <span className="eyebrow">{memory.type || "Memory"} {memory.mood ? `· ${memory.mood}` : ""}</span>
            <h3>{memory.title}</h3>
            {memory.date && <small>{memory.date}</small>}
            {memory.notes && <p>{memory.notes}</p>}
            <div className="card-actions">
              <button className="secondary-btn" type="button" onClick={() => onEdit(memory)}>Edit</button>
              <button className="danger-text" type="button" onClick={() => onDelete(memory.id)}>Delete</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("Home");
  const [userName, setUserName] = useState(() => localStorage.getItem("wf_user") || "Explorer");
  const [settingsName, setSettingsName] = useState(() => localStorage.getItem("wf_user") || "Explorer");
  const [greeting, setGreeting] = useState(() => localStorage.getItem("wf_greeting") || "A little space for your big adventures ♡");
  const [theme, setTheme] = useState(() => localStorage.getItem("wf_theme") || "rose");
  const [trips, setTrips] = useState(() => readStore("wf_trips", initialTrips));
  const [memories, setMemories] = useState(() => readStore("wf_memories", []));
  const [notes, setNotes] = useState(() => readStore("wf_notes", []));
  const [checklist, setChecklist] = useState(() => readStore("wf_checklist", initialChecklist));
  const [expenses, setExpenses] = useState(() => readStore("wf_expenses", []));
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [search, setSearch] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [checkText, setCheckText] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tripForm, setTripForm] = useState({ tripName: "", destination: "", startDate: "", endDate: "", coverImage: "", mood: moods[0], description: "" });
  const [memoryForm, setMemoryForm] = useState({ title: "", imageUrl: "", date: new Date().toISOString().slice(0, 10), type: "memory", notes: "", mood: "" });

  useEffect(() => { localStorage.setItem("wf_trips", JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem("wf_memories", JSON.stringify(memories)); }, [memories]);
  useEffect(() => { localStorage.setItem("wf_notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem("wf_checklist", JSON.stringify(checklist)); }, [checklist]);
  useEffect(() => { localStorage.setItem("wf_expenses", JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem("wf_theme", theme); document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { localStorage.setItem("wf_greeting", greeting); }, [greeting]);

  const filteredMemories = useMemo(() => memories.filter((item) => `${item.title} ${item.notes} ${item.type}`.toLowerCase().includes(search.toLowerCase())), [memories, search]);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const showNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 2800); };
  const openNewTrip = () => { setEditingId(null); setTripForm({ tripName: "", destination: "", startDate: "", endDate: "", coverImage: "", mood: moods[0], description: "" }); setModal("trip"); };
  const openNewMemory = () => { setEditingId(null); setMemoryForm({ title: "", imageUrl: "", date: new Date().toISOString().slice(0, 10), type: "memory", notes: "", mood: "" }); setModal("memory"); };
  const openEditMemory = (memory) => { setEditingId(memory.id); setMemoryForm({ title: memory.title || "", imageUrl: memory.imageUrl || "", date: memory.date || "", type: memory.type || "memory", notes: memory.notes || "", mood: memory.mood || "" }); setModal("memory"); };
  const deleteMemory = (id) => { if (window.confirm("Delete this memory?")) setMemories((items) => items.filter((item) => item.id !== id)); };
  const saveTrip = (e) => { e.preventDefault(); const item = { ...tripForm, id: editingId ?? makeId() }; setTrips((items) => editingId ? items.map((trip) => trip.id === editingId ? item : trip) : [item, ...items]); setModal(""); setEditingId(null); showNotice("Your trip has been saved ♡"); };
  const editTrip = (trip) => { setEditingId(trip.id); setTripForm({ ...trip }); setModal("trip"); };
  const deleteTrip = (id) => { if (window.confirm("Delete this trip?")) setTrips((items) => items.filter((trip) => trip.id !== id)); if (selectedTrip?.id === id) setSelectedTrip(null); };
  const saveMemory = (e) => { e.preventDefault(); const item = { ...memoryForm, id: editingId ?? makeId() }; setMemories((items) => editingId ? items.map((memory) => memory.id === editingId ? item : memory) : [item, ...items]); setModal(""); setEditingId(null); showNotice("Memory saved ♡"); };
  const saveNote = (e) => { e.preventDefault(); if (!noteTitle.trim() || !noteContent.trim()) return; setNotes((items) => [{ id: makeId(), title: noteTitle.trim(), content: noteContent.trim(), date: new Date().toLocaleDateString() }, ...items]); setNoteTitle(""); setNoteContent(""); setModal(""); showNotice("Note saved ♡"); };
  const deleteNote = (id) => setNotes((items) => items.filter((item) => item.id !== id));
  const addChecklistItem = (e) => { e.preventDefault(); if (!checkText.trim()) return; setChecklist((items) => [...items, { id: makeId(), text: checkText.trim(), done: false }]); setCheckText(""); };
  const addExpense = (e) => { e.preventDefault(); if (!expenseTitle.trim() || Number(expenseAmount) <= 0) return; setExpenses((items) => [{ id: makeId(), title: expenseTitle.trim(), amount: Number(expenseAmount), category: expenseCategory, date: new Date().toLocaleDateString() }, ...items]); setExpenseTitle(""); setExpenseAmount(""); showNotice("Expense saved"); };
  const signOut = () => showNotice("Your journal stays saved on this device.");
  const navItems = [{ name: "Home", icon: "⌂" }, { name: "Trips", icon: "✈" }, { name: "Memories", icon: "▧" }, { name: "Notes", icon: "✎" }, { name: "Checklist", icon: "☑" }, { name: "Expenses", icon: "₹" }, { name: "Calendar", icon: "▦" }, { name: "Settings", icon: "⚙" }];

  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="left-sidebar">
        <div className="brand-mark">✿</div><div className="brand-copy"><strong>wander & wonder</strong><small>your personal journal</small></div>
        <button className="primary-btn full-width sidebar-new" onClick={openNewTrip}>＋ New trip</button>
        <nav className="main-nav">{navItems.map((item) => <button key={item.name} className={`nav-item ${page === item.name ? "active" : ""}`} onClick={() => { setPage(item.name); setSelectedTrip(null); }}><span>{item.icon}</span>{item.name}</button>)}</nav>
        <div className="sidebar-bottom"><span>♡</span><p>A place for all the little things you'll want to remember.</p></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">YOUR PERSONAL SPACE</span><h1>{page === "Home" ? `Hello, ${userName} ♡` : page}</h1></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your journal..." /></header>

        {page === "Home" && <section className="section-block">
          <div className="welcome-card"><div><span className="eyebrow">A NOTE TO SELF</span><h2>{greeting}</h2><p>Collect places, feelings, plans and memories—one page at a time.</p><button className="primary-btn" onClick={openNewTrip}>Plan a little adventure ♡</button></div><div className="welcome-art">🌷</div></div>
          <SectionHeading icon="✧" title="Your little world" subtitle="A soft landing place for your stories." />
          <div className="stats-grid"><div className="stat-card"><span>Trips planned</span><strong>{trips.length}</strong></div><div className="stat-card"><span>Memories kept</span><strong>{memories.length}</strong></div><div className="stat-card"><span>Notes written</span><strong>{notes.length}</strong></div><div className="stat-card"><span>Expenses tracked</span><strong>₹{totalExpenses.toLocaleString("en-IN")}</strong></div></div>
          <SectionHeading icon="✈" title="Your journeys" subtitle="The places that become part of your story." action="＋ Add trip" onAction={openNewTrip} />
          <div className="trip-grid">{trips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} onOpen={() => setSelectedTrip(trip)} onEdit={() => editTrip(trip)} onDelete={() => deleteTrip(trip.id)} />)}</div>
          {trips.length === 0 && <EmptyState text="Your first adventure is waiting to be added." />}
        </section>}

        {page === "Trips" && <section className="section-block"><SectionHeading icon="✈" title="Your journeys" subtitle="Name your trip and write the destination in your own words." action="＋ New trip" onAction={openNewTrip} />{selectedTrip ? <div className="panel trip-detail"><button className="secondary-btn" onClick={() => setSelectedTrip(null)}>← All trips</button>{selectedTrip.coverImage && <img className="trip-detail-image" src={selectedTrip.coverImage} alt={selectedTrip.tripName} />}<h2>{selectedTrip.tripName}</h2><p className="muted">{selectedTrip.destination}</p><p>{selectedTrip.description}</p><p>{selectedTrip.startDate} {selectedTrip.endDate ? `— ${selectedTrip.endDate}` : ""}</p><span>{selectedTrip.mood}</span><div className="card-actions"><button className="secondary-btn" onClick={() => editTrip(selectedTrip)}>Edit trip</button><button className="danger-text" onClick={() => deleteTrip(selectedTrip.id)}>Delete trip</button></div></div> : <div className="trip-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} onOpen={() => setSelectedTrip(trip)} onEdit={() => editTrip(trip)} onDelete={() => deleteTrip(trip.id)} />)}</div>}{!trips.length && <EmptyState text="No trips yet. Start with a name and destination." />}</section>}

        {page === "Memories" && <section className="section-block"><SectionHeading icon="▧" title="Little moments" subtitle="Photos, places, meals and moments worth keeping." action="＋ Add memory" onAction={openNewMemory} /><MemoryGrid memories={filteredMemories} onEdit={openEditMemory} onDelete={deleteMemory} /></section>}

        {page === "Notes" && <section className="section-block"><SectionHeading icon="✎" title="Your notes" subtitle="Thoughts, plans, lists and little reminders." action="＋ New Note" onAction={() => setModal("note")} /><form className="inline-form note-create" onSubmit={saveNote}><input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Give your note a title..." required /><textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write whatever is on your mind..." rows={3} required /><button className="primary-btn" type="submit">Save note ♡</button></form><div className="note-grid">{notes.map((note) => <article className="note-card" key={note.id}><span className="note-pin">✧</span><h3>{note.title}</h3><p>{note.content}</p><small>{note.date}</small><button className="danger-text" onClick={() => deleteNote(note.id)}>Delete</button></article>)}</div>{!notes.length && <EmptyState text="Your next lovely idea belongs here." />}</section>}

        {page === "Checklist" && <section className="section-block"><SectionHeading icon="☑" title="Packing checklist" subtitle="The little things that make every journey easier." /><div className="panel checklist-panel"><div className="progress-track"><div className="progress-fill" style={{ width: `${checklist.length ? checklist.filter((item) => item.done).length / checklist.length * 100 : 0}%` }} /></div><p className="muted">{checklist.filter((item) => item.done).length} of {checklist.length} items packed</p>{checklist.map((item) => <div className="check-row" key={item.id}><label><input type="checkbox" checked={item.done} onChange={(e) => setChecklist((prev) => prev.map((row) => row.id === item.id ? { ...row, done: e.target.checked } : row))} /><span className={item.done ? "checked-label" : ""}>{item.text}</span></label><button className="danger-text" onClick={() => setChecklist((prev) => prev.filter((row) => row.id !== item.id))}>×</button></div>)}<form className="inline-form compact-form" onSubmit={addChecklistItem}><input value={checkText} onChange={(e) => setCheckText(e.target.value)} placeholder="Add another item..." /><button className="primary-btn" type="submit">＋ Add</button></form></div></section>}

        {page === "Expenses" && <section className="section-block"><SectionHeading icon="₹" title="Your travel budget" subtitle="Keep the little costs in sight, without losing the joy." /><div className="stat-card"><span>Total expenses recorded</span><strong>₹{totalExpenses.toLocaleString("en-IN")}</strong><small>Saved on this device.</small></div><form className="panel expense-form" onSubmit={addExpense}><h3>＋ Add an expense</h3><input value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="What did you spend on?" required /><div className="form-row"><input type="number" min="0.01" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="Amount (₹)" required /><select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>{["Transport", "Hotel", "Food", "Activities", "Shopping", "Other"].map((category) => <option key={category}>{category}</option>)}</select></div><button className="primary-btn" type="submit">Save expense</button></form><div className="panel expense-list"><h3>Recent expenses</h3>{expenses.map((expense) => <div className="expense-row" key={expense.id}><div><strong>{expense.title}</strong><small>{expense.category} · {expense.date}</small></div><strong>₹{Number(expense.amount).toLocaleString("en-IN")}</strong><button className="danger-text" onClick={() => setExpenses((prev) => prev.filter((item) => item.id !== expense.id))}>×</button></div>)}{!expenses.length && <EmptyState text="Your spending story starts here." />}</div></section>}

        {page === "Calendar" && <section className="section-block"><SectionHeading icon="▦" title="Your calendar" subtitle="A little space for plans, journeys and important dates." /><div className="panel calendar-panel"><div className="calendar-heading"><button className="secondary-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>←</button><h2>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><button className="secondary-btn" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>→</button></div><div className="calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <strong className="calendar-weekday" key={day}>{day}</strong>)}{Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate() }).map((_, i) => { const day = i + 1; const date = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const hasTrip = trips.some((trip) => trip.startDate === date || trip.endDate === date); const today = new Date(); const isToday = day === today.getDate() && calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear(); return <button key={day} className={`calendar-day ${isToday ? "today" : ""} ${hasTrip ? "has-event" : ""}`} title={date} onClick={() => { const trip = trips.find((item) => item.startDate === date || item.endDate === date); if (trip) { setSelectedTrip(trip); setPage("Trips"); } else showNotice(date); }}>{day}{hasTrip && <i />}</button>; })}</div><p className="muted">Dots mark trip start or end dates.</p></div></section>}

        {page === "Settings" && <section className="section-block"><SectionHeading icon="⚙" title="Make it yours" subtitle="Your space should feel like you." /><div className="panel settings-panel"><h3>Your display name</h3><form className="inline-form" onSubmit={(e) => { e.preventDefault(); const name = settingsName.trim() || "Explorer"; setUserName(name); localStorage.setItem("wf_user", name); showNotice("Your name has been updated ♡"); }}><input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="What should we call you?" /><button className="primary-btn">Save name</button></form><h3>Your greeting</h3><input value={greeting} onChange={(e) => setGreeting(e.target.value)} placeholder="Write a greeting..." /><h3>Choose your aesthetic</h3><div className="theme-options">{[["rose", "Rose garden", "🌸"], ["sage", "Sage & calm", "🌿"], ["lavender", "Lavender dreams", "💜"], ["ocean", "Ocean breeze", "🌊"]].map(([value, label, icon]) => <button key={value} className={`theme-option ${theme === value ? "selected" : ""}`} onClick={() => setTheme(value)}><span>{icon}</span>{label}</button>)}</div><button className="danger-btn" onClick={signOut}>Sign out</button></div></section>}
      </main>

      <aside className="right-rail"><div className="rail-intro"><span className="rail-doodle">✈</span><h2>Your<br />Travel Library</h2><p>♡</p></div><div className="rail-feature"><span>▤</span><div><strong>Plan</strong><small>Create your next itinerary.</small></div></div><div className="rail-feature"><span>▧</span><div><strong>Organize</strong><small>Keep notes and memories in folders.</small></div></div><div className="rail-feature"><span>◎</span><div><strong>Capture</strong><small>Save moments, places and people.</small></div></div><div className="rail-feature"><span>✧</span><div><strong>Remember</strong><small>Turn trips into beautiful stories.</small></div></div><div className="rail-bottom"><div className="rail-illustration">🧳</div><h3>Same places,<br />new stories ♡</h3><p>Every little moment belongs somewhere.</p><button className="primary-btn full-width" onClick={openNewTrip}>Start a new story</button></div></aside>

      {modal && <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(""); }}>
        {modal === "trip" && <form className="modal-card" onSubmit={saveTrip}><button className="modal-close" type="button" onClick={() => setModal("")}>×</button><p className="eyebrow">A NEW CHAPTER</p><h2>{editingId != null ? "Edit your trip ♡" : "Create a little adventure"}</h2><p className="muted">Every detail is yours to choose.</p><label>Trip name *</label><input value={tripForm.tripName} onChange={(e) => setTripForm({ ...tripForm, tripName: e.target.value })} placeholder="e.g. My summer escape" required /><label>Destination *</label><input value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} placeholder="Where will your story take you?" required /><div className="form-row"><div><label>Start date</label><input type="date" value={tripForm.startDate} onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })} /></div><div><label>End date</label><input type="date" min={tripForm.startDate || undefined} value={tripForm.endDate} onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })} /></div></div><label>Cover image URL (optional)</label><input type="url" value={tripForm.coverImage} onChange={(e) => setTripForm({ ...tripForm, coverImage: e.target.value })} placeholder="Paste your photo URL" />{tripForm.coverImage && <img className="cover-preview" src={tripForm.coverImage} alt="Trip cover preview" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<label>Choose your mood</label><div className="mood-options">{moods.map((mood) => <button type="button" key={mood} className={`mood-option ${tripForm.mood === mood ? "selected" : ""}`} onClick={() => setTripForm({ ...tripForm, mood })}>{mood}</button>)}</div><label>Trip description</label><textarea rows={3} value={tripForm.description} onChange={(e) => setTripForm({ ...tripForm, description: e.target.value })} placeholder="What do you want to remember about this trip?" /><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal("")}>Cancel</button><button type="submit" className="primary-btn">{editingId != null ? "Save changes ♡" : "Create trip ♡"}</button></div></form>}
        {modal === "memory" && <form className="modal-card" onSubmit={saveMemory}><button className="modal-close" type="button" onClick={() => setModal("")}>×</button><p className="eyebrow">A MOMENT TO KEEP</p><h2>{editingId != null ? "Edit memory" : "Capture a memory ♡"}</h2><label>Memory title *</label><input value={memoryForm.title} onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })} placeholder="The prettiest little sunset..." required /><label>Photo URL (optional)</label><input type="url" value={memoryForm.imageUrl} onChange={(e) => setMemoryForm({ ...memoryForm, imageUrl: e.target.value })} placeholder="Paste an image URL" /><label>Date</label><input type="date" value={memoryForm.date} onChange={(e) => setMemoryForm({ ...memoryForm, date: e.target.value })} /><label>Memory type</label><select value={memoryForm.type} onChange={(e) => setMemoryForm({ ...memoryForm, type: e.target.value })}><option value="memory">Memory</option><option value="photo">Photo</option><option value="food">Food</option><option value="place">Place</option><option value="moment">Special moment</option></select><label>Notes</label><textarea value={memoryForm.notes} onChange={(e) => setMemoryForm({ ...memoryForm, notes: e.target.value })} placeholder="Write about this memory..." rows={4} /><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal("")}>Cancel</button><button type="submit" className="primary-btn">Save memory ♡</button></div></form>}
        {modal === "note" && <form className="modal-card" onSubmit={saveNote}><button className="modal-close" type="button" onClick={() => setModal("")}>×</button><p className="eyebrow">A LITTLE THOUGHT</p><h2>Create a note ♡</h2><label>Note title</label><input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Give your note a title..." required /><label>Your note</label><textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write whatever is on your mind..." rows={5} required /><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal("")}>Cancel</button><button type="submit" className="primary-btn">Save note ♡</button></div></form>}
      </div>}
      {notice && <div className="notice-toast">{notice}</div>}
    </div>
  );
}

function TripCard({ trip, onOpen, onEdit, onDelete }) {
  return <article className="trip-card">{trip.coverImage ? <img className="trip-cover" src={trip.coverImage} alt={trip.tripName} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="trip-cover trip-cover-placeholder">✈</div>}<div className="trip-card-body"><span className="eyebrow">{trip.mood || "A LITTLE ADVENTURE"}</span><h3>{trip.tripName}</h3><p>{trip.destination}</p>{(trip.startDate || trip.endDate) && <small>{trip.startDate} {trip.endDate ? `— ${trip.endDate}` : ""}</small>}<div className="card-actions"><button className="primary-btn" onClick={onOpen}>Open</button><button className="secondary-btn" onClick={onEdit}>Edit</button><button className="danger-text" onClick={onDelete}>Delete</button></div></div></article>;
}

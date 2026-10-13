import React, { useEffect, useRef, useState } from "react";
import "./App.css";
const API_URL = import.meta.env.VITE_API_URL || "https://wanderfolders-backend.onrender.com/api/folders";

const SECTIONS = ["Memories", "Checklist", "Expenses", "Itinerary", "Mood Board", "Photos"];
const freshTrip = (form) => ({
  id: Date.now(), name: form.name.trim(), destination: form.destination.trim(),
  startDate: form.startDate, endDate: form.endDate, description: form.description,
  mood: form.mood, cover: form.cover, memories: [], checklist: [], expenses: [],
  itinerary: [], photos: [], moodBoard: []
});
const blankForm = { name: "", destination: "", startDate: "", endDate: "", description: "", mood: "Dreamy", cover: "" };
const readImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
});

export default function App() {
  const [trips, setTrips] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wonderfolders-trips") || "[]"); } catch { return []; }
  });
  const [profile, setProfile] = useState(() => localStorage.getItem("wonderfolders-profile") || "Explorer");
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem("wonderfolders-profile-photo") || "");
  const [selectedId, setSelectedId] = useState(null);
  const [section, setSection] = useState("Memories");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [entry, setEntry] = useState({ title: "", text: "", amount: "", category: "Food", date: "", time: "" });
  const [notice, setNotice] = useState("");
  const coverPicker = useRef(null);
  const photoPicker = useRef(null);
  const profilePicker = useRef(null);
  const trip = trips.find((item) => item.id === selectedId);

  useEffect(() => {
    async function loadTrips() {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Could not load trips");
        const savedTrips = await response.json();
        setTrips(savedTrips);
        localStorage.setItem("wonderfolders-trips", JSON.stringify(savedTrips));
      } catch (error) {
        console.error("Loading trips failed:", error);
        toast("Could not load trips from the server");
      }
    }
    loadTrips();
  }, []);

  useEffect(() => {
    localStorage.setItem("wonderfolders-profile", profile);
  }, [profile]);

  useEffect(() => {
    if (profilePhoto) {
      localStorage.setItem("wonderfolders-profile-photo", profilePhoto);
    }
  }, [profilePhoto]);
  function toast(message) { setNotice(message); window.setTimeout(() => setNotice(""), 2400); }
  function patchTrip(id, change) { setTrips(old => old.map(t => t.id === id ? { ...t, ...change } : t)); }
  function openCreate() { setEditingId(null); setForm(blankForm); setShowForm(true); }
  function openEdit(t) { setEditingId(t.id); setForm({ name:t.name, destination:t.destination, startDate:t.startDate||"", endDate:t.endDate||"", description:t.description||"", mood:t.mood||"Dreamy", cover:t.cover||"" }); setShowForm(true); }
  async function chooseCover(file) { if (file?.type.startsWith("image/")) { const image = await readImage(file); setForm(f => ({ ...f, cover: image })); }}
  async function addPhotos(files, target="photos") {
    if (!trip) return;
    const pics = [];
    for (const file of Array.from(files || [])) if (file.type.startsWith("image/")) pics.push({ id: crypto.randomUUID?.() || String(Date.now()+Math.random()), name:file.name, src:await readImage(file) });
    if (pics.length) { patchTrip(trip.id, { [target]: [...(trip[target] || []), ...pics] }); toast(`${pics.length} photo${pics.length===1?"":"s"} added ✨`); }
  }
  async function saveTrip(e) {
  e.preventDefault();

  if (!form.name.trim() || !form.destination.trim()) return;

  const isEditing = Boolean(editingId);
  const existingTrip = trips.find(t => t.id === editingId);

  const tripData = isEditing
    ? {
        ...existingTrip,
        ...form,
        name: form.name.trim(),
        destination: form.destination.trim()
      }
    : freshTrip(form);

  try {
    const response = await fetch(
      isEditing ? `${API_URL}/${editingId}` : API_URL,
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData)
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const savedTrip = await response.json();

    if (isEditing) {
      setTrips(old =>
        old.map(t => t.id === editingId ? savedTrip : t)
      );
    } else {
      setTrips(old => [savedTrip, ...old]);
      setSelectedId(savedTrip.id);
      setSection("Memories");
    }

    setShowForm(false);
    toast(isEditing ? "Trip updated 💖" : "Trip saved to server! 🎉");
  } catch (error) {
    console.error("Trip save failed:", error);
    toast("Could not save trip to server. Check the connection.");
  }
}    
  function addEntry(e) { e.preventDefault(); if (!trip || !entry.title.trim()) return;
    const key = ({"Memories":"memories","Checklist":"checklist","Expenses":"expenses","Itinerary":"itinerary","Mood Board":"moodBoard"})[section];
    if (!key) return;
    let item;
    if (section === "Checklist") item={ id:Date.now(), title:entry.title.trim(), done:false };
    else if (section === "Expenses") { if (!entry.amount || Number(entry.amount)<=0) return; item={id:Date.now(), title:entry.title.trim(), amount:Number(entry.amount), category:entry.category, date:entry.date || new Date().toLocaleDateString()}; }
    else if (section === "Itinerary") item={id:Date.now(), title:entry.title.trim(), text:entry.text, date:entry.date, time:entry.time};
    else item={id:Date.now(), title:entry.title.trim(), text:entry.text, date:new Date().toLocaleDateString()};
    patchTrip(trip.id,{[key]:[item,...(trip[key]||[])]}); setEntry({title:"",text:"",amount:"",category:"Food",date:"",time:""}); toast("Saved to this trip ♡");
  }
  function removeItem(key,id) { patchTrip(trip.id,{[key]:(trip[key]||[]).filter(x=>x.id!==id)}); }
  function sectionKey(s) { return ({"Memories":"memories","Checklist":"checklist","Expenses":"expenses","Itinerary":"itinerary","Mood Board":"moodBoard","Photos":"photos"})[s]; }
  const visibleTrips = trips.filter(t => `${t.name} ${t.destination}`.toLowerCase().includes(query.toLowerCase()));
  const total = (trip?.expenses || []).reduce((sum,x)=>sum+Number(x.amount||0),0);

  return <div className="wonder-app">
    <header className="topbar"><button className="wordmark" onClick={()=>setSelectedId(null)}><span className="logo-sticker">✿</span><span>WonderFolders<small>little trips, big feelings</small></span></button><div className="top-actions"><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a trip…"/><button className="avatar" onClick={()=>profilePicker.current?.click()}>{profilePhoto?<img src={profilePhoto} alt="Profile"/>:profile.slice(0,1).toUpperCase()}</button><input ref={profilePicker} hidden type="file" accept="image/*" onChange={async e=>{if(e.target.files?.[0])setProfilePhoto(await readImage(e.target.files[0]));}}/></div></header>
    {!trip ? <main className="home-page"><div className="hero"><div><span className="eyebrow">YOUR LITTLE CORNER OF THE WORLD</span><h1>Hey {profile || "Explorer"}!<br/>Where will wonder take you? <span>✧</span></h1><p>Make a folder for every adventure, and fill it with the things you never want to forget.</p><button className="button primary" onClick={openCreate}>＋ Create a trip</button></div><div className="hero-doodle" aria-hidden="true"><span>✈</span><b>collect<br/>moments ♡</b><i>✦</i></div></div>
      <div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2>My trip folders <span>📒</span></h2></div><span className="count-pill">{trips.length} {trips.length===1?"adventure":"adventures"}</span></div>
      {visibleTrips.length ? <div className="trip-grid">{visibleTrips.map((t,i)=><article className={`trip-card color-${i%5}`} key={t.id}><button className="trip-open" onClick={()=>{setSelectedId(t.id);setSection("Memories");}}><div className="trip-art">{t.cover?<img src={t.cover} alt={`${t.name} cover`}/>:<div className="cover-placeholder"><span>{["🌷","🌞","🦋"," ","🌈"][i%5]}</span><small>OUR LITTLE ADVENTURE</small></div>}<span className="tape">✦</span></div><div className="trip-info"><span className="mood-label">{t.mood||"Dreamy"} mood</span><h3>{t.name}</h3><p>  {t.destination}</p><small>{t.startDate||"Date not set"}{t.endDate?` — ${t.endDate}`:""}</small><div className="trip-stats">♡ {(t.memories||[]).length} memories <span>▧ {(t.photos||[]).length} photos</span></div></div></button><button className="edit-trip" onClick={()=>openEdit(t)}>Edit ✎</button><button className="delete-trip" onClick={()=>{if(confirm(`Delete ${t.name}? This removes its folder and contents.`)){setTrips(old=>old.filter(x=>x.id!==t.id));toast("Trip folder deleted");}}}>×</button></article>)}<button className="new-card" onClick={openCreate}><span>＋</span><strong>A new adventure?</strong><small>Start another little story</small></button></div> : <div className="empty-state"><span>🧺</span><h3>Your story starts here</h3><p>Create your first trip folder and make it yours.</p><button className="button primary" onClick={openCreate}>＋ Create my first trip</button></div>}
    </main> : <main className="trip-page"><button className="back-link" onClick={()=>setSelectedId(null)}>  All trip folders</button><div className="trip-hero">{trip.cover?<img className="trip-hero-image" src={trip.cover} alt="Trip cover"/>:<div className="trip-hero-placeholder">✿ ✈ ✿</div>}<div className="trip-hero-copy"><span className="eyebrow">A LITTLE ADVENTURE</span><h1>{trip.name} <span>♡</span></h1><p>  {trip.destination}</p>{trip.description&&<p>{trip.description}</p>}<button className="button soft" onClick={()=>openEdit(trip)}>✎ Edit trip</button></div></div>
      <div className="section-heading"><div><span className="eyebrow">YOUR TRIP, YOUR WAY</span><h2>Open your folder <span>✧</span></h2></div></div>
      <nav className="section-tabs">{SECTIONS.map((s,i)=><button key={s} className={section===s?"tab active":"tab"} onClick={()=>setSection(s)}><span>{["💌","☑","🧾","🗺 ","🎨","📸"][i]}</span>{s}</button>)}</nav>
      <section className="content-card"><div className="content-title"><div><span className="eyebrow">{trip.name.toUpperCase()} FOLDER</span><h2>{section}</h2><p>{({"Memories":"Keep the moments you want to remember.","Checklist":"Get ready without forgetting the little things.","Expenses":"Your spending, just for this trip.","Itinerary":"Your days, plans and places to go.","Mood Board":"Collect colors, inspiration and the feeling of this trip.","Photos":"Photos chosen from your own device."})[section]}</p></div>{section==="Photos"&&<button className="button primary" onClick={()=>photoPicker.current?.click()}>＋ Choose photos</button>}</div>
      <input ref={photoPicker} hidden type="file" accept="image/*" multiple onChange={e=>addPhotos(e.target.files,sectionKey(section))}/>
      {section==="Photos" ? <div className="photo-grid">{(trip.photos||[]).map(p=><figure key={p.id}><img src={p.src} alt={p.name}/><figcaption>{p.name}<button onClick={()=>removeItem("photos",p.id)}>×</button></figcaption></figure>)}<button className="photo-add" onClick={()=>photoPicker.current?.click()}><span>＋</span><strong>Add your photos</strong><small>Choose pictures from your device</small></button></div> : <>
      {section==="Expenses"&&<div className="expense-total"><span>Trip total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>}
      {section==="Mood Board"&&<div className="mood-swatches"><div>🌸<span>Soft & sweet</span></div><div> <span>Bright energy</span></div><div>🌿<span>Slow moments</span></div><div>🦋<span>Dreamy days</span></div></div>}
      <form className="entry-form" onSubmit={addEntry}><h3>{({"Memories":"＋ Add a memory","Checklist":"＋ Add to checklist","Expenses":"＋ Add an expense","Itinerary":"＋ Add a plan","Mood Board":"＋ Add an inspiration note"})[section]}</h3><input value={entry.title} onChange={e=>setEntry({...entry,title:e.target.value})} placeholder={({"Memories":"Memory title…","Checklist":"What do you need to do?","Expenses":"What did you spend on?","Itinerary":"Place or activity…","Mood Board":"Color, idea or inspiration…"})[section]} required/>
      {(section==="Memories"||section==="Itinerary"||section==="Mood Board")&&<textarea rows="3" value={entry.text} onChange={e=>setEntry({...entry,text:e.target.value})} placeholder={section==="Itinerary"?"Details, address or notes…":"Write a little more (optional)…"}/>}
      {section==="Expenses"&&<div className="entry-row"><input type="number" min="1" value={entry.amount} onChange={e=>setEntry({...entry,amount:e.target.value})} placeholder="Amount in ₹" required/><select value={entry.category} onChange={e=>setEntry({...entry,category:e.target.value})}>{["Food","Transport","Stay","Activities","Shopping","Other"].map(x=><option key={x}>{x}</option>)}</select><input type="date" value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})}/></div>}
      {section==="Itinerary"&&<div className="entry-row"><input type="date" value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})}/><input type="time" value={entry.time} onChange={e=>setEntry({...entry,time:e.target.value})}/></div>}
      <button className="button primary">Save to {trip.name} ♡</button></form>
      <div className="entries-list">{(trip[sectionKey(section)]||[]).map(item=><article className={`entry-item ${item.done?"is-done":""}`} key={item.id}>{section==="Checklist"&&<input type="checkbox" checked={item.done} onChange={()=>patchTrip(trip.id,{checklist:trip.checklist.map(x=>x.id===item.id?{...x,done:!x.done}:x)})}/>}<div className="entry-copy"><h3>{item.title}</h3>{item.text&&<p>{item.text}</p>}{section==="Expenses"&&<p>{item.category} · {item.date||"Date not set"}</p>}{section==="Itinerary"&&<p>{item.date} {item.time}</p>}{item.date&&section!=="Expenses"&&<small>{item.date}</small>}</div>{section==="Expenses"&&<strong>₹{Number(item.amount).toLocaleString("en-IN")}</strong>}<button className="remove-entry" onClick={()=>removeItem(sectionKey(section),item.id)} aria-label="Delete item">×</button></article>)}{!(trip[sectionKey(section)]||[]).length&&<div className="empty-section"><span>{({"Memories":"💌","Checklist":"☑","Expenses":"🪙","Itinerary":"🗺 ","Mood Board":"🎨"})[section]}</span><p>Nothing here just yet. Add the first little thing above!</p></div>}</div></>}
      </section>
    </main>}
    {showForm&&<div className="modal-shade" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false);}}><form className="trip-form" onSubmit={saveTrip}><button type="button" className="modal-x" onClick={()=>setShowForm(false)}>×</button><span className="eyebrow">MAKE A LITTLE MAGIC</span><h2>{editingId?"Edit your trip":"Create a new trip folder"} ✨</h2><label>Trip name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Beach days with friends" required/><label>Destination *</label><input value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="e.g. Goa, India" required/><div className="entry-row"><div><label>Start date</label><input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div><div><label>End date</label><input type="date" min={form.startDate||undefined} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div></div><label>Trip cover photo (optional)</label><button type="button" className="file-choice" onClick={()=>coverPicker.current?.click()}>📷 Choose a picture from this device</button><input hidden ref={coverPicker} type="file" accept="image/*" onChange={e=>chooseCover(e.target.files?.[0])}/>{form.cover&&<img className="cover-preview" src={form.cover} alt="Chosen cover preview"/>}<label>Trip mood</label><div className="mood-picks">{["Dreamy","Adventurous","Peaceful","Sunny","Romantic","Playful"].map(m=><button type="button" key={m} className={form.mood===m?"chosen":""} onClick={()=>setForm({...form,mood:m})}>{m}</button>)}</div><label>A little description</label><textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What makes this trip special?"/><div className="form-actions"><button type="button" className="button soft" onClick={()=>setShowForm(false)}>Cancel</button><button className="button primary">{editingId?"Save changes":"Create folder ♡"}</button></div></form></div>}
    {notice&&<div className="toast">{notice}</div>}
  </div>;
}

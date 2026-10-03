import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Clapperboard, Menu, Palette, Megaphone, MessageCircle, ShieldCheck, Sparkles, X, LayoutDashboard, UserRound, LogOut, BriefcaseBusiness, Clock3, CircleCheck, Search, Plus, Trash2, LockKeyhole, Mail, Phone, Globe2 } from 'lucide-react';

// IMPORTANT: Replace this with your WhatsApp number including country code, digits only.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '91XXXXXXXXXX';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function trackWhatsAppClick(source) {
  if (!supabase) return;
  void supabase.from('whatsapp_clicks').insert({ source, page: window.location.pathname }).then(({ error }) => {
    if (error) console.error('Could not record WhatsApp click:', error.message);
  });
}

const services = [
  { no: '01', icon: Code2, title: 'Website development', desc: 'Fast, responsive websites designed to turn visitors into customers.', tags: ['Business websites', 'Landing pages', 'Portfolio sites'] },
  { no: '02', icon: Palette, title: 'Graphic design', desc: 'A clear visual identity that helps your brand stand out everywhere.', tags: ['Brand identity', 'Social creatives', 'Marketing assets'] },
  { no: '03', icon: Clapperboard, title: 'Video editing', desc: 'Polished videos and short-form content made to hold attention.', tags: ['Reels & Shorts', 'Promotional videos', 'YouTube edits'] },
  { no: '04', icon: Megaphone, title: 'Digital marketing', desc: 'Practical campaigns and content to grow your online presence.', tags: ['Social media', 'Ad creatives', 'Content planning'] },
];
const projects = [
  { id: '01', type: 'Web design', title: 'Studio North', desc: 'A clean digital home for a creative studio.', style: 'project-art art-one', mark: 'SN', detail: 'Brand website concept' },
  { id: '02', type: 'Brand identity', title: 'Good Roots', desc: 'A fresh identity for a modern food brand.', style: 'project-art art-two', mark: 'good\nroots', detail: 'Identity & social kit' },
  { id: '03', type: 'Social content', title: 'Move Daily', desc: 'A high-energy campaign for an active lifestyle.', style: 'project-art art-three', mark: 'MOVE\nDAILY', detail: 'Campaign creative concept' },
];
function WhatsAppLink({ children, className = 'btn btn-primary', text = 'Hi Yash! I would like to enquire about your services.', source = 'direct_whatsapp_link' }) {
  const phoneReady = /^\d{10,15}$/.test(WHATSAPP_NUMBER);
  const href = phoneReady ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text + ' Please share your WhatsApp number on the website.')}`;
  return <a className={className} href={href} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick(source)}>{children}</a>;
}
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState('');
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [customerProjects, setCustomerProjects] = useState([]);
  const [notice, setNotice] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('All');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', service: 'Website development', budget: '', message: '' });
  const [loginForm, setLoginForm] = useState({ name: '', email: '', password: '', mode: 'login' });
  const [projectForm, setProjectForm] = useState({ name: '', email: '', status: 'New', progress: 0 });
  const [adminAuthed, setAdminAuthedState] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const setAdminAuthed = (enabled) => {
    if (!enabled) { setAdminAuthedState(false); return; }
    if (!supabase || !user) { setAdminAuthedState(false); return; }
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      setAdminAuthedState(!error && Boolean(data));
      if (error || !data) setNotice('This account does not have admin access.');
    });
  };

  useEffect(() => {
    if (!supabase) return undefined;
    const mapUser = (authUser) => authUser ? {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Client',
    } : null;
    supabase.auth.getSession().then(({ data }) => setUser(mapUser(data.session?.user)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user));
      if (!session) {
        setAdminAuthed(false);
        setLeads([]);
        setCustomerProjects([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setAdminChecked(false);
      setAdminAuthedState(false);
      return;
    }
    let active = true;
    setAdminChecked(false);
    const checkAdmin = async () => {
      const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!active) return;
      setAdminChecked(true);
      setAdminAuthedState(!error && Boolean(data));
      if (!error && data) {
        const { data: liveLeads, error: leadError } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
        if (active && !leadError) setLeads(liveLeads || []);
      }
    };
    checkAdmin();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (modal !== 'admin') return;
    if (!user) {
      setModal('login');
      setNotice('Sign in with your authorized admin account through Client login first.');
    } else if (adminChecked && !adminAuthed) {
      setModal('account');
      setNotice('This account does not have admin access.');
    }
  }, [modal, user?.id, adminChecked, adminAuthed]);

  useEffect(() => {
    if (!supabase || !user || modal !== 'account') return;
    let active = true;
    supabase.from('projects').select('*').eq('client_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) setNotice('Could not load projects. Check the Supabase setup.');
      else setCustomerProjects(data || []);
    });
    return () => { active = false; };
  }, [modal, user?.id]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4200); return () => clearTimeout(t); }, [notice]);

  const submitLead = async (e) => {
    e.preventDefault();
    if (!supabase) { setNotice('The enquiry service is not configured yet. Please contact us by email.'); return; }
    const lead = { ...leadForm };
    const { error } = await supabase.from('leads').insert(lead);
    if (error) { setNotice('Could not save your enquiry. Please try again or contact us by email.'); return; }
    const msg = `Hi Yash! I'd like to enquire.\nName: ${lead.name}\nEmail: ${lead.email}\nService: ${lead.service}\nBudget: ${lead.budget || 'Not decided'}\nDetails: ${lead.message}`;
    setLeadForm({ name: '', email: '', service: 'Website development', budget: '', message: '' });
    setNotice('Your enquiry was saved securely. WhatsApp is opening with your message.');
    trackWhatsAppClick('enquiry_form');
    const ready = /^\d{10,15}$/.test(WHATSAPP_NUMBER);
    window.open(ready ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) { setNotice('Client accounts are not configured yet.'); return; }
    if (!loginForm.email.trim() || loginForm.password.length < 8 || (loginForm.mode === 'register' && !loginForm.name.trim())) {
      setNotice('Enter your email and a password of at least 8 characters.');
      return;
    }
    const result = loginForm.mode === 'register'
      ? await supabase.auth.signUp({ email: loginForm.email.trim(), password: loginForm.password, options: { data: { full_name: loginForm.name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: loginForm.email.trim(), password: loginForm.password });
    if (result.error) { setNotice(result.error.message); return; }
    setModal('');
    setLoginForm({ name: '', email: '', password: '', mode: 'login' });
    setNotice(loginForm.mode === 'register' && !result.data.session ? 'Account created. Check your email to confirm it, then sign in.' : 'Signed in securely.');
  };
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!supabase) { setNotice('Admin sign-in is not configured yet.'); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: adminEmail.trim(), password: adminPass });
    if (error) { setNotice(error.message); return; }
    const { data: membership, error: membershipError } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (membershipError || !membership) {
      await supabase.auth.signOut();
      setNotice('This account does not have admin access.');
      return;
    }
    setAdminAuthedState(true);
    setAdminPass('');
    const { data: liveLeads, error: leadsError } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (leadsError) setNotice('Signed in, but could not load enquiries. Check the Supabase policies.');
    else setLeads(liveLeads || []);
  };
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setAdminAuthed(false);
    setModal('');
    setNotice('You have signed out.');
  };
  const filteredLeads = useMemo(() => leads.filter(l => (adminFilter === 'All' || l.status === adminFilter) && `${l.name} ${l.email} ${l.service} ${l.id}`.toLowerCase().includes(adminSearch.toLowerCase())), [leads, adminFilter, adminSearch]);
  const updateLead = async (id, status) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) { setNotice('Could not update this enquiry.'); return; }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };
  const deleteLead = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { setNotice('Could not delete this enquiry.'); return; }
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };
  const addProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    const clientEmail = projectForm.email.trim().toLowerCase() || user?.email;
    const { data: client, error: clientError } = await supabase.from('profiles').select('id').eq('email', clientEmail).maybeSingle();
    if (clientError || !client) { setNotice('No client account found for that email. Ask them to register first.'); return; }
    const project = { name: projectForm.name.trim(), status: projectForm.status, progress: projectForm.progress, client_id: client.id };
    const { data, error } = await supabase.from('projects').insert(project).select('*').single();
    if (error) { setNotice('Could not add this project.'); return; }
    setCustomerProjects(prev => [data, ...prev]);
    setProjectForm({ name: '', email: '', status: 'New', progress: 0 });
    setNotice('Project assigned to the client.');
  };

  return <>
    <header className="site-header"><a className="brand" href="#home" onClick={() => setMenuOpen(false)}><span className="brand-mark">Y<span>.</span></span><span className="brand-name">YPX<span>STUDIOS</span></span></a>
      <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'}><a href="#services" onClick={() => setMenuOpen(false)}>Services</a><a href="#work" onClick={() => setMenuOpen(false)}>Our work</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a><button className="nav-login" onClick={() => { setModal(user ? 'account' : 'login'); setMenuOpen(false); }}>{user ? <><UserRound size={16} /> My projects</> : <><UserRound size={16} /> Client login</>}</button>{adminAuthed && <button className="nav-admin" onClick={() => { setModal('admin'); setMenuOpen(false); }}>Admin <ArrowUpRight size={15} /></button>}</nav>
    </header>
    <main>
      <section className="hero" id="home"><div className="hero-grid"></div><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> INDEPENDENT DIGITAL STUDIO <span className="eyebrow-line"></span> HUBLI, INDIA</div><h1>Good ideas.<br /><span>Thoughtfully</span><br />made digital.</h1><p className="hero-lede">Helping ambitious businesses look sharper, work smarter, and grow online with design and technology that makes a difference.</p><div className="hero-actions"><a className="btn btn-light" href="#contact">Start a project <ArrowRight size={17} /></a><a className="text-link" href="#work">Explore our work <ArrowDownRight size={17} /></a></div><div className="hero-proof"><div className="proof-avatars"><span>Y</span><span>W</span><span>✳</span></div><div><strong>Small studio. Personal attention.</strong><small>From first idea to final launch.</small></div></div></div>
        <div className="hero-visual"><div className="visual-orbit orbit-a"></div><div className="visual-orbit orbit-b"></div><div className="visual-card card-main"><div className="visual-card-top"><span className="mini-logo">Y.</span><span className="live-tag"><span></span> YOUR NEXT CHAPTER</span></div><div className="visual-headline">Make your<br /><em>mark.</em></div><div className="visual-card-bottom"><span>DESIGN · DIGITAL · GROWTH</span><span className="circle-arrow"><ArrowUpRight size={20} /></span></div><div className="visual-shape"></div></div><div className="float-card float-card-one"><span className="float-icon"><Palette size={18} /></span><div><strong>Design that speaks</strong><small>Distinctive by design</small></div><Check size={16} className="float-check" /></div><div className="float-card float-card-two"><div className="progress-label"><span>PROJECT MOMENTUM</span><b>+38%</b></div><div className="mini-bars">{[28,42,34,58,49,72,64,89,76,100].map((n,i)=><span key={i} style={{height:`${n}%`}} />)}</div><small>Built to keep you moving</small></div><div className="decor-star">✳</div></div>
        <div className="hero-index"><span>01</span><span className="index-line"></span><span>04</span><span className="index-label">WHAT WE DO</span></div></section>
      <section className="trust-strip"><span>CREATIVE THINKING</span><i></i><span>USEFUL TECHNOLOGY</span><i></i><span>MEANINGFUL GROWTH</span><i></i><span>BUILT AROUND YOU</span></section>
      <section className="section services-section" id="services"><div className="section-head"><div><div className="eyebrow dark-eyebrow">WHAT WE CAN DO <span className="eyebrow-line"></span> 01—04</div><h2>All the right skills.<br /><span>One creative partner.</span></h2></div><p>From your first online presence to the next stage of growth, get practical digital services that work together.</p></div><div className="services-grid">{services.map(({no,icon:Icon,title,desc,tags})=><article className="service-card" key={no}><div className="service-top"><span>{no}</span><span className="service-icon"><Icon size={22} strokeWidth={1.7} /></span></div><h3>{title}</h3><p>{desc}</p><div className="tag-list">{tags.map(t=><span key={t}>{t}</span>)}</div><a href="#contact" className="service-link" onClick={()=>setLeadForm(f=>({...f,service:title}))}>Discuss a project <ArrowUpRight size={17} /></a></article>)}</div></section>
      <section className="work-section" id="work"><div className="section work-inner"><div className="section-head"><div><div className="eyebrow dark-eyebrow">SELECTED CONCEPTS <span className="eyebrow-line"></span> 02—04</div><h2>Made with purpose.<br /><span>Designed to connect.</span></h2></div><p>A glimpse of the visual direction we can create. These are concept samples, not client projects.</p></div><div className="projects-grid">{projects.map(p=><article className="project-card" key={p.id}><div className={p.style}><div className="art-top"><span>{p.type.toUpperCase()}</span><ArrowUpRight size={19} /></div><div className="art-mark">{p.mark.split('\n').map((line,i)=><React.Fragment key={i}>{i>0&&<br/>}{line}</React.Fragment>)}</div><div className="art-bottom"><span>CONCEPT / 2026</span><span>{p.id}</span></div></div><div className="project-info"><div><h3>{p.title}</h3><p>{p.desc}</p></div><span className="project-number">{p.id}</span></div></article>)}</div><div className="work-note"><Sparkles size={16} /> Have a project in mind? Let's make something that feels like you. <a href="#contact">Tell us about it <ArrowRight size={15} /></a></div></div></section>
      <section className="about-section" id="about"><div className="about-visual"><div className="about-outline"></div><div className="about-stamp">THOUGHTFUL<br />BY DESIGN <span>✳</span></div><div className="about-big-y">Y.</div><div className="about-bottom-label">LOCAL ROOTS. DIGITAL REACH.</div></div><div className="about-copy"><div className="eyebrow dark-eyebrow">A LITTLE ABOUT US <span className="eyebrow-line"></span> 03—04</div><h2>Good work starts<br />with <span>a good conversation.</span></h2><p className="about-lede">YPX Studios is an independent creative studio built around one simple idea: digital work should feel clear, collaborative, and useful.</p><p>Whether you're starting a business, refreshing your brand, or trying to reach more customers, we'll work with you to find the right next step—without making things unnecessarily complicated.</p><div className="values-list"><div><span className="value-icon"><MessageCircle size={17}/></span><div><strong>Direct communication</strong><small>Talk to the person doing the work.</small></div></div><div><span className="value-icon"><ShieldCheck size={17}/></span><div><strong>Thoughtful delivery</strong><small>Clear scope, useful updates, no guesswork.</small></div></div><div><span className="value-icon"><Globe2 size={17}/></span><div><strong>Made for real people</strong><small>Practical digital experiences for your audience.</small></div></div></div></div></section>
      <section className="contact-section" id="contact"><div className="contact-panel"><div className="contact-copy"><div className="eyebrow">YOUR NEXT MOVE <span className="eyebrow-line"></span> 04—04</div><h2>Let's make<br />something <em>matter.</em></h2><p>Tell us a little about your idea. We'll take it from there, one clear step at a time.</p><div className="contact-details"><div><span><Mail size={16}/></span><div><small>EMAIL</small><strong>mvyashwant@gmail.com</strong></div></div><div><span><MapPinIcon /></span><div><small>BASED IN</small><strong>Hubli, Karnataka, India</strong></div></div></div><WhatsAppLink className="contact-whatsapp"><MessageCircle size={18}/> Prefer WhatsApp? Chat with us <ArrowUpRight size={16}/></WhatsAppLink></div><form className="contact-form" onSubmit={submitLead}><div className="form-heading"><h3>Start a conversation</h3><span>We usually reply within 1–2 business days.</span></div><div className="form-row"><label>Your name<input required value={leadForm.name} onChange={e=>setLeadForm({...leadForm,name:e.target.value})} placeholder="Name" /></label><label>Email address<input required type="email" value={leadForm.email} onChange={e=>setLeadForm({...leadForm,email:e.target.value})} placeholder="you@example.com" /></label></div><label>What can we help with?<span className="select-wrap"><select value={leadForm.service} onChange={e=>setLeadForm({...leadForm,service:e.target.value})}>{services.map(s=><option key={s.title}>{s.title}</option>)}<option>Something else</option></select><ChevronDown size={16}/></span></label><label>Approximate budget <span className="select-wrap"><select value={leadForm.budget} onChange={e=>setLeadForm({...leadForm,budget:e.target.value})}><option value="">Choose a range (optional)</option><option>Under ₹5,000</option><option>₹5,000–₹15,000</option><option>₹15,000–₹30,000</option><option>₹30,000+</option><option>Not sure yet</option></select><ChevronDown size={16}/></span></label><label>Tell us about your project<textarea required rows="3" value={leadForm.message} onChange={e=>setLeadForm({...leadForm,message:e.target.value})} placeholder="What are you looking to create?" /></label><button className="btn btn-light form-submit" type="submit">Send enquiry <ArrowRight size={17}/></button><small className="form-privacy"><LockKeyhole size={12}/> Your details are used to respond to your enquiry.</small></form></div></section>
      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark">Y<span>.</span></span><span className="brand-name">YPX<span>STUDIOS</span></span></a><p>Independent by nature. Digital by design.</p><div className="footer-right"><span>© 2026 YPX Studios</span><a href="#home">Back to top ↑</a></div></footer>
    </main>
    {notice && <div className="toast" role="status"><CircleCheck size={18}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal('')}}><section className="modal" role="dialog" aria-modal="true" aria-label={modal==='admin'?'Admin dashboard':'Client portal'}><button className="modal-close" onClick={()=>setModal('')} aria-label="Close"><X/></button>
      {modal==='login' && <><div className="modal-kicker"><UserRound size={17}/> CLIENT PORTAL</div><h2>{loginForm.mode==='login'?'Welcome back.':'Create your portal.'}</h2><p className="modal-sub">Sign in to see project updates assigned to your account.</p><form className="modal-form" onSubmit={handleLogin}>{loginForm.mode==='register'&&<label>Full name<input required value={loginForm.name} onChange={e=>setLoginForm({...loginForm,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input required type="email" value={loginForm.email} onChange={e=>setLoginForm({...loginForm,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required type="password" minLength="8" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})} placeholder="At least 8 characters"/></label><button className="btn btn-blue form-submit">{loginForm.mode==='login'?'Continue to projects':'Create account'} <ArrowRight size={16}/></button></form><p className="modal-switch">{loginForm.mode==='login'?"New here?":"Already have an account?"} <button onClick={()=>setLoginForm(f=>({...f,mode:f.mode==='login'?'register':'login'}))}>{loginForm.mode==='login'?'Create an account':'Sign in'}</button></p></>}
      {modal==='account' && user && <><div className="modal-kicker"><BriefcaseBusiness size={17}/> CLIENT PORTAL</div><div className="account-heading"><div><h2>Hi, {user.name.split(' ')[0]}.</h2><p className="modal-sub">Here are your project updates.</p></div><button className="subtle-button" onClick={logout}><LogOut size={15}/> Sign out</button></div><div className="project-list">{customerProjects.map(p=><div className="client-project" key={p.id}><div className="client-project-top"><div><span>{p.id}</span><h3>{p.name}</h3></div><span className={`status-pill status-${p.status.toLowerCase().replaceAll(' ','-')}`}>{p.status}</span></div><div className="progress-track"><span style={{width:`${p.progress}%`}}/></div><div className="project-meta"><span>{p.progress}% complete</span><span>Updated {p.updated}</span></div></div>)}{customerProjects.length===0&&<div className="empty-state"><InboxIcon/><strong>No projects assigned yet</strong><span>Your project updates will appear here.</span></div>}</div><WhatsAppLink className="btn btn-blue form-submit" text={`Hi Yash, I'm ${user.name} (${user.email}). Can you share an update on my project?`}>Ask for a project update <MessageCircle size={16}/></WhatsAppLink></>}
      {modal==='admin' && (!adminAuthed ? <><div className="modal-kicker"><LayoutDashboard size={17}/> ADMIN WORKSPACE</div><h2>Manage your leads.</h2><p className="modal-sub">Enter the demo password to open the local lead dashboard.</p><form className="modal-form" onSubmit={e=>{e.preventDefault();if(adminPass==='Yash@123'){setAdminAuthed(true);setAdminPass('')}else setNotice('Incorrect demo password. Try Yash@123.')}}><label>Demo admin password<input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} placeholder="Enter password" required/></label><button className="btn btn-blue form-submit">Open dashboard <ArrowRight size={16}/></button></form><p className="demo-warning">Demo password: <strong>Yash@123</strong>. This is not secure authentication—do not publish this demo as-is.</p></> : <><div className="modal-kicker"><LayoutDashboard size={17}/> ADMIN WORKSPACE</div><div className="dashboard-heading"><div><h2>Lead dashboard</h2><p className="modal-sub">Enquiries saved in this browser.</p></div><button className="subtle-button" onClick={()=>setAdminAuthed(false)}><LogOut size={15}/> Lock</button></div><div className="stats-grid"><div><small>TOTAL LEADS</small><strong>{leads.length}</strong></div><div><small>NEW</small><strong>{leads.filter(l=>l.status==='New').length}</strong></div><div><small>IN PROGRESS</small><strong>{leads.filter(l=>l.status==='In progress').length}</strong></div></div><div className="dashboard-tools"><label className="search-field"><Search size={15}/><input value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="Search leads"/></label><select value={adminFilter} onChange={e=>setAdminFilter(e.target.value)}><option>All</option><option>New</option><option>Contacted</option><option>In progress</option><option>Closed</option></select></div><div className="lead-table-wrap"><table className="lead-table"><thead><tr><th>Lead</th><th>Service</th><th>Status</th><th></th></tr></thead><tbody>{filteredLeads.map(l=><tr key={l.id}><td><strong>{l.name}</strong><small>{l.email}</small><small>{l.id} · {l.date}</small></td><td>{l.service}<small>{l.budget||'Budget not set'}</small></td><td><select aria-label={`Status for ${l.name}`} value={l.status} onChange={e=>updateLead(l.id,e.target.value)}><option>New</option><option>Contacted</option><option>In progress</option><option>Closed</option></select></td><td><button className="icon-button danger" title="Delete lead" onClick={()=>setLeads(prev=>prev.filter(x=>x.id!==l.id))}><Trash2 size={15}/></button></td></tr>)}</tbody></table>{filteredLeads.length===0&&<div className="empty-state"><InboxIcon/><strong>No leads found</strong><span>Website enquiries will appear here in this browser.</span></div>}</div><form className="add-project-form" onSubmit={addProject}><h3><Plus size={16}/> Add a project for the client portal</h3><div className="add-project-row"><input required value={projectForm.name} onChange={e=>setProjectForm({...projectForm,name:e.target.value})} placeholder="Project name"/><select value={projectForm.status} onChange={e=>setProjectForm({...projectForm,status:e.target.value,progress:e.target.value==='New'?0:e.target.value==='Review'?90:e.target.value==='Completed'?100:50})}><option>New</option><option>In progress</option><option>Review</option><option>Completed</option></select><button className="btn btn-blue" type="submit">Add</button></div></form><p className="demo-warning">Local demo only: leads and projects are not shared across devices. Before launch, add a backend, database, and secure admin authentication.</p></>)}
    </section></div>}
  </>;
}
function MapPinIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>}
function InboxIcon(){return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16l2 10v5H2v-5L4 4Z"/><path d="M2 14h6l2 3h4l2-3h6"/></svg>}
export default App;

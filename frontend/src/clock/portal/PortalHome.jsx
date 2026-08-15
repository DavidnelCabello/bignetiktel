import { useState, useEffect, useRef } from 'react'
import { portalApi } from '../../api'
import { LogOut, User, Clock, IdCard, Home, CalendarDays, Camera, Save, KeyRound, ChevronLeft, ChevronRight, Briefcase, Building2, Wallet, Palmtree, LifeBuoy, Plus, Send, X, ArrowLeft, Trash2, PencilRuler } from 'lucide-react'
import NotificationBell from '../../components/NotificationBell'
import { time12, stamp12 } from '../../lib/time'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW = ['L','M','X','J','V','S','D']
const pad = n => String(n).padStart(2, '0')

export default function PortalHome({ emp, setEmp, onLogout }) {
  const [tab, setTab] = useState('inicio')
  const fullName = `${emp.first_name} ${emp.second_name || ''} ${emp.last_name || ''}`.replace(/\s+/g, ' ').trim()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-emerald-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          {emp.photo ? <img src={emp.photo} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/40" /> : <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"><User size={20} /></div>}
          <div className="min-w-0">
            <p className="font-bold leading-tight truncate">{fullName}</p>
            <p className="text-emerald-100 text-xs">{emp.position || 'Empleado'} · ID {emp.employee_code}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell variant="dark" fetchList={portalApi.notifications} fetchUnread={portalApi.notifUnread} markRead={portalApi.notifRead} onOpenItem={() => setTab('soporte')} />
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg"><LogOut size={16} /> Salir</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {[['inicio','Inicio',Home],['perfil','Perfil',User],['horas','Mis Horas',CalendarDays],['vacaciones','Vacaciones',Palmtree],['soporte','Soporte',LifeBuoy]].map(([id,label,Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === id ? 'border-white text-white' : 'border-transparent text-emerald-100 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {tab === 'inicio' && <Inicio emp={emp} />}
        {tab === 'perfil' && <Perfil emp={emp} setEmp={setEmp} onLogout={onLogout} />}
        {tab === 'horas' && <MisHoras />}
        {tab === 'vacaciones' && <Vacaciones emp={emp} />}
        {tab === 'soporte' && <Soporte />}
      </main>
    </div>
  )
}

function Inicio({ emp }) {
  const [s, setS] = useState(null)
  useEffect(() => { portalApi.getSummary().then(setS).catch(() => {}) }, [])
  const money = (v) => `${v} ${emp.currency}`
  return (
    <div className="space-y-4">
      {s?.open && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2"><Clock size={16} /> Estás fichado ahora mismo.</div>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Horas este mes" value={s ? s.total_hours : '—'} />
        <Card label="Horas extra" value={s ? s.extra_hours : '—'} />
        <Card label="Días trabajados" value={s ? s.days_worked : '—'} />
        <Card label="Pago estimado" value={s ? (s.pay_type === 'hourly' ? money(s.pay) : money(s.pay) + ' /mes') : '—'} accent />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <Row icon={Briefcase} label="Puesto" value={emp.position || '—'} />
        <Row icon={Building2} label="Departamento" value={emp.department || '—'} />
        <Row icon={Wallet} label="Salario" value={`${emp.pay_rate} ${emp.currency} / ${emp.pay_type === 'hourly' ? 'hora' : 'mes'}`} />
        <Row icon={IdCard} label="ID de empleado" value={emp.employee_code} />
      </div>
      <p className="text-xs text-slate-400 text-center">Las horas y el pago son solo de lectura. Si ves un error, escribe a Recursos Humanos.</p>
    </div>
  )
}

function Perfil({ emp, setEmp, onLogout }) {
  const [form, setForm] = useState({ phone: emp.phone || '', email: emp.email || '', address: emp.address || '' })
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')
  const fileRef = useRef()
  const [pw, setPw] = useState({ cur: '', np: '', np2: '' })
  const [pwMsg, setPwMsg] = useState(''); const [pwErr, setPwErr] = useState('')

  async function saveProfile(e) {
    e.preventDefault(); setErr(''); setMsg('')
    try { const d = await portalApi.updateProfile(form); setEmp(d.employee); setMsg('Datos actualizados') }
    catch (e) { setErr(e.message) }
  }
  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) return setErr('La imagen debe pesar menos de 2 MB')
    const reader = new FileReader()
    reader.onload = async () => {
      try { const d = await portalApi.updatePhoto(reader.result); setEmp({ ...emp, photo: d.photo }); setMsg('Foto actualizada') }
      catch (e) { setErr(e.message) }
    }
    reader.readAsDataURL(file)
  }
  async function changePw(e) {
    e.preventDefault(); setPwErr(''); setPwMsg('')
    if (pw.np.length < 6) return setPwErr('Mínimo 6 caracteres')
    if (pw.np !== pw.np2) return setPwErr('Las contraseñas no coinciden')
    try { await portalApi.changePassword(pw.cur, pw.np); setPwMsg('Contraseña cambiada. Vuelve a iniciar sesión.'); setTimeout(onLogout, 1600) }
    catch (e) { setPwErr(e.message) }
  }

  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500'
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          {emp.photo ? <img src={emp.photo} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center"><User size={26} className="text-slate-500" /></div>}
          <div>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700"><Camera size={15} /> Cambiar foto</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            <p className="text-xs text-slate-400 mt-1">JPG o PNG, hasta 2 MB</p>
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Mis datos de contacto</h3>
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        {msg && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{msg}</p>}
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inp} /></div>
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} /></div>
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inp} /></div>
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Save size={15} /> Guardar</button>
        <p className="text-xs text-slate-400">Tu nombre, documento, puesto y salario solo los cambia Recursos Humanos. Tus datos biométricos no se pueden editar aquí.</p>
      </form>

      <form onSubmit={changePw} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2"><KeyRound size={16} /> Cambiar contraseña</h3>
        {pwErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwErr}</p>}
        {pwMsg && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{pwMsg}</p>}
        <div><label className="block text-xs font-medium text-slate-500 mb-1">Contraseña actual</label><input type="password" value={pw.cur} onChange={e => setPw({...pw, cur: e.target.value})} className={inp} required /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Nueva</label><input type="password" value={pw.np} onChange={e => setPw({...pw, np: e.target.value})} className={inp} required /></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Repetir nueva</label><input type="password" value={pw.np2} onChange={e => setPw({...pw, np2: e.target.value})} className={inp} required /></div>
        </div>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900">Cambiar contraseña</button>
      </form>
    </div>
  )
}

function MisHoras() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-based
  const [byDay, setByDay] = useState({})
  const [sel, setSel] = useState(null)
  const [changes, setChanges] = useState([])
  const [reqForm, setReqForm] = useState(null)
  const [reqErr, setReqErr] = useState('')

  useEffect(() => {
    const from = `${year}-${pad(month + 1)}-01`
    const to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
    portalApi.getTime(from, to).then(rows => {
      const map = {}
      for (const r of rows) { const d = (r.check_in || '').slice(0, 10); (map[d] = map[d] || []).push(r) }
      setByDay(map); setSel(null)
    }).catch(() => setByDay({}))
  }, [year, month])

  function loadChanges() { portalApi.getTimeChanges().then(setChanges).catch(() => {}) }
  useEffect(() => { loadChanges() }, [])

  // Construir la cuadrícula (semana empieza lunes).
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // 0=Lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dayHours(d) {
    const key = `${year}-${pad(month + 1)}-${pad(d)}`
    const list = byDay[key] || []
    const total = list.reduce((a, r) => a + (r.hours || 0), 0)
    return { key, list, total }
  }
  function prev() { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }
  const fmt = time12
  const cinp = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500'

  function openReq() {
    const first = (byDay[sel] || [])[0]
    setReqErr('')
    setReqForm({ date: sel, entry_id: first?.id || null, check_in: first ? first.check_in.slice(11, 16) : '', check_out: first?.check_out ? first.check_out.slice(11, 16) : '', reason_type: 'Olvido', reason: '' })
  }
  async function submitReq(e) {
    e.preventDefault(); setReqErr('')
    const p = { entry_id: reqForm.entry_id, date: reqForm.date, reason_type: reqForm.reason_type, reason: reqForm.reason }
    if (reqForm.check_in) p.check_in = reqForm.check_in
    if (reqForm.check_out) p.check_out = reqForm.check_out
    try { await portalApi.createTimeChange(p); setReqForm(null); loadChanges() } catch (e) { setReqErr(e.message) }
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronLeft size={20} /></button>
          <p className="font-semibold text-slate-800">{MONTHS[month]} {year}</p>
          <button onClick={next} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DOW.map(d => <div key={d} className="text-[11px] font-semibold text-slate-400 py-1">{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const { key, total } = dayHours(d)
            const worked = total > 0
            const isSel = sel === key
            return (
              <button key={i} onClick={() => setSel(isSel ? null : key)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${isSel ? 'bg-emerald-600 text-white' : worked ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                <span>{d}</span>
                {worked && <span className={`text-[10px] ${isSel ? 'text-emerald-100' : 'text-emerald-500'}`}>{total.toFixed(1)}h</span>}
              </button>
            )
          })}
        </div>
      </div>

      {sel && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="font-semibold text-slate-800">{sel}</p>
          {(byDay[sel] || []).length === 0 && <p className="text-sm text-slate-400">Sin fichaje este día.</p>}
          {(byDay[sel] || []).map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
              <span className="text-slate-600">Entrada <strong>{fmt(r.check_in)}</strong> → Salida <strong>{r.check_out ? fmt(r.check_out) : 'en curso'}</strong></span>
              <span className="font-semibold text-slate-800">{r.hours != null ? `${r.hours} h` : '—'}</span>
            </div>
          ))}

          {!reqForm && <button onClick={openReq} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 active:scale-[0.99] transition"><PencilRuler size={16} /> Solicitar corrección</button>}

          {reqForm && (
            <form onSubmit={submitReq} className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">Corregir horario del {reqForm.date}</p>
              {reqErr && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{reqErr}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Entrada correcta</label><input type="time" value={reqForm.check_in} onChange={e => setReqForm({ ...reqForm, check_in: e.target.value })} className={cinp} /></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Salida correcta</label><input type="time" value={reqForm.check_out} onChange={e => setReqForm({ ...reqForm, check_out: e.target.value })} className={cinp} /></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Motivo</label>
                <select value={reqForm.reason_type} onChange={e => setReqForm({ ...reqForm, reason_type: e.target.value })} className={cinp}>
                  <option value="Olvido">Se me olvidó marcar</option>
                  <option value="Evento">Evento / reunión</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1">Nota (opcional)</label><textarea value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} rows={2} className={cinp} placeholder="Ej. entré 8:40 pero llegué 8:00" /></div>
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"><Send size={15} /> Enviar a RRHH</button>
                <button type="button" onClick={() => setReqForm(null)} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm">Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {Object.keys(byDay).length === 0 && <p className="text-center text-slate-400 text-sm py-4">No hay fichajes este mes. Toca un día para pedir una corrección.</p>}

      {changes.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Mis correcciones</p>
          <div className="space-y-2">
            {changes.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <p className="text-slate-700"><strong>{c.date}</strong> · {c.requested_check_in ? `entrada ${fmt(c.requested_check_in)}` : ''}{c.requested_check_in && c.requested_check_out ? ' · ' : ''}{c.requested_check_out ? `salida ${fmt(c.requested_check_out)}` : ''}</p>
                    {c.reason_type && <p className="text-xs text-slate-400">{c.reason_type}{c.reason ? ` — ${c.reason}` : ''}</p>}
                    {c.admin_note && <p className="text-xs text-slate-500 italic mt-0.5">RRHH: {c.admin_note}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LEAVE_LABEL = { vacaciones: 'Vacaciones', enfermedad: 'Enfermedad', personal: 'Personal' }
const STATUS_STYLE = {
  pendiente: 'bg-amber-50 text-amber-700', aprobada: 'bg-emerald-50 text-emerald-700', rechazada: 'bg-red-50 text-red-700',
  abierto: 'bg-emerald-50 text-emerald-700', cerrado: 'bg-slate-100 text-slate-500',
}

function Vacaciones({ emp }) {
  const [data, setData] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'vacaciones', start_date: '', end_date: '', reason: '' })
  const [err, setErr] = useState('')

  function load() { portalApi.getLeaves().then(setData).catch(() => {}) }
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault(); setErr('')
    try { await portalApi.createLeave(form); setShowForm(false); setForm({ type: 'vacaciones', start_date: '', end_date: '', reason: '' }); load() }
    catch (e) { setErr(e.message) }
  }
  async function cancel(id) {
    if (!confirm('¿Cancelar esta solicitud?')) return
    try { await portalApi.cancelLeave(id); load() } catch (e) { alert(e.message) }
  }

  const b = data?.balance
  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500'
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card label={`Días/año`} value={b ? b.allowance : '—'} />
        <Card label={`Usados ${b?.year || ''}`} value={b ? b.used : '—'} />
        <Card label="Disponibles" value={b ? b.remaining : '—'} accent />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Mis solicitudes</h3>
        <button onClick={() => { setShowForm(!showForm); setErr('') }} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"><Plus size={16} /> Solicitar</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inp}>
                <option value="vacaciones">Vacaciones</option><option value="enfermedad">Enfermedad</option><option value="personal">Personal</option>
              </select></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Desde</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inp} required /></div>
            <div><label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inp} required /></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Motivo (opcional)</label><textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={2} className={inp} /></div>
          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Send size={15} /> Enviar solicitud</button>
        </form>
      )}

      <div className="space-y-2">
        {data?.requests?.length === 0 && <p className="text-slate-400 text-sm py-6 text-center">Aún no tienes solicitudes.</p>}
        {data?.requests?.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-800">{LEAVE_LABEL[r.type]} · {r.days} día{r.days === 1 ? '' : 's'}</p>
                <p className="text-xs text-slate-500">{r.start_date} → {r.end_date}</p>
                {r.reason && <p className="text-xs text-slate-400 mt-1">{r.reason}</p>}
                {r.admin_note && <p className="text-xs text-slate-500 mt-1 italic">RRHH: {r.admin_note}</p>}
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                {r.status === 'pendiente' && <button onClick={() => cancel(r.id)} className="block ml-auto mt-2 text-xs text-slate-400 hover:text-red-600">Cancelar</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Soporte() {
  const [tickets, setTickets] = useState([])
  const [open, setOpen] = useState(null) // ticket detail
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '' })
  const [reply, setReply] = useState('')
  const [err, setErr] = useState('')

  function load() { portalApi.getTickets().then(setTickets).catch(() => {}) }
  useEffect(() => { load() }, [])
  function openTicket(id) { portalApi.getTicket(id).then(setOpen).catch(() => {}) }

  async function create(e) {
    e.preventDefault(); setErr('')
    try { await portalApi.createTicket(form); setShowForm(false); setForm({ subject: '', message: '' }); load() }
    catch (e) { setErr(e.message) }
  }
  async function sendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    try { await portalApi.replyTicket(open.id, reply); setReply(''); openTicket(open.id); load() } catch (e) { alert(e.message) }
  }
  async function del(id, fromDetail) {
    if (!confirm('¿Eliminar este ticket cerrado? Se borrará la conversación.')) return
    try { await portalApi.deleteTicket(id); if (fromDetail) setOpen(null); load() } catch (e) { alert(e.message) }
  }

  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500'

  if (open) return (
    <div className="space-y-3">
      <button onClick={() => { setOpen(null); load() }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={16} /> Volver</button>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-800">{open.subject}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[open.status]}`}>{open.status}</span>
        </div>
        {open.status === 'cerrado' && (
          <button onClick={() => del(open.id, true)} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 active:scale-[0.99] transition-transform">
            <Trash2 size={18} /> Eliminar este ticket
          </button>
        )}
      </div>
      <div className="space-y-2">
        {open.messages.map(m => (
          <div key={m.id} className={`max-w-[85%] rounded-xl px-4 py-2.5 ${m.author_type === 'admin' ? 'bg-white border border-slate-200' : 'bg-emerald-600 text-white ml-auto'}`}>
            <p className={`text-[11px] mb-0.5 ${m.author_type === 'admin' ? 'text-slate-400' : 'text-emerald-100'}`}>{m.author_type === 'admin' ? `RRHH · ${m.author_name}` : 'Tú'} · {stamp12(m.created_at)}</p>
            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>
      {open.status === 'abierto' && (
        <form onSubmit={sendReply} className="flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} className={inp} placeholder="Escribe una respuesta…" />
          <button type="submit" className="px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Send size={16} /></button>
        </form>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Mis tickets a Recursos Humanos</h3>
        <button onClick={() => { setShowForm(!showForm); setErr('') }} className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"><Plus size={16} /> Nuevo</button>
      </div>
      {showForm && (
        <form onSubmit={create} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Asunto</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className={inp} required /></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1">Mensaje</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} className={inp} required /></div>
          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"><Send size={15} /> Enviar</button>
        </form>
      )}
      <div className="space-y-2">
        {tickets.length === 0 && <p className="text-slate-400 text-sm py-6 text-center">No tienes tickets. Crea uno si necesitas algo de RRHH.</p>}
        {tickets.map(t => (
          <div key={t.id} className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <button onClick={() => openTicket(t.id)} className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-800 truncate">{t.subject}</p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[t.status]}`}>{t.status}</span>
              </div>
              {t.last_message && <p className="text-xs text-slate-500 mt-1 truncate">{t.last_message}</p>}
            </button>
            {t.status === 'cerrado' && <button onClick={() => del(t.id)} title="Eliminar ticket" className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl shrink-0 active:scale-95 transition-transform"><Trash2 size={20} /></button>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ label, value, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200'}`}>
      <p className={`text-xl font-bold ${accent ? 'text-white' : 'text-slate-800'}`}>{value}</p>
      <p className={`text-xs ${accent ? 'text-emerald-100' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}
function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={18} className="text-slate-400" />
      <span className="text-sm text-slate-500">{label}</span>
      <span className="ml-auto text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

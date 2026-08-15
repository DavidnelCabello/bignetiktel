import { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Image, Modal, RefreshControl, ImageBackground,
} from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'

const LOGIN_BG = require('./assets/login-bg.jpg')

// Backend por HTTPS (Cloudflare Tunnel). Alternativa WiFi: http://10.59.4.209:3001/api
const DEFAULT_API = 'https://mobiles-economics-gzip-runs.trycloudflare.com/api'

async function tfetch(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try { return await fetch(url, { ...opts, signal: ctrl.signal }) }
  finally { clearTimeout(t) }
}
function time12(s) {
  if (!s) return '—'
  const [H, M] = s.slice(11, 16).split(':').map(Number)
  if (Number.isNaN(H)) return '—'
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${H >= 12 ? 'PM' : 'AM'}`
}
function stamp12(s) { return s ? `${s.slice(5, 10)} · ${time12(s)}` : '' }
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW = ['L','M','X','J','V','S','D']
const pad = n => String(n).padStart(2, '0')

const SESSION_KEY = 'bignetik_session'

export default function App() {
  const [api, setApi] = useState(DEFAULT_API)
  const [token, setToken] = useState(null)
  const [emp, setEmp] = useState(null)
  const [screen, setScreen] = useState('loading') // loading | login | lock | change | home

  useEffect(() => {
    SecureStore.getItemAsync(SESSION_KEY).then(v => setScreen(v ? 'lock' : 'login')).catch(() => setScreen('login'))
  }, [])

  async function req(method, path, body, tk = token) {
    const res = await tfetch(`${api}/portal${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(tk ? { Authorization: `Bearer ${tk}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error')
    return data
  }

  async function onLogin(data, remember, code, password) {
    setToken(data.token); setEmp(data.employee)
    if (remember) { try { await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ token: data.token, code, password })) } catch {} }
    setScreen(data.employee.must_change_password ? 'change' : 'home')
  }

  async function logout() {
    try { await SecureStore.deleteItemAsync(SESSION_KEY) } catch {}
    setToken(null); setEmp(null); setScreen('login')
  }

  // Restaura la sesión guardada (tras verificación biométrica). Devuelve true si entró.
  async function restore() {
    let sess = null
    try { sess = JSON.parse(await SecureStore.getItemAsync(SESSION_KEY)) } catch {}
    if (!sess) { setScreen('login'); return false }
    try {
      const d = await req('GET', '/me', null, sess.token)
      setToken(sess.token); setEmp(d.employee); setScreen(d.employee.must_change_password ? 'change' : 'home'); return true
    } catch {
      // token vencido → re-login automático con las credenciales guardadas
      if (sess.code && sess.password) {
        try {
          const res = await tfetch(`${api}/portal/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_code: sess.code, password: sess.password }) })
          const data = await res.json()
          if (res.ok) { await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ token: data.token, code: sess.code, password: sess.password })); setToken(data.token); setEmp(data.employee); setScreen(data.employee.must_change_password ? 'change' : 'home'); return true }
        } catch {}
      }
      return false
    }
  }

  return (
    <SafeAreaProvider>
      <View style={s.safe}>
        <StatusBar style="light" />
        {screen === 'loading' && <ImageBackground source={LOGIN_BG} style={{ flex: 1 }} resizeMode="cover"><View style={[s.center, s.overlay]}><ActivityIndicator color="#fff" size="large" /></View></ImageBackground>}
        {screen === 'login' && <Login api={api} setApi={setApi} onLogin={onLogin} />}
        {screen === 'lock' && <Lock restore={restore} toLogin={logout} />}
        {screen === 'change' && <ChangePassword req={req} onDone={logout} />}
        {screen === 'home' && <Home req={req} emp={emp} setEmp={setEmp} onLogout={logout} />}
      </View>
    </SafeAreaProvider>
  )
}

/* ---------- SPLASH (portada ISP) ---------- */
function Splash() {
  return (
    <LinearGradient colors={['#064e3b', '#047857', '#022c22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.splashWrap}>
      <View style={s.splashIcon}>
        <Ionicons name="globe-outline" size={150} color="rgba(255,255,255,0.12)" style={{ position: 'absolute' }} />
        <Ionicons name="wifi" size={78} color="#6ee7b7" />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 22 }}>
        {[10, 16, 24, 32].map((h, i) => <View key={i} style={{ width: 7, height: h, borderRadius: 3, backgroundColor: i < 3 ? '#6ee7b7' : 'rgba(255,255,255,0.25)' }} />)}
      </View>
      <Text style={s.splashTitle}>BigNetiK Telecom</Text>
      <Text style={s.splashSub}>Proveedor de Internet</Text>
      <View style={{ width: 44, height: 3, backgroundColor: 'rgba(110,231,183,0.5)', borderRadius: 2, marginVertical: 14 }} />
      <Text style={s.splashTag}>Gestión de tiempo y personal</Text>
      <ActivityIndicator color="rgba(255,255,255,0.75)" style={{ marginTop: 30 }} />
    </LinearGradient>
  )
}

/* ---------- BLOQUEO (Face ID / huella / código) ---------- */
function Lock({ restore, toLogin }) {
  const [err, setErr] = useState(''), [busy, setBusy] = useState(true)
  async function unlock() {
    setErr(''); setBusy(true)
    try {
      const has = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      if (has && enrolled) {
        // 1º intentar SOLO biometría (Face ID / huella).
        let r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloquea con Face ID', cancelLabel: 'Cancelar', disableDeviceFallback: true })
        // Si la biometría no está disponible/permitida (no fue el usuario quien canceló), usar el código como respaldo.
        if (!r.success && r.error && !['user_cancel', 'system_cancel', 'app_cancel'].includes(r.error)) {
          r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verifica tu identidad', disableDeviceFallback: false })
        }
        if (!r.success) { setErr('No se pudo verificar. Intenta de nuevo.'); setBusy(false); return }
      }
      const ok = await restore()
      if (!ok) setErr('Sesión expirada. Inicia sesión de nuevo.')
    } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  useEffect(() => { unlock() }, [])
  return (
    <ImageBackground source={LOGIN_BG} style={{ flex: 1 }} resizeMode="cover">
    <View style={[s.center, s.overlay]}>
      <View style={s.logo}><Ionicons name="finger-print" size={38} color="#047857" /></View>
      <Text style={s.brand}>Desbloquea tu portal</Text>
      <Text style={s.brandSub}>Verifica con Face ID, huella o tu código</Text>
      {err ? <Text style={[s.err, { maxWidth: 340 }]}>{err}</Text> : null}
      <TouchableOpacity style={[s.btn, { width: 260 }]} onPress={unlock} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Desbloquear</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={toLogin}><Text style={[s.cfgToggle, { color: '#a7f3d0', marginTop: 16 }]}>Usar otra cuenta</Text></TouchableOpacity>
    </View>
    </ImageBackground>
  )
}

/* ---------- LOGIN ---------- */
function Login({ api, setApi, onLogin }) {
  const [code, setCode] = useState(''), [pass, setPass] = useState('')
  const [err, setErr] = useState(''), [loading, setLoading] = useState(false), [cfg, setCfg] = useState(false)
  const [remember, setRemember] = useState(true)

  async function submit() {
    setErr(''); setLoading(true)
    try {
      const res = await tfetch(`${api}/portal/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ employee_code: code, password: pass }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      onLogin(data, remember, code, pass)
    } catch (e) { setErr((e.name === 'AbortError' || /Network/i.test(e.message)) ? 'No conecta al servidor. Revisa internet o el servidor abajo.' : e.message) }
    finally { setLoading(false) }
  }
  return (
    <ImageBackground source={LOGIN_BG} style={{ flex: 1 }} resizeMode="cover">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.center, s.overlay]}>
      <View style={s.logo}><Text style={s.logoText}>B</Text></View>
      <Text style={s.brand}>Portal del Empleado</Text>
      <Text style={s.brandSub}>BigNetiK Telecom</Text>
      <View style={s.card}>
        <Text style={s.cardTitle}>Iniciar Sesión</Text>
        {err ? <Text style={err[0] === '✓' ? s.ok : s.err}>{err}</Text> : null}
        <Text style={s.label}>ID de empleado</Text>
        <TextInput style={s.input} value={code} onChangeText={setCode} placeholder="Ej. 1024" placeholderTextColor="#94a3b8" keyboardType="number-pad" />
        <Text style={s.label}>Contraseña</Text>
        <TextInput style={s.input} value={pass} onChangeText={setPass} placeholder="••••••" placeholderTextColor="#94a3b8" secureTextEntry />
        <TouchableOpacity style={s.remember} onPress={() => setRemember(!remember)}>
          <View style={[s.check, remember && s.checkOn]}>{remember && <Ionicons name="checkmark" size={14} color="#fff" />}</View>
          <View style={{ flex: 1 }}>
            <Text style={s.rememberText}>Mantener sesión con Face ID / huella</Text>
            <Text style={s.rememberSub}>Entra rápido sin teclear tu contraseña cada vez</Text>
          </View>
          <Ionicons name="finger-print" size={20} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}</TouchableOpacity>
        <TouchableOpacity onPress={() => setCfg(!cfg)}><Text style={s.cfgToggle}>{cfg ? 'Ocultar' : 'Configurar'} servidor</Text></TouchableOpacity>
        {cfg && <>
          <TextInput style={[s.input, { marginTop: 8, fontSize: 12 }]} value={api} onChangeText={setApi} autoCapitalize="none" />
          <TouchableOpacity onPress={async () => { setErr(''); try { const r = await tfetch(`${api}/kiosk/whoami`); const d = await r.json(); setErr(`✓ Conectado (IP ${d.ip})`) } catch (e) { setErr('✗ No conecta: ' + (e.name === 'AbortError' ? 'tiempo agotado' : e.message)) } }}>
            <Text style={[s.cfgToggle, { color: '#059669', marginTop: 8 }]}>Probar conexión</Text></TouchableOpacity>
        </>}
      </View>
    </KeyboardAvoidingView>
    </ImageBackground>
  )
}

function ChangePassword({ req, onDone }) {
  const [cur, setCur] = useState(''), [np, setNp] = useState(''), [err, setErr] = useState(''), [msg, setMsg] = useState('')
  async function submit() {
    setErr('')
    if (np.length < 6) return setErr('Mínimo 6 caracteres')
    try { await req('POST', '/change-password', { currentPassword: cur, newPassword: np }); setMsg('Contraseña cambiada. Inicia sesión de nuevo.'); setTimeout(onDone, 1500) } catch (e) { setErr(e.message) }
  }
  return (
    <View style={s.center}>
      <Text style={s.brand}>Crea tu contraseña</Text>
      <Text style={s.brandSub}>Cambia la temporal antes de continuar</Text>
      <View style={s.card}>
        {err ? <Text style={s.err}>{err}</Text> : null}{msg ? <Text style={s.ok}>{msg}</Text> : null}
        <Text style={s.label}>Contraseña temporal</Text><TextInput style={s.input} value={cur} onChangeText={setCur} secureTextEntry />
        <Text style={s.label}>Nueva contraseña</Text><TextInput style={s.input} value={np} onChangeText={setNp} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={submit}><Text style={s.btnText}>Guardar</Text></TouchableOpacity>
      </View>
    </View>
  )
}

/* ---------- HOME SHELL ---------- */
const TABS = [
  { key: 'inicio', label: 'Inicio', icon: 'home' },
  { key: 'horas', label: 'Horas', icon: 'time' },
  { key: 'vacaciones', label: 'Vacaciones', icon: 'sunny' },
  { key: 'soporte', label: 'Soporte', icon: 'chatbubbles' },
  { key: 'perfil', label: 'Perfil', icon: 'person' },
]
function Home({ req, emp, setEmp, onLogout }) {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('inicio')
  const [bell, setBell] = useState(false)
  const [unread, setUnread] = useState(0)
  const name = `${emp.first_name} ${emp.last_name || ''}`.trim()

  function loadUnread() { req('GET', '/notifications/unread-count').then(d => setUnread(d.count || 0)).catch(() => {}) }
  useEffect(() => { loadUnread(); const i = setInterval(loadUnread, 30000); return () => clearInterval(i) }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        {emp.photo ? <Image source={{ uri: emp.photo }} style={s.avatarImg} /> : <View style={s.avatar}><Text style={s.avatarText}>{(emp.first_name || '?')[0]}</Text></View>}
        <View style={{ flex: 1 }}>
          <Text style={s.hName} numberOfLines={1}>{name}</Text>
          <Text style={s.hRole}>{emp.position || 'Empleado'} · ID {emp.employee_code}</Text>
        </View>
        <TouchableOpacity onPress={() => { setBell(true) }} style={s.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
          {unread > 0 && <View style={s.badge}><Text style={s.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={s.exit}><Ionicons name="log-out-outline" size={20} color="#fff" /></TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'inicio' && <Inicio req={req} emp={emp} />}
        {tab === 'horas' && <Horas req={req} />}
        {tab === 'vacaciones' && <Vacaciones req={req} />}
        {tab === 'soporte' && <Soporte req={req} />}
        {tab === 'perfil' && <Perfil req={req} emp={emp} setEmp={setEmp} onLogout={onLogout} />}
      </View>

      <View style={[s.tabBar, { paddingBottom: insets.bottom + 8 }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => setTab(t.key)}>
            <Ionicons name={tab === t.key ? t.icon : `${t.icon}-outline`} size={26} color={tab === t.key ? '#059669' : '#94a3b8'} />
            <Text style={[s.tabLabel, tab === t.key && { color: '#059669' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={bell} animationType="slide" transparent onRequestClose={() => setBell(false)}>
        <Notifications req={req} onClose={() => { setBell(false); loadUnread() }} />
      </Modal>
    </View>
  )
}

/* ---------- INICIO ---------- */
function Inicio({ req, emp }) {
  const [sum, setSum] = useState(null), [ref, setRef] = useState(false)
  function load() { req('GET', '/summary').then(setSum).catch(() => {}) }
  useEffect(() => { load() }, [])
  const money = v => `${v} ${emp.currency}`
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }} refreshControl={<RefreshControl refreshing={ref} onRefresh={() => { setRef(true); load(); setTimeout(() => setRef(false), 600) }} />}>
      {sum?.open && <View style={s.working}><Text style={s.workingText}>● Estás fichado ahora mismo</Text></View>}
      <View style={s.row}><Stat label="Horas este mes" value={sum ? String(sum.total_hours) : '—'} /><Stat label="Horas extra" value={sum ? String(sum.extra_hours) : '—'} /></View>
      <View style={s.row}><Stat label="Días trabajados" value={sum ? String(sum.days_worked) : '—'} /><Stat label="Pago estimado" value={sum ? (sum.pay_type === 'hourly' ? money(sum.pay) : money(sum.pay) + '/mes') : '—'} accent /></View>
      <View style={s.info}>
        <InfoRow label="Puesto" value={emp.position || '—'} />
        <InfoRow label="Departamento" value={emp.department || '—'} />
        <InfoRow label="Salario" value={`${emp.pay_rate} ${emp.currency} / ${emp.pay_type === 'hourly' ? 'hora' : 'mes'}`} />
        <InfoRow label="ID de empleado" value={String(emp.employee_code)} last />
      </View>
      <Text style={s.foot}>Las horas y el pago son solo de lectura. Si ves un error, escribe a Recursos Humanos.</Text>
    </ScrollView>
  )
}

/* ---------- HORAS (calendario + correcciones) ---------- */
function Horas({ req }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear()), [month, setMonth] = useState(now.getMonth())
  const [byDay, setByDay] = useState({}), [sel, setSel] = useState(null)
  const [changes, setChanges] = useState([])
  const [form, setForm] = useState(null), [err, setErr] = useState('')

  function loadMonth() {
    const from = `${year}-${pad(month + 1)}-01`, to = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`
    req('GET', `/time?from=${from}&to=${to}`).then(rows => { const m = {}; rows.forEach(r => { const d = (r.check_in || '').slice(0, 10); (m[d] = m[d] || []).push(r) }); setByDay(m); setSel(null) }).catch(() => setByDay({}))
  }
  function loadChanges() { req('GET', '/time-changes').then(setChanges).catch(() => {}) }
  useEffect(() => { loadMonth() }, [year, month])
  useEffect(() => { loadChanges() }, [])

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  function prev() { month === 0 ? (setMonth(11), setYear(year - 1)) : setMonth(month - 1) }
  function next() { month === 11 ? (setMonth(0), setYear(year + 1)) : setMonth(month + 1) }
  function openForm() { const f = (byDay[sel] || [])[0]; setErr(''); setForm({ date: sel, entry_id: f?.id || null, check_in: f ? f.check_in.slice(11, 16) : '', check_out: f?.check_out ? f.check_out.slice(11, 16) : '', reason_type: 'Olvido', reason: '' }) }
  async function submit() {
    setErr(''); const p = { entry_id: form.entry_id, date: form.date, reason_type: form.reason_type, reason: form.reason }
    if (form.check_in) p.check_in = form.check_in; if (form.check_out) p.check_out = form.check_out
    try { await req('POST', '/time-changes', p); setForm(null); loadChanges() } catch (e) { setErr(e.message) }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={s.calCard}>
        <View style={s.calHead}><TouchableOpacity onPress={prev}><Ionicons name="chevron-back" size={22} color="#64748b" /></TouchableOpacity><Text style={s.calTitle}>{MONTHS[month]} {year}</Text><TouchableOpacity onPress={next}><Ionicons name="chevron-forward" size={22} color="#64748b" /></TouchableOpacity></View>
        <View style={s.grid}>{DOW.map(d => <View key={d} style={s.cell}><Text style={s.dow}>{d}</Text></View>)}
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={s.cell} />
            const key = `${year}-${pad(month + 1)}-${pad(d)}`, list = byDay[key] || [], total = list.reduce((a, r) => a + (r.hours || 0), 0)
            const worked = total > 0, isSel = sel === key
            return <TouchableOpacity key={i} style={[s.cell, s.day, isSel && s.daySel, !isSel && worked && s.dayWorked]} onPress={() => setSel(isSel ? null : key)}>
              <Text style={[s.dayNum, isSel && { color: '#fff' }, !isSel && worked && { color: '#047857' }]}>{d}</Text>
              {worked && <Text style={[s.dayHrs, isSel && { color: '#d1fae5' }]}>{total.toFixed(1)}h</Text>}
            </TouchableOpacity>
          })}
        </View>
      </View>

      {sel && <View style={s.panel}>
        <Text style={s.panelTitle}>{sel}</Text>
        {(byDay[sel] || []).length === 0 && <Text style={s.muted}>Sin fichaje este día.</Text>}
        {(byDay[sel] || []).map(r => <View key={r.id} style={s.entry}><Text style={s.entryText}>Entrada {time12(r.check_in)} → Salida {r.check_out ? time12(r.check_out) : 'en curso'}</Text><Text style={s.entryH}>{r.hours != null ? `${r.hours} h` : '—'}</Text></View>)}
        {!form && <TouchableOpacity style={s.softBtn} onPress={openForm}><Ionicons name="create-outline" size={16} color="#334155" /><Text style={s.softBtnText}>Solicitar corrección</Text></TouchableOpacity>}
        {form && <View style={s.reqForm}>
          {err ? <Text style={s.err}>{err}</Text> : null}
          <View style={s.row}>
            <View style={{ flex: 1 }}><Text style={s.label}>Entrada</Text><TextInput style={s.input} value={form.check_in} onChangeText={t => setForm({ ...form, check_in: t })} placeholder="08:00" placeholderTextColor="#94a3b8" /></View>
            <View style={{ flex: 1 }}><Text style={s.label}>Salida</Text><TextInput style={s.input} value={form.check_out} onChangeText={t => setForm({ ...form, check_out: t })} placeholder="17:00" placeholderTextColor="#94a3b8" /></View>
          </View>
          <Text style={s.label}>Motivo</Text>
          <View style={s.chips}>{['Olvido', 'Evento', 'Otro'].map(rt => <TouchableOpacity key={rt} style={[s.chip, form.reason_type === rt && s.chipOn]} onPress={() => setForm({ ...form, reason_type: rt })}><Text style={[s.chipText, form.reason_type === rt && { color: '#fff' }]}>{rt === 'Olvido' ? 'Se me olvidó' : rt}</Text></TouchableOpacity>)}</View>
          <Text style={s.label}>Nota (opcional)</Text><TextInput style={s.input} value={form.reason} onChangeText={t => setForm({ ...form, reason: t })} placeholder="Ej. llegué 8:00" placeholderTextColor="#94a3b8" />
          <View style={[s.row, { marginTop: 10 }]}><TouchableOpacity style={[s.btn, { flex: 1, marginTop: 0 }]} onPress={submit}><Text style={s.btnText}>Enviar a RRHH</Text></TouchableOpacity><TouchableOpacity style={s.btnGhost} onPress={() => setForm(null)}><Text style={s.btnGhostText}>Cancelar</Text></TouchableOpacity></View>
        </View>}
      </View>}

      {changes.length > 0 && <View style={{ marginTop: 14 }}>
        <Text style={s.sectionTitle}>Mis correcciones</Text>
        {changes.map(c => <View key={c.id} style={s.reqRow}><View style={{ flex: 1 }}><Text style={s.reqRowT}>{c.date} · {c.requested_check_in ? `entrada ${time12(c.requested_check_in)}` : ''}{c.requested_check_out ? ` salida ${time12(c.requested_check_out)}` : ''}</Text>{c.reason_type ? <Text style={s.muted}>{c.reason_type}</Text> : null}</View><StatusPill status={c.status} /></View>)}
      </View>}
    </ScrollView>
  )
}

/* ---------- VACACIONES ---------- */
function Vacaciones({ req }) {
  const [data, setData] = useState(null), [form, setForm] = useState(null), [err, setErr] = useState('')
  function load() { req('GET', '/leaves').then(setData).catch(() => {}) }
  useEffect(() => { load() }, [])
  async function submit() {
    setErr(''); try { await req('POST', '/leaves', form); setForm(null); load() } catch (e) { setErr(e.message) }
  }
  async function cancel(id) { try { await req('DELETE', `/leaves/${id}`); load() } catch (e) {} }
  const b = data?.balance
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={s.row}><Stat label="Días / año" value={b ? String(b.allowance) : '—'} /><Stat label="Usados" value={b ? String(b.used) : '—'} /><Stat label="Disponibles" value={b ? String(b.remaining) : '—'} accent /></View>
      {!form && <TouchableOpacity style={[s.btn]} onPress={() => { setErr(''); setForm({ type: 'vacaciones', start_date: '', end_date: '', reason: '' }) }}><Text style={s.btnText}>Solicitar ausencia</Text></TouchableOpacity>}
      {form && <View style={s.panel}>
        {err ? <Text style={s.err}>{err}</Text> : null}
        <Text style={s.label}>Tipo</Text>
        <View style={s.chips}>{[['vacaciones', 'Vacaciones'], ['enfermedad', 'Enfermedad'], ['personal', 'Personal']].map(([v, l]) => <TouchableOpacity key={v} style={[s.chip, form.type === v && s.chipOn]} onPress={() => setForm({ ...form, type: v })}><Text style={[s.chipText, form.type === v && { color: '#fff' }]}>{l}</Text></TouchableOpacity>)}</View>
        <Text style={s.label}>Desde (AAAA-MM-DD)</Text><TextInput style={s.input} value={form.start_date} onChangeText={t => setForm({ ...form, start_date: t })} placeholder="2026-08-20" placeholderTextColor="#94a3b8" />
        <Text style={s.label}>Hasta (AAAA-MM-DD)</Text><TextInput style={s.input} value={form.end_date} onChangeText={t => setForm({ ...form, end_date: t })} placeholder="2026-08-22" placeholderTextColor="#94a3b8" />
        <Text style={s.label}>Motivo (opcional)</Text><TextInput style={s.input} value={form.reason} onChangeText={t => setForm({ ...form, reason: t })} />
        <View style={[s.row, { marginTop: 10 }]}><TouchableOpacity style={[s.btn, { flex: 1, marginTop: 0 }]} onPress={submit}><Text style={s.btnText}>Enviar</Text></TouchableOpacity><TouchableOpacity style={s.btnGhost} onPress={() => setForm(null)}><Text style={s.btnGhostText}>Cancelar</Text></TouchableOpacity></View>
      </View>}
      <Text style={[s.sectionTitle, { marginTop: 14 }]}>Mis solicitudes</Text>
      {data?.requests?.length === 0 && <Text style={s.muted}>Aún no tienes solicitudes.</Text>}
      {data?.requests?.map(r => <View key={r.id} style={s.reqRow}><View style={{ flex: 1 }}><Text style={s.reqRowT}>{cap(r.type)} · {r.days} día{r.days === 1 ? '' : 's'}</Text><Text style={s.muted}>{r.start_date} → {r.end_date}</Text>{r.admin_note ? <Text style={s.muted}>RRHH: {r.admin_note}</Text> : null}</View><View style={{ alignItems: 'flex-end' }}><StatusPill status={r.status} />{r.status === 'pendiente' && <TouchableOpacity onPress={() => cancel(r.id)}><Text style={[s.muted, { color: '#dc2626', marginTop: 4 }]}>Cancelar</Text></TouchableOpacity>}</View></View>)}
    </ScrollView>
  )
}

/* ---------- SOPORTE (tickets) ---------- */
function Soporte({ req }) {
  const [tickets, setTickets] = useState([]), [open, setOpen] = useState(null)
  const [form, setForm] = useState(null), [reply, setReply] = useState(''), [err, setErr] = useState('')
  function load() { req('GET', '/tickets').then(setTickets).catch(() => {}) }
  useEffect(() => { load() }, [])
  function openTicket(id) { req('GET', `/tickets/${id}`).then(setOpen).catch(() => {}) }
  async function create() { setErr(''); try { await req('POST', '/tickets', form); setForm(null); load() } catch (e) { setErr(e.message) } }
  async function send() { if (!reply.trim()) return; try { await req('POST', `/tickets/${open.id}/reply`, { message: reply }); setReply(''); openTicket(open.id); load() } catch (e) {} }
  async function del(id) { try { await req('DELETE', `/tickets/${id}`); setOpen(null); load() } catch (e) { alert(e.message) } }

  if (open) return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <TouchableOpacity onPress={() => { setOpen(null); load() }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}><Ionicons name="chevron-back" size={18} color="#64748b" /><Text style={s.muted}>Volver</Text></TouchableOpacity>
      <View style={s.panel}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={s.panelTitle}>{open.subject}</Text><StatusPill status={open.status} /></View>
        {open.status === 'cerrado' && <TouchableOpacity style={[s.softBtn, { marginTop: 10 }]} onPress={() => del(open.id)}><Ionicons name="trash-outline" size={16} color="#dc2626" /><Text style={[s.softBtnText, { color: '#dc2626' }]}>Eliminar ticket</Text></TouchableOpacity>}
      </View>
      {open.messages.map(m => <View key={m.id} style={[s.msg, m.author_type === 'admin' ? s.msgAdmin : s.msgMe]}><Text style={[s.msgMeta, m.author_type === 'admin' ? { color: '#64748b' } : { color: '#d1fae5' }]}>{m.author_type === 'admin' ? `RRHH · ${m.author_name}` : 'Tú'} · {stamp12(m.created_at)}</Text><Text style={[s.msgText, m.author_type !== 'admin' && { color: '#fff' }]}>{m.message}</Text></View>)}
      {open.status === 'abierto' && <View style={[s.row, { marginTop: 10 }]}><TextInput style={[s.input, { flex: 1 }]} value={reply} onChangeText={setReply} placeholder="Responder…" placeholderTextColor="#94a3b8" /><TouchableOpacity style={s.sendBtn} onPress={send}><Ionicons name="send" size={18} color="#fff" /></TouchableOpacity></View>}
    </ScrollView>
  )

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      {!form && <TouchableOpacity style={s.btn} onPress={() => { setErr(''); setForm({ subject: '', message: '' }) }}><Text style={s.btnText}>Nuevo ticket a RRHH</Text></TouchableOpacity>}
      {form && <View style={s.panel}>
        {err ? <Text style={s.err}>{err}</Text> : null}
        <Text style={s.label}>Asunto</Text><TextInput style={s.input} value={form.subject} onChangeText={t => setForm({ ...form, subject: t })} />
        <Text style={s.label}>Mensaje</Text><TextInput style={[s.input, { height: 80 }]} multiline value={form.message} onChangeText={t => setForm({ ...form, message: t })} />
        <View style={[s.row, { marginTop: 10 }]}><TouchableOpacity style={[s.btn, { flex: 1, marginTop: 0 }]} onPress={create}><Text style={s.btnText}>Enviar</Text></TouchableOpacity><TouchableOpacity style={s.btnGhost} onPress={() => setForm(null)}><Text style={s.btnGhostText}>Cancelar</Text></TouchableOpacity></View>
      </View>}
      <Text style={[s.sectionTitle, { marginTop: 14 }]}>Mis tickets</Text>
      {tickets.length === 0 && <Text style={s.muted}>No tienes tickets.</Text>}
      {tickets.map(t => <TouchableOpacity key={t.id} style={s.reqRow} onPress={() => openTicket(t.id)}><View style={{ flex: 1 }}><Text style={s.reqRowT}>{t.subject}</Text>{t.last_message ? <Text style={s.muted} numberOfLines={1}>{t.last_message}</Text> : null}</View><StatusPill status={t.status} /></TouchableOpacity>)}
    </ScrollView>
  )
}

/* ---------- PERFIL ---------- */
function Perfil({ req, emp, setEmp, onLogout }) {
  const [form, setForm] = useState({ phone: emp.phone || '', email: emp.email || '', address: emp.address || '' })
  const [msg, setMsg] = useState(''), [err, setErr] = useState('')
  const [pw, setPw] = useState({ cur: '', np: '' }), [pwMsg, setPwMsg] = useState('')

  async function pickPhoto() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true })
      if (res.canceled) return
      const uri = `data:image/jpeg;base64,${res.assets[0].base64}`
      const d = await req('PUT', '/photo', { photo: uri }); setEmp({ ...emp, photo: d.photo }); setMsg('Foto actualizada')
    } catch (e) { setErr(e.message) }
  }
  async function saveProfile() { setErr(''); setMsg(''); try { const d = await req('PUT', '/profile', form); setEmp(d.employee); setMsg('Datos actualizados') } catch (e) { setErr(e.message) } }
  async function changePw() { setPwMsg(''); if (pw.np.length < 6) return setPwMsg('Mínimo 6 caracteres'); try { await req('POST', '/change-password', { currentPassword: pw.cur, newPassword: pw.np }); setPwMsg('Contraseña cambiada. Reinicia sesión.'); setTimeout(onLogout, 1400) } catch (e) { setPwMsg(e.message) } }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
      <View style={[s.panel, { alignItems: 'center' }]}>
        {emp.photo ? <Image source={{ uri: emp.photo }} style={s.bigAvatar} /> : <View style={[s.bigAvatar, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 30, color: '#64748b' }}>{(emp.first_name || '?')[0]}</Text></View>}
        <TouchableOpacity style={[s.softBtn, { marginTop: 10 }]} onPress={pickPhoto}><Ionicons name="camera-outline" size={16} color="#334155" /><Text style={s.softBtnText}>Cambiar foto</Text></TouchableOpacity>
      </View>

      <View style={s.panel}>
        <Text style={s.sectionTitle}>Mis datos de contacto</Text>
        {err ? <Text style={s.err}>{err}</Text> : null}{msg ? <Text style={s.ok}>{msg}</Text> : null}
        <Text style={s.label}>Teléfono</Text><TextInput style={s.input} value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} />
        <Text style={s.label}>Email</Text><TextInput style={s.input} value={form.email} onChangeText={t => setForm({ ...form, email: t })} autoCapitalize="none" keyboardType="email-address" />
        <Text style={s.label}>Dirección</Text><TextInput style={s.input} value={form.address} onChangeText={t => setForm({ ...form, address: t })} />
        <TouchableOpacity style={s.btn} onPress={saveProfile}><Text style={s.btnText}>Guardar</Text></TouchableOpacity>
        <Text style={[s.muted, { marginTop: 8 }]}>Tu nombre, salario y datos biométricos solo los cambia RRHH.</Text>
      </View>

      <View style={s.panel}>
        <Text style={s.sectionTitle}>Cambiar contraseña</Text>
        {pwMsg ? <Text style={pwMsg.includes('cambiada') ? s.ok : s.err}>{pwMsg}</Text> : null}
        <Text style={s.label}>Actual</Text><TextInput style={s.input} value={pw.cur} onChangeText={t => setPw({ ...pw, cur: t })} secureTextEntry />
        <Text style={s.label}>Nueva</Text><TextInput style={s.input} value={pw.np} onChangeText={t => setPw({ ...pw, np: t })} secureTextEntry />
        <TouchableOpacity style={[s.btn, { backgroundColor: '#334155' }]} onPress={changePw}><Text style={s.btnText}>Cambiar contraseña</Text></TouchableOpacity>
      </View>
    </ScrollView>
  )
}

/* ---------- NOTIFICACIONES ---------- */
function Notifications({ req, onClose }) {
  const [list, setList] = useState([])
  useEffect(() => { req('GET', '/notifications').then(setList).catch(() => {}) }, [])
  async function markAll() { try { await req('POST', '/notifications/read'); setList(l => l.map(n => ({ ...n, read: 1 }))) } catch (e) {} }
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHead}><Text style={s.sheetTitle}>Notificaciones</Text><View style={{ flexDirection: 'row', gap: 14 }}>{list.some(n => !n.read) && <TouchableOpacity onPress={markAll}><Text style={{ color: '#059669' }}>Marcar leídas</Text></TouchableOpacity>}<TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#64748b" /></TouchableOpacity></View></View>
        <ScrollView style={{ maxHeight: 420 }}>
          {list.length === 0 && <Text style={[s.muted, { textAlign: 'center', padding: 24 }]}>Sin notificaciones</Text>}
          {list.map(n => <View key={n.id} style={[s.notif, !n.read && { backgroundColor: '#eff6ff' }]}><Text style={s.notifTitle}>{n.title}</Text>{n.body ? <Text style={s.muted}>{n.body}</Text> : null}<Text style={[s.muted, { fontSize: 11 }]}>{stamp12(n.created_at)}</Text></View>)}
        </ScrollView>
      </View>
    </View>
  )
}

/* ---------- pequeños ---------- */
function Stat({ label, value, accent }) { return <View style={[s.stat, accent && s.statAccent]}><Text style={[s.statValue, accent && { color: '#fff' }]}>{value}</Text><Text style={[s.statLabel, accent && { color: '#d1fae5' }]}>{label}</Text></View> }
function InfoRow({ label, value, last }) { return <View style={[s.infoRow, !last && s.infoBorder]}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View> }
function StatusPill({ status }) { const c = { pendiente: ['#fef3c7', '#b45309'], aprobada: ['#d1fae5', '#047857'], rechazada: ['#fee2e2', '#dc2626'], abierto: ['#d1fae5', '#047857'], cerrado: ['#e2e8f0', '#475569'] }[status] || ['#e2e8f0', '#475569']; return <View style={{ backgroundColor: c[0], paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}><Text style={{ color: c[1], fontSize: 11, fontWeight: '600' }}>{status}</Text></View> }
function cap(t) { return t ? t[0].toUpperCase() + t.slice(1) : t }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#065f46' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 26, backgroundColor: '#065f46' },
  overlay: { backgroundColor: 'rgba(2,32,24,0.28)' },
  logo: { width: 74, height: 74, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  logoText: { fontSize: 34, fontWeight: '800', color: '#047857' },
  brand: { fontSize: 30, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  brandSub: { fontSize: 15, color: '#d1fae5', marginBottom: 26, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  card: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 22, padding: 26 },
  cardTitle: { fontSize: 21, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17, color: '#0f172a', backgroundColor: '#fff' },
  btn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  splashWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  splashIcon: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 22 },
  splashSub: { fontSize: 15, color: '#6ee7b7', fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  splashTag: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  btnGhost: { backgroundColor: '#e2e8f0', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { color: '#475569', fontWeight: '600' },
  err: { color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 10, fontSize: 13, marginBottom: 6 },
  ok: { color: '#047857', backgroundColor: '#ecfdf5', padding: 10, borderRadius: 10, fontSize: 13, marginBottom: 6 },
  cfgToggle: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 12 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#059669', borderColor: '#059669' },
  rememberText: { color: '#166534', fontWeight: '600', fontSize: 13 }, rememberSub: { color: '#16a34a', fontSize: 11 },

  header: { backgroundColor: '#047857', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { color: '#fff', fontSize: 21, fontWeight: '700' },
  hName: { color: '#fff', fontSize: 18, fontWeight: '700' }, hRole: { color: '#a7f3d0', fontSize: 13 },
  bellBtn: { padding: 6 }, badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  exit: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 9, borderRadius: 10 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 10, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 }, tabLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  working: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 12 }, workingText: { color: '#047857', fontWeight: '600', fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statAccent: { backgroundColor: '#059669', borderColor: '#059669' },
  statValue: { fontSize: 25, fontWeight: '800', color: '#1e293b' }, statLabel: { fontSize: 12, color: '#64748b', marginTop: 3 },
  info: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 }, infoBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { color: '#64748b', fontSize: 15 }, infoValue: { color: '#1e293b', fontSize: 15, fontWeight: '600' },
  foot: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 10 },

  calCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, calTitle: { fontWeight: '700', color: '#1e293b', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dow: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  day: { borderRadius: 10 }, dayWorked: { backgroundColor: '#ecfdf5' }, daySel: { backgroundColor: '#059669' },
  dayNum: { fontSize: 14, color: '#475569' }, dayHrs: { fontSize: 9, color: '#059669' },

  panel: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginTop: 12 },
  panelTitle: { fontWeight: '700', color: '#1e293b', marginBottom: 8, fontSize: 16 },
  muted: { color: '#94a3b8', fontSize: 13 },
  entry: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 10, padding: 12, marginBottom: 6 }, entryText: { color: '#475569', fontSize: 14, flex: 1 }, entryH: { fontWeight: '700', color: '#1e293b', fontSize: 14 },
  softBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 13 }, softBtnText: { color: '#334155', fontWeight: '600', fontSize: 14 },
  reqForm: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }, chipOn: { backgroundColor: '#059669', borderColor: '#059669' }, chipText: { color: '#475569', fontSize: 13 },
  sectionTitle: { fontWeight: '700', color: '#334155', marginBottom: 8 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 8 }, reqRowT: { color: '#1e293b', fontWeight: '600', fontSize: 13 },
  msg: { maxWidth: '85%', borderRadius: 12, padding: 10, marginTop: 8 }, msgAdmin: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', alignSelf: 'flex-start' }, msgMe: { backgroundColor: '#059669', alignSelf: 'flex-end' },
  msgMeta: { fontSize: 10, marginBottom: 2 }, msgText: { fontSize: 14, color: '#1e293b' },
  sendBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  bigAvatar: { width: 88, height: 88, borderRadius: 44 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 30 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, sheetTitle: { fontWeight: '700', fontSize: 16, color: '#1e293b' },
  notif: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 8, borderRadius: 8 }, notifTitle: { fontWeight: '600', color: '#1e293b', fontSize: 14 },
})

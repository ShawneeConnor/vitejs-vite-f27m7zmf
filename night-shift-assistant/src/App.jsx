import { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { App as CapacitorApp } from '@capacitor/app'
import { AlertTriangle, Archive, ArrowLeft, ArrowRight, Bell, Camera, Check, CheckCircle2, ChevronRight, ClipboardList, Clock3, Download, FileText, ImagePlus, Plus, ShieldCheck, Thermometer, X } from 'lucide-react'

const KEY = 'cold-chain-assistant-v3'
const DRAFT_KEY = 'cold-chain-assistant-v3-draft'
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) } catch { return null } }
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { reports: [], reminders: [] } } catch { return { reports: [], reminders: [] } } }
const stamp = () => new Date().toISOString()
const fmt = value => new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
const FRESENIUS_LOGO = 'data:image/png;base64,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'
const AOM_LOGO = 'data:image/png;base64,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'

export default function App() {
  const [store, setStore] = useState(load)
  const [screen, setScreen] = useState('home')
  const [step, setStep] = useState('start')
  const [tech, setTech] = useState('')
  const [shiftStart, setShiftStart] = useState('20:00')
  const [shiftEnd, setShiftEnd] = useState('08:00')
  const [history, setHistory] = useState([])
  const [showInfo, setShowInfo] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [rtPreviewOpen, setRtPreviewOpen] = useState(false)
  const [rtPreviewUrl, setRtPreviewUrl] = useState('')
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [answers, setAnswers] = useState([])
  const [data, setData] = useState({ fridge: '', probe: '', disabled: 'no', disabledInventory: '', remindDisabled: 'si', notes: '' })
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')
  const [pendingClose, setPendingClose] = useState({ outcome: 'Intervento concluso', overrides: {} })
  const [responsiblePresent, setResponsiblePresent] = useState('no')
  const [responsibleName, setResponsibleName] = useState('')
  const [signatureData, setSignatureData] = useState('')
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [spylogBlocked, setSpylogBlocked] = useState(false)
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem('cold-chain-haptics') !== 'false')

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1750)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const deliberateExit = localStorage.getItem('cold-chain-exit-to-home') === 'true'
    if (deliberateExit) localStorage.removeItem('cold-chain-exit-to-home')
    const draft = deliberateExit ? null : loadDraft()
    if (draft) {
      setScreen(draft.screen || 'home')
      setStep(draft.step || 'start')
      setTech(draft.tech || '')
      setShiftStart(draft.shiftStart || '20:00')
      setShiftEnd(draft.shiftEnd || '08:00')
      setHistory(draft.history || [])
      setAnswers(draft.answers || [])
      setData(draft.data || { fridge: '', probe: '', disabled: 'no', disabledInventory: '', remindDisabled: 'si', notes: '' })
      setPhotos(draft.photos || [])
      setPendingClose(draft.pendingClose || { outcome: 'Intervento concluso', overrides: {} })
      setResponsiblePresent(draft.responsiblePresent || 'no')
      setResponsibleName(draft.responsibleName || '')
      setSignatureData(draft.signatureData || '')
    }
    setDraftLoaded(true)
  }, [])

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(store)) } catch (error) { console.error('Archivio locale pieno o non disponibile', error) } }, [store])
  useEffect(() => {
    if (!draftLoaded) return
    try {
      if (screen === 'checklist') localStorage.setItem(DRAFT_KEY, JSON.stringify({ screen, step, tech, shiftStart, shiftEnd, history, answers, data, photos, pendingClose, responsiblePresent, responsibleName, signatureData }))
      else localStorage.removeItem(DRAFT_KEY)
    } catch (error) { console.error('Salvataggio bozza non riuscito', error) }
  }, [draftLoaded, screen, step, tech, shiftStart, shiftEnd, history, answers, data, photos, pendingClose, responsiblePresent, responsibleName, signatureData])
  useEffect(() => { localStorage.setItem('cold-chain-haptics', String(hapticsEnabled)) }, [hapticsEnabled])

  useEffect(() => {
    let listener
    let mounted = true
    CapacitorApp.addListener('backButton', () => { if (mounted) setExitConfirmOpen(true) }).then(handle => { listener = handle }).catch(() => {})
    const onPopState = () => { setExitConfirmOpen(true); window.history.pushState({ coldChainGuard: true }, '') }
    window.history.pushState({ coldChainGuard: true }, '')
    window.addEventListener('popstate', onPopState)
    return () => { mounted = false; listener?.remove(); window.removeEventListener('popstate', onPopState) }
  }, [])

  useEffect(() => {
    if (!rtPreviewOpen || !selected) return
    const url = URL.createObjectURL(createPdfBlob(selected))
    setRtPreviewUrl(url)
    return () => { URL.revokeObjectURL(url); setRtPreviewUrl('') }
  }, [rtPreviewOpen, selected])

  const confirmAppExit = () => {
    localStorage.setItem('cold-chain-exit-to-home', 'true')
    localStorage.removeItem(DRAFT_KEY)
    setExitConfirmOpen(false)
    setScreen('home')
    setStep('start')
    setHistory([])
    setAnswers([])
    setPhotos([])
    setSignatureData('')
    setSelected(null)
    CapacitorApp.exitApp().catch(() => { /* In browser, remain on Home. */ })
  }
  const notify = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); if (hapticsEnabled && navigator.vibrate) navigator.vibrate([35, 25, 35]) }
  const buzz = () => { if (hapticsEnabled && navigator.vibrate) navigator.vibrate(12) }
  const addAnswer = (question, answer, note = '') => setAnswers(old => { const item = { question, answer, note, at: stamp() }; const i = old.findIndex(a => a.question === question); if (i < 0) return [...old, item]; const copy = [...old]; copy[i] = item; return copy })
  const go = next => { setHistory(old => [...old, step]); setStep(next) }
  const backStep = () => { if (history.length) { setStep(history[history.length - 1]); setHistory(old => old.slice(0, -1)) } }
  const start = () => { if (!tech.trim()) { notify('Inserisci nome e cognome del tecnico.'); return } if (!shiftStart || !shiftEnd) { notify('Inserisci inizio e fine turno.'); return } setAnswers([]); setHistory([]); setData({ fridge: '', probe: '', disabled: 'no', disabledInventory: '', remindDisabled: 'si', notes: '' }); setPhotos([]); setSignatureData(''); setStep('monitor'); setScreen('checklist'); setSpylogBlocked(false) }

  const beginCloseReport = (outcome, overrides = {}) => {
    setPendingClose({ outcome, overrides })
    setResponsiblePresent('no')
    setResponsibleName('')
    setSignatureData('')
    go('finalize')
  }

  const closeReport = (outcome, overrides = {}) => {
    const finalData = { ...data, ...overrides }

    const record = {
      id: uid(),
      createdAt: stamp(),
      technician: tech.trim() || 'Tecnico non indicato',
      shift: { start: shiftStart, end: shiftEnd },
      answers,
      outcome,
      responsible: { present: responsiblePresent === 'si', name: responsiblePresent === 'si' ? responsibleName.trim() : '', signatureData: responsiblePresent === 'si' ? signatureData : '' },
      fridgeInventory: finalData.fridge,
      probeInventory: finalData.probe,
      disabledAlarm: finalData.disabled === 'si'
        ? {
            inventory: finalData.disabledInventory.trim(),
            reminder: finalData.remindDisabled === 'si'
          }
        : null,
      notes: finalData.notes.trim(),
      photos: photos.map(p => ({ name: p.name, dataUrl: p.dataUrl }))
    }

    const report = makeReport(record)

    setStore(old => ({
      ...old,
      reports: [{ ...record, report }, ...old.reports],
      reminders:
        finalData.disabled === 'si' && finalData.remindDisabled === 'si'
          ? [
              ...old.reminders,
              {
                id: uid(),
                inventory: finalData.disabledInventory.trim(),
                createdAt: stamp(),
                reportId: record.id,
                resolved: false
              }
            ]
          : old.reminders
    }))

    setSelected({ ...record, report })
    setScreen('report')
    setStep('')
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  function makeReport(r) {
    const intro = r.fridgeInventory
      ? `A seguito della segnalazione relativa al frigorifero identificato con inventario ${r.fridgeInventory}, il tecnico reperibile ha effettuato le verifiche e le attività di seguito descritte.`
      : 'A seguito della segnalazione di anomalia della catena del freddo, il tecnico reperibile ha effettuato le verifiche da remoto tramite il sistema Spylog.'
    const checks = r.answers.map(a => `${a.question}: ${a.answer}${a.note ? ` (${a.note})` : ''}.`).join(' ')
    const conclusion = r.outcome === 'Intervento concluso'
      ? 'Le verifiche previste per l’intervento sono state completate. L’attività del tecnico reperibile si considera conclusa.'
      : `Esito dell’intervento: ${r.outcome}.`
    const lines = [
      'FRESENIUS  |  IRCCS AZIENDA OSPEDALIERA METROPOLITANA',
      'SERVIZIO DI REPERIBILITÀ – CATENA DEL FREDDO',
      'RAPPORTO TECNICO DI INTERVENTO',
      '',
      `Rapporto n.: ${r.id}`,
      `Data e ora: ${fmt(r.createdAt)}`,
      `Tecnico reperibile: ${r.technician}`,
      `Turno: ${r.shift?.start || '—'} – ${r.shift?.end || '—'}`,
      `Responsabile / referente: ${r.responsible?.present ? r.responsible.name : 'Non presente / non indicato'}`,
      '',
      '1. OGGETTO E CONTESTO',
      intro,
      '',
      '2. IDENTIFICAZIONE',
      `Frigorifero – inventario: ${r.fridgeInventory || 'Intervento da remoto – non rilevato sul posto'}`,
      `Sonda / Spylog – inventario: ${r.probeInventory || 'Non rilevato sul posto'}`,
      '',
      '3. ATTIVITÀ E VERIFICHE ESEGUITE',
      checks || 'Verifiche registrate nella checklist operativa.',
      '',
      '4. ESITO E AZIONI CONSEGUENTI',
      conclusion,
      r.disabledAlarm ? `È stata segnalata la disabilitazione dell’allarme della sonda INV ${r.disabledAlarm.inventory}. Promemoria di ripristino richiesto: ${r.disabledAlarm.reminder ? 'SÌ' : 'NO'}.` : 'Non risultano allarmi disabilitati dichiarati.',
      '',
      '5. COMUNICAZIONI E NOTE',
      r.notes || 'Non sono state inserite ulteriori annotazioni.',
      '',
      '6. DOCUMENTAZIONE',
      `Fotografie allegate: ${r.photos?.length || 0}`,
      '',
      'FIRME',
      `Tecnico reperibile: ${r.technician}`,
      `Responsabile / referente: ${r.responsible?.present ? r.responsible.name : 'Non presente / non indicato'}`,
      r.responsible?.present ? (r.responsible.signatureData ? '[Firma acquisita sul dispositivo e allegata al PDF]' : '[Firma non acquisita]') : '[Firma non prevista]',
      '',
      'Documento generato automaticamente sulla base delle informazioni inserite dal tecnico. Verificare la completezza dei dati prima della sua archiviazione.'
    ]
    return lines.join('\n')
  }

  const shareText = r => { const text = `Rapporto catena del freddo\n${fmt(r.createdAt)}\nTecnico: ${r.technician}\nTurno: ${r.shift?.start || '—'}–${r.shift?.end || '—'}\nEsito: ${r.outcome}\nFrigo INV: ${r.fridgeInventory || 'n/d'}\nSonda INV: ${r.probeInventory || 'n/d'}`; return text }
  const shareWhatsApp = r => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(r))}`, '_blank', 'noopener,noreferrer')
  const shareTelegram = r => window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(shareText(r))}`, '_blank', 'noopener,noreferrer')
  const sharePdf = async r => { try { const blob = createPdfBlob(r); const file = new File([blob], `rapporto-catena-freddo-${r.id}.pdf`, {type:'application/pdf'}); if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) await navigator.share({ title:'Rapporto tecnico catena del freddo', files:[file] }); else { printPdf(r); notify('PDF salvato: puoi allegarlo dall’applicazione scelta.'); } } catch (e) { if (e.name !== 'AbortError') notify('Condivisione PDF non disponibile.'); } }
  const shareTxt = async r => { try { const file = new File([r.report], `rapporto-catena-freddo-${r.id}.txt`, {type:'text/plain;charset=utf-8'}); if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) await navigator.share({ title:'Rapporto tecnico catena del freddo', files:[file] }); else { downloadText(r); notify('TXT scaricato: puoi allegarlo dall’applicazione scelta.'); } } catch (e) { if (e.name !== 'AbortError') notify('Condivisione TXT non disponibile.'); } }
  const downloadText = r => {
    const blob = new Blob([r.report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rapporto-catena-freddo-${r.id}.txt`; a.click(); URL.revokeObjectURL(url)
  }
  const createPdfBlob = r => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margin = 17
    doc.setFillColor(255,255,255); doc.rect(0, 0, 210, 48, 'F')
    doc.addImage(FRESENIUS_LOGO, 'PNG', margin, 7, 65, 10)
    doc.addImage(AOM_LOGO, 'PNG', 126, 5, 67, 21)
    doc.setTextColor(25,39,60); doc.setFont('helvetica','bold'); doc.setFontSize(8)
    doc.text('SERVIZIO DI REPERIBILITÀ – CATENA DEL FREDDO', margin, 33)
    doc.setFontSize(15); doc.text('RAPPORTO TECNICO DI INTERVENTO', margin, 41)
    doc.setDrawColor(35,105,190); doc.setLineWidth(0.7); doc.line(margin,46,193,46)
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(45,58,76)
    const lines = doc.splitTextToSize(r.report, 176)
    let y = 54
    lines.forEach(line => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.text(line, margin, y); y += 4.7
    })
    if (r.photos?.length) {
      if (y > 255) { doc.addPage(); y = 20 }
      y += 7
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('FOTOGRAFIE ALLEGATE', margin, y)
      y += 8
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      const photoW = 82
      const photoH = 58
      const gapX = 10
      r.photos.forEach((photo, index) => {
        try {
          const col = index % 2
          if (col === 0 && y + photoH + 10 > 280) { doc.addPage(); y = 20 }
          const x = margin + col * (photoW + gapX)
          const props = doc.getImageProperties(photo.dataUrl)
          const ratio = Math.min(photoW / props.width, photoH / props.height)
          const w = props.width * ratio
          const h = props.height * ratio
          doc.addImage(photo.dataUrl, undefined, x, y, w, h)
          doc.text(doc.splitTextToSize(photo.name || `Fotografia ${index + 1}`, photoW), x, y + h + 4)
          if (col === 1 || index === r.photos.length - 1) y += photoH + 13
        } catch (error) {
          doc.text(`Impossibile inserire la fotografia: ${photo.name || index + 1}`, margin, y)
          y += 7
        }
      })
    }
    if (r.responsible?.signatureData) {
      if (y > 245) { doc.addPage(); y = 25 }
      doc.setFont('helvetica','bold'); doc.text('Firma responsabile / referente', margin, y + 5)
      doc.addImage(r.responsible.signatureData, 'PNG', margin, y + 8, 65, 24)
    }
    return doc.output('blob')
  }
  const printPdf = r => {
    const blob = createPdfBlob(r); const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (!w) { const a = document.createElement('a'); a.href = url; a.download = `rapporto-catena-freddo-${r.id}.pdf`; a.click(); notify('PDF scaricato.'); }
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const addPhotos = async e => {
    const files = Array.from(e.target.files || [])
    const converted = await Promise.all(files.map(file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, dataUrl: reader.result }); reader.readAsDataURL(file) })))
    setPhotos(old => [...old, ...converted].slice(0, 6)); e.target.value = ''
  }

  const activeReminders = store.reminders.filter(r => !r.resolved)
  const resolveReminder = id => setStore(old => ({ ...old, reminders: old.reminders.map(r => r.id === id ? { ...r, resolved: true, resolvedAt: stamp() } : r) }))
  const openRecord = r => { setSelected(r); setScreen('detail') }
  const deleteRecord = r => {
    let adminPin = localStorage.getItem('cold-chain-admin-pin')
    let pinJustCreated = false
    if (!adminPin) {
      const first = window.prompt('Primo utilizzo: imposta un PIN locale riservato al responsabile per autorizzare le cancellazioni.')
      if (!first || first.length < 4) { notify('PIN non impostato: cancellazione annullata.'); return }
      const confirmPin = window.prompt('Ripeti il PIN per confermarlo.')
      if (first !== confirmPin) { notify('I PIN non coincidono.'); return }
      adminPin = first
      pinJustCreated = true
      localStorage.setItem('cold-chain-admin-pin', adminPin)
    }
    if (!pinJustCreated) {
      const entered = window.prompt('Inserisci il PIN del responsabile per autorizzare la cancellazione.')
      if (entered !== adminPin) { notify('PIN non corretto. Cancellazione non autorizzata.'); return }
    }
    if (!window.confirm('Prima della cancellazione, assicurati di aver trasmesso tutto il lavoro svolto ai coordinatori/responsabili.\n\nVuoi eliminare definitivamente questo rapporto da questo dispositivo?')) return
    setStore(old => ({ ...old, reports: old.reports.filter(item => item.id !== r.id) }))
    setSelected(null)
    setScreen('archive')
    notify('Rapporto eliminato dall’archivio locale.')
  }

  return <div className="shell">
    {showSplash && <div className="splash-screen" role="status" aria-label="Avvio San Martino">
      <div className="splash-content">
        <div className="splash-logos">
          <img src="/fresenius-logo.png" alt="Fresenius" className="splash-fresenius"/>
          <span className="splash-divider" aria-hidden="true"/>
          <img src="/irccs-aom-logo.png" alt="IRCCS Azienda Ospedaliera Metropolitana" className="splash-aom"/>
        </div>
        <div className="splash-title">SAN MARTINO</div>
        <div className="splash-subtitle">REPERIBILITÀ · CATENA DEL FREDDO</div>
        <div className="splash-progress"><span/></div>
      </div>
    </div>}
    <header className="topbar">
      <div className="brand-lockup">
        <div className="app-mark"><Thermometer size={20}/></div>
        <div className="brand-name"><b>Reperibilità</b><small>CATENA DEL FREDDO</small></div>
      </div>
      <span className="local">● Locale</span>
    </header>
    <div className="partner-logos" aria-label="Loghi istituzionali">
      <img src="/fresenius-logo.png" alt="Fresenius" className="fresenius-logo"/>
      <img src="/irccs-aom-logo.png" alt="IRCCS Azienda Ospedaliera Metropolitana" className="aom-logo"/>
    </div>
    {screen === 'home' && <main className="page">
      <div className="hero"><span className="eyebrow">ASSISTENTE OPERATIVO</span><h1>Intervento<br/>notturno</h1><p>Una domanda alla volta. I passaggi essenziali, senza complicazioni.</p></div>
      <label className="field-label">Tecnico reperibile</label><input className="input" value={tech} onChange={e => setTech(e.target.value)} placeholder="Nome e cognome" />
      <div className="shift-fields"><div><label className="field-label">Inizio turno</label><input className="input" type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}/></div><div><label className="field-label">Fine turno</label><input className="input" type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}/></div></div>
      <button className="primary big" onClick={start}><ClipboardList/> Inizia checklist <ChevronRight/></button>
      <button className="secondary" onClick={() => setScreen('archive')}><Archive/> Archivio rapporti <span className="counter">{store.reports.length}</span></button>
      <button className="secondary" onClick={() => setScreen('reminders')}><Bell/> Sonde con allarme disabilitato <span className="counter">{activeReminders.length}</span></button>
      <label className="haptics-setting"><input type="checkbox" checked={hapticsEnabled} onChange={e => setHapticsEnabled(e.target.checked)}/> Feedback aptico (vibrazione)</label>
      <p className="privacy"><ShieldCheck size={15}/> I dati sono salvati su questo dispositivo. La bozza viene recuperata se l'app si chiude.</p>
    </main>}

    {screen === 'checklist' && <main className="page">
      <div className="checklist-actions"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Esci</button><button className="info-button" onClick={() => setShowInfo(true)}>ⓘ Informazioni utili</button></div>
      {history.length > 0 && <button className="back-step" onClick={backStep}><ArrowLeft size={16}/> Domanda precedente</button>}
      <div className="stepcount">GUIDA OPERATIVA <span>CATENA DEL FREDDO</span></div>
      {step === 'monitor' && <Question title="Hai verificato l'allarme ricevuto su Spylog?" help="Prima di procedere, verifica l'allarme e l'andamento della temperatura." onYes={() => { addAnswer('Controllo Spylog e andamento temperatura', 'SÌ'); go('wait') }} onNo={() => { addAnswer('Controllo Spylog e andamento temperatura', 'NO'); setSpylogBlocked(true) }}/>} 
      {step === 'notes-monitor' && <TextStep title="Aggiungi una nota" help="Indica brevemente cosa non è stato possibile verificare." value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => go('wait')}/>}
      {step === 'wait' && <Question title="Dopo 15–30 minuti, la temperatura è rientrata?" help="Continua a monitorare Spylog durante l'attesa." onYes={() => { addAnswer('Temperatura rientrata dopo 15–30 minuti', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Temperatura rientrata dopo 15–30 minuti', 'NO'); go('call') }}/>} 
      {step === 'call' && <Question title="Hai contattato il centralino e chiesto del reparto?" help="Chiedi se è presente personale o se qualcuno sta lavorando sul frigorifero." onYes={() => { addAnswer('Contattato centralino / reparto', 'SÌ'); go('staff') }} onNo={() => { addAnswer('Contattato centralino / reparto', 'NO'); go('call-note') }}/>} 
      {step === 'call-note' && <TextStep title="Perché non è stato possibile contattare il reparto?" value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => go('onsite')}/>}
      {step === 'staff' && <Question title="C'è qualcuno che sta lavorando sul frigorifero?" help="Se la porta è stata richiusa, continua a verificare Spylog da remoto." onYes={() => { addAnswer('Personale al lavoro sul frigorifero', 'SÌ'); go('remote') }} onNo={() => { addAnswer('Personale al lavoro sul frigorifero', 'NO'); go('onsite') }}/>} 
      {step === 'remote' && <Question title="La temperatura è rientrata durante il monitoraggio?" help="In genere, se il frigorifero è stato richiuso, si continua a controllare da remoto." onYes={() => { addAnswer('Monitoraggio remoto dopo chiusura frigorifero', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Monitoraggio remoto dopo chiusura frigorifero', 'NO'); go('onsite') }}/>} 
      {step === 'onsite' && <>
        <div className="question"><div className="qicon"><Thermometer/></div><h1>Intervento sul posto</h1><p>Identifica il frigorifero e la sonda / Spylog.</p></div>
        <label className="field-label">Numero inventario del frigorifero</label><input className="input" value={data.fridge} inputMode="numeric" onChange={e => setData(d => ({...d, fridge:e.target.value}))} placeholder="Inventario frigorifero"/>
        <label className="field-label">Numero inventario della sonda / Spylog</label><input className="input" value={data.probe} inputMode="numeric" onChange={e => setData(d => ({...d, probe:e.target.value}))} placeholder="Inventario sonda"/>
        <div className="photo-box"><div><b>Foto dell'intervento</b><small>Facoltative · massimo 6 foto</small></div><label className="photo-button"><ImagePlus size={18}/> Aggiungi foto<input type="file" accept="image/*" capture="environment" multiple onChange={addPhotos} hidden/></label>{photos.length > 0 && <div className="thumbs">{photos.map((p,i)=><img key={i} src={p.dataUrl} alt={p.name}/>)}</div>}</div>
        <button className="primary" onClick={() => { if (!data.fridge.trim() || !data.probe.trim()) { notify('Inserisci entrambi i numeri inventario.'); return } go('resolved') }}>Continua <ArrowRight/></button>
      </>}
      {step === 'resolved' && <Question title="Il problema è stato risolto?" help="Se il frigorifero non riparte, avvisa i responsabili per lo spostamento dei farmaci." onYes={() => { addAnswer('Problema risolto sul posto', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Problema risolto sul posto', 'NO'); go('notify') }}/>} 
      {step === 'notify' && <Question title="Hai avvisato Ingegneria Clinica e gli eventuali responsabili che i farmaci devono essere spostati?" help="Lo spostamento non è gestito dal tecnico reperibile. Dopo la comunicazione, il tuo intervento è concluso." onYes={() => { addAnswer('Comunicati necessità di spostamento farmaci ai responsabili', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Comunicati necessità di spostamento farmaci ai responsabili', 'NO'); go('notify-note') }}/>} 
      {step === 'notify-note' && <TextStep title="A chi devi ancora comunicare la necessità di spostamento?" value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => { addAnswer('Comunicazione non completata', 'NO', data.notes); go('alarm') }}/>} 
      {step === 'alarm' && <Question title="È stato disabilitato qualche allarme?" help="Registra la sonda se un allarme è stato disabilitato, ad esempio durante uno sbrinamento." onYes={() => { addAnswer('È stato disabilitato qualche allarme?', 'SÌ'); go('alarm-id') }} onNo={() => { setData(d => ({...d, disabled:'no'})); addAnswer('È stato disabilitato qualche allarme?', 'NO'); beginCloseReport('Intervento concluso') }}/>} 
      {step === 'alarm-id' && <>
        <div className="question"><div className="qicon"><Bell/></div><h1>Numero inventario della sonda disabilitata</h1><p>Inserisci il numero per renderlo visibile agli altri reperibili.</p></div>
        <input className="input" value={data.disabledInventory} inputMode="numeric" onChange={e => setData(d => ({...d, disabledInventory:e.target.value}))} placeholder="N. inventario sonda"/>
        <button className="primary" onClick={() => { if (!data.disabledInventory.trim()) { notify('Inserisci il numero inventario della sonda.'); return } go('alarm-remind') }}>Continua <ArrowRight/></button>
      </>}
      {step === 'alarm-remind' && <Question title={`Vuoi che venga ricordato che la sonda N. INV ${data.disabledInventory} è stata disabilitata?`} help="Il promemoria sarà visibile agli altri reperibili finché non viene confermato il ripristino." onYes={() => { addAnswer('Promemoria sonda disabilitata', 'SÌ', `INV ${data.disabledInventory}`); beginCloseReport('Intervento concluso', { disabled:'si', remindDisabled:'si' }) }} onNo={() => { addAnswer('Promemoria sonda disabilitata', 'NO', `INV ${data.disabledInventory}`); beginCloseReport('Intervento concluso', { disabled:'si', remindDisabled:'no' }) }}/>} 
      {step === 'finalize' && <>
        <div className="question"><div className="qicon"><FileText/></div><h1>Referente e firma</h1><p>Indica se è presente un responsabile o tecnico referente. La firma è facoltativa.</p></div>
        <div className="choices"><button className={responsiblePresent === 'si' ? 'yes' : ''} onClick={() => setResponsiblePresent('si')}>SÌ, presente</button><button className={responsiblePresent === 'no' ? 'no' : ''} onClick={() => setResponsiblePresent('no')}>NO</button></div>
        {responsiblePresent === 'si' && <>
          <label className="field-label">Nome e cognome del referente</label>
          <input className="input" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} placeholder="Nome e cognome"/>
          <label className="field-label">Firma del referente (facoltativa)</label>
          <button className="secondary" onClick={() => setSignatureOpen(true)}>Apri area firma a schermo intero</button>
          {signatureData && <div className="signature-preview"><img src={signatureData} alt="Firma acquisita"/><small>Firma acquisita</small></div>}
        </>}
        <button className="primary" onClick={() => {
          if (responsiblePresent === 'si' && !responsibleName.trim()) { notify('Inserisci nome e cognome del referente.'); return }
          closeReport(pendingClose.outcome, pendingClose.overrides)
        }}>Concludi e genera rapporto <CheckCircle2/></button>
      </>}
      <div className="footnote">Le risposte vengono registrate nel rapporto tecnico. Il prototipo non sostituisce le procedure del servizio.</div>
    </main>}

    {screen === 'report' && selected && <main className="page"><div className="success-head"><CheckCircle2 size={34}/><h1>Rapporto generato</h1><p>L'intervento è stato registrato.</p></div><div className="report-card"><div className="report-title"><FileText/><div><b>Rapporto tecnico</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small></div></div><p className="muted">Il rapporto è stato salvato nell'archivio locale. Puoi verificarlo prima di condividerlo.</p></div><button className="primary big" onClick={() => setShareMenuOpen(true)}><Download/> Condividi</button><button className="secondary" onClick={() => setRtPreviewOpen(true)}><FileText/> Visualizza RT</button><p className="privacy">L'anteprima è in sola lettura. Il PDF condiviso utilizza gli stessi dati e la stessa carta intestata.</p><button className="secondary" onClick={() => setScreen('home')}>Torna alla home</button></main>}

    {signatureOpen && <SignatureModal onSave={dataUrl => { setSignatureData(dataUrl); setSignatureOpen(false) }} onClose={() => setSignatureOpen(false)} />}
    {spylogBlocked && <div className="modal-backdrop"><section className="info-modal done-modal" role="alertdialog" aria-modal="true"><div className="done-icon warning"><AlertTriangle size={42}/></div><h2>E CHE ASPETTI? 😂</h2><p>Prima di procedere devi verificare l'allarme su Spylog!</p><button className="primary" onClick={() => { buzz(); setSpylogBlocked(false) }}>Va bene, verifico</button></section></div>}
    {screen === 'archive' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Archivio rapporti</h1><p className="muted">Archivio locale dei rapporti. Apri un intervento per consultarlo o esportarlo.</p>{store.reports.length === 0 ? <div className="empty"><Archive size={28}/><b>Nessun intervento registrato</b><span>I rapporti compariranno qui al termine della checklist.</span></div> : store.reports.map(r => <button className="record" key={r.id} onClick={() => openRecord(r)}><div><b>{r.fridgeInventory ? `Frigo INV ${r.fridgeInventory}` : 'Intervento da remoto'}</b><small>{fmt(r.createdAt)} · {r.technician}</small><small>{r.outcome} · {r.photos?.length || 0} foto</small></div><ChevronRight/></button>)}</main>}

    {screen === 'detail' && selected && <main className="page"><button className="back" onClick={() => setScreen('archive')}><ArrowLeft size={17}/> Archivio</button><h1>Dettaglio intervento</h1><div className="report-card"><b>Checklist originale · sola lettura</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small><div className="answers">{selected.answers.map((a,i)=><div className="answer-row" key={i}><span>{a.question}</span><b className={a.answer === 'SÌ' ? 'yes' : 'no'}>{a.answer}</b>{a.note && <small>{a.note}</small>}</div>)}</div><pre>{selected.report}</pre>{selected.photos?.length > 0 && <div className="photo-gallery">{selected.photos.map((p,i)=><figure key={i}><img src={p.dataUrl} alt={p.name}/><figcaption>{p.name}</figcaption></figure>)}</div>}</div><button className="primary" onClick={() => printPdf(selected)}><Download/> Stampa / salva PDF</button><button className="secondary" onClick={() => downloadText(selected)}><FileText/> Scarica TXT</button><button className="danger-button" onClick={() => deleteRecord(selected)}><X size={17}/> Elimina rapporto (responsabile)</button></main>}

    {screen === 'reminders' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Sonde con allarme disabilitato</h1><p className="muted">Promemoria registrati dai tecnici. Conferma il ripristino solo dopo averlo verificato.</p>{activeReminders.length === 0 ? <div className="empty"><CheckCircle2 size={28}/><b>Nessun promemoria aperto</b></div> : activeReminders.map(r => <div className="reminder" key={r.id}><div><b>Sonda INV {r.inventory}</b><small>Registrata il {fmt(r.createdAt)}</small><span className="status">Da verificare / ripristinare</span></div><button onClick={() => { if (window.confirm(`Confermi il ripristino della sonda INV ${r.inventory}?`)) resolveReminder(r.id) }}>Conferma ripristino</button></div>)}</main>}
    {shareMenuOpen && <div className="modal-backdrop" onClick={() => setShareMenuOpen(false)}><section className="info-modal action-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShareMenuOpen(false)}>✕</button><h2>Condividi rapporto</h2><p className="modal-intro">Scegli il formato da inviare tramite il menu di condivisione Android.</p><button className="primary" onClick={() => { setShareMenuOpen(false); sharePdf(selected) }}><FileText/> Condividi PDF</button><button className="secondary" onClick={() => { setShareMenuOpen(false); shareTxt(selected) }}><FileText/> Condividi TXT</button></section></div>}
    {rtPreviewOpen && <div className="modal-backdrop rt-backdrop" onClick={() => setRtPreviewOpen(false)}><section className="rt-modal" role="dialog" aria-modal="true" aria-label="Anteprima rapporto tecnico" onClick={e => e.stopPropagation()}><header className="rt-modal-head"><div><b>Rapporto tecnico</b><small>Anteprima · sola lettura</small></div><button className="modal-close" onClick={() => setRtPreviewOpen(false)}>✕</button></header>{rtPreviewUrl ? <iframe title="Anteprima del rapporto tecnico" src={rtPreviewUrl} className="rt-frame"/> : <div className="rt-loading">Preparazione del rapporto…</div>}<footer className="rt-modal-foot"><button className="secondary" onClick={() => setRtPreviewOpen(false)}>Chiudi anteprima</button></footer></section></div>}
    {exitConfirmOpen && <div className="modal-backdrop"><section className="info-modal exit-modal" role="alertdialog" aria-modal="true"><div className="done-icon warning"><AlertTriangle size={36}/></div><h2>Vuoi uscire dall'applicazione?</h2><p>Hai concluso l'intervento? Sei sicuro di voler uscire? Se confermi, la sessione corrente verrà chiusa e alla prossima apertura partirai dalla Home. La bozza in corso non verrà ripresa automaticamente.</p><div className="exit-actions"><button className="secondary" onClick={() => setExitConfirmOpen(false)}>Annulla</button><button className="primary" onClick={confirmAppExit}>Sì, esci</button></div></section></div>}
    {showInfo && <div className="modal-backdrop" onClick={() => setShowInfo(false)}><section className="info-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowInfo(false)}>✕</button><h2>Reperibili utili</h2><p><b>FARMACIA E UFA</b><span>Reperibile Farmacia</span></p><p><b>PAD 1</b><span>Reperibile FRU</span></p><p><b>PAD 5</b><span>Reperibile CCS</span></p><p><b>CBA</b><span>Referente indicato sul frigorifero / congelatore</span></p><small>Promemoria operativo rapido.</small></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Question({ title, help, onYes, onNo }) { const tap = fn => () => { if (localStorage.getItem('cold-chain-haptics') !== 'false' && navigator.vibrate) navigator.vibrate(12); fn?.() }; return <><div className="question"><div className="qicon"><ClipboardList/></div><h1>{title}</h1>{help && <p>{help}</p>}</div><div className="choices"><button className="yes" onClick={tap(onYes)}><CheckCircle2/> SÌ</button><button className="no" onClick={tap(onNo)}><X/> NO</button></div></> }
function TextStep({ title, help, value, onChange, onNext }) { return <><div className="question"><div className="qicon"><FileText/></div><h1>{title}</h1>{help && <p>{help}</p>}</div><textarea className="textarea" value={value} onChange={e => onChange(e.target.value)} placeholder="Scrivi una breve nota..."/><button className="primary" onClick={onNext}>Continua <ArrowRight/></button></> }

function SignatureModal({ onSave, onClose }) {
  const canvasRef = useRef(null)
  const areaRef = useRef(null)
  const drawing = useRef(false)
  const strokes = useRef([])
  const activeStroke = useRef(null)
  const [inkVisible, setInkVisible] = useState(false)

  const redraw = () => {
    const canvas = canvasRef.current
    const area = areaRef.current
    if (!canvas || !area) return
    const rect = area.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#172033'
    for (const stroke of strokes.current) {
      if (!stroke.length) continue
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1)
      ctx.stroke()
    }
  }

  useEffect(() => {
    redraw()
    const observer = typeof ResizeObserver !== 'undefined' && areaRef.current ? new ResizeObserver(redraw) : null
    if (observer && areaRef.current) observer.observe(areaRef.current)
    window.addEventListener('orientationchange', redraw)
    return () => {
      observer?.disconnect()
      window.removeEventListener('orientationchange', redraw)
    }
  }, [])

  const point = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const start = e => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas || !canvas.getContext('2d')) return
    drawing.current = true
    activeStroke.current = [point(e)]
    strokes.current.push(activeStroke.current)
    try { canvas.setPointerCapture(e.pointerId) } catch {}
    redraw()
    if (!inkVisible) setInkVisible(true)
  }
  const move = e => {
    if (!drawing.current || !activeStroke.current) return
    e.preventDefault()
    activeStroke.current.push(point(e))
    redraw()
  }
  const end = () => { drawing.current = false; activeStroke.current = null }
  const clear = () => {
    strokes.current = []
    drawing.current = false
    activeStroke.current = null
    setInkVisible(false)
    redraw()
  }

  return <div className="signature-overlay">
    <div className="signature-toolbar">
      <div><b>Firma del referente</b><small>Puoi firmare in verticale o in orizzontale</small></div>
      <button className="secondary" onClick={onClose}>Annulla</button>
    </div>
    <div className="signature-area" ref={areaRef}>
      <canvas ref={canvasRef} className="signature-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>
      {!inkVisible && <span>Firma qui con il dito o con una penna touch</span>}
    </div>
    <div className="signature-toolbar bottom">
      <button className="secondary" onClick={clear}>Cancella</button>
      <button className="primary" disabled={!inkVisible} onClick={() => { const canvas = canvasRef.current; if (canvas && inkVisible) onSave(canvas.toDataURL('image/png')) }}>Conferma firma <CheckCircle2/></button>
    </div>
  </div>
}

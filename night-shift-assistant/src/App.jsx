import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { AlertTriangle, Archive, ArrowLeft, ArrowRight, Bell, Camera, Check, CheckCircle2, ChevronRight, ClipboardList, Clock3, Download, FileText, ImagePlus, Plus, ShieldCheck, Thermometer, X } from 'lucide-react'

const KEY = 'cold-chain-assistant-v3'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { reports: [], reminders: [] } } catch { return { reports: [], reminders: [] } } }
const stamp = () => new Date().toISOString()
const fmt = value => new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

export default function App() {
  const [store, setStore] = useState(load)
  const [screen, setScreen] = useState('home')
  const [step, setStep] = useState('start')
  const [tech, setTech] = useState('')
  const [shiftStart, setShiftStart] = useState('20:00')
  const [shiftEnd, setShiftEnd] = useState('08:00')
  const [history, setHistory] = useState([])
  const [showInfo, setShowInfo] = useState(false)
  const [answers, setAnswers] = useState([])
  const [data, setData] = useState({ fridge: '', probe: '', disabled: 'no', disabledInventory: '', remindDisabled: 'si', notes: '' })
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(store)) }, [store])
  const notify = msg => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const addAnswer = (question, answer, note = '') => setAnswers(old => { const item = { question, answer, note, at: stamp() }; const i = old.findIndex(a => a.question === question); if (i < 0) return [...old, item]; const copy = [...old]; copy[i] = item; return copy })
  const go = next => { setHistory(old => [...old, step]); setStep(next) }
  const backStep = () => { if (history.length) { setStep(history[history.length - 1]); setHistory(old => old.slice(0, -1)) } }
  const start = () => { if (!tech.trim()) { notify('Inserisci nome e cognome del tecnico.'); return } if (!shiftStart || !shiftEnd) { notify('Inserisci inizio e fine turno.'); return } setAnswers([]); setHistory([]); setData({ fridge: '', probe: '', disabled: 'no', disabledInventory: '', remindDisabled: 'si', notes: '' }); setPhotos([]); setStep('monitor'); setScreen('checklist') }

  const closeReport = (outcome, overrides = {}) => {
    const finalData = { ...data, ...overrides }

    const record = {
      id: uid(),
      createdAt: stamp(),
      technician: tech.trim() || 'Tecnico non indicato',
      shift: { start: shiftStart, end: shiftEnd },
      answers,
      outcome,
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
  }

  function makeReport(r) {
    const lines = [
      'RAPPORTO TECNICO – REPERIBILITÀ CATENA DEL FREDDO',
      `Data e ora: ${fmt(r.createdAt)}`,
      `Tecnico: ${r.technician}`,
      `Turno di reperibilità: ${r.shift?.start || '—'} – ${r.shift?.end || '—'}`,
      `Esito: ${r.outcome}`,
      '', 'IDENTIFICAZIONE APPARECCHIATURA',
      `Inventario frigorifero: ${r.fridgeInventory || 'Non previsto – intervento da remoto'}`,
      `Inventario sonda / Spylog: ${r.probeInventory || 'Non previsto – intervento da remoto'}`,
      '', 'CHECKLIST ESEGUITA',
      ...r.answers.map(a => `• ${a.question}: ${a.answer}${a.note ? ` – ${a.note}` : ''}`),
      '', 'ALLARMI DISABILITATI',
      r.disabledAlarm ? `Sonda inventario ${r.disabledAlarm.inventory}. Promemoria richiesto: ${r.disabledAlarm.reminder ? 'SÌ' : 'NO'}.` : 'Nessun allarme dichiarato disabilitato.',
      '', 'NOTE', r.notes || 'Nessuna nota aggiuntiva.',
      '', `Fotografie allegate: ${r.photos?.length || 0}`
    ]
    return lines.join('\n')
  }

  const shareText = r => { const text = `Rapporto catena del freddo\n${fmt(r.createdAt)}\nTecnico: ${r.technician}\nTurno: ${r.shift?.start || '—'}–${r.shift?.end || '—'}\nEsito: ${r.outcome}\nFrigo INV: ${r.fridgeInventory || 'n/d'}\nSonda INV: ${r.probeInventory || 'n/d'}`; return text }
  const shareWhatsApp = r => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(r))}`, '_blank', 'noopener,noreferrer')
  const shareTelegram = r => window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(shareText(r))}`, '_blank', 'noopener,noreferrer')
  const shareNative = async r => { try { const blob = createPdfBlob(r); const file = new File([blob], `rapporto-${r.id}.pdf`, {type:'application/pdf'}); if (navigator.share && navigator.canShare?.({files:[file]})) await navigator.share({ title:'Rapporto catena del freddo', files:[file], text:shareText(r) }); else { printPdf(r); notify('Apri il PDF e allegalo dalla cartella Download.'); } } catch (e) { if (e.name !== 'AbortError') notify('Condivisione non disponibile su questo dispositivo.'); } }
  const downloadText = r => {
    const blob = new Blob([r.report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rapporto-catena-freddo-${r.id}.txt`; a.click(); URL.revokeObjectURL(url)
  }
  const createPdfBlob = r => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
    doc.text('Rapporto tecnico – Catena del freddo', 15, 18)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const lines = doc.splitTextToSize(r.report, 180)
    let y = 28
    lines.forEach(line => { if (y > 280) { doc.addPage(); y = 18 } doc.text(line, 15, y); y += 5 })
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
  const resolveReminder = id => {
    setStore(old => ({
      ...old,
      reminders: old.reminders.map(r =>
        r.id === id
          ? { ...r, resolved: true, resolvedAt: stamp() }
          : r
      )
    }))
  }
  const openRecord = r => { setSelected(r); setScreen('detail') }

  return <div className="shell">
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
      <p className="privacy"><ShieldCheck size={15}/> Prototipo dimostrativo: i dati sono salvati su questo dispositivo.</p>
    </main>}

    {screen === 'checklist' && <main className="page">
      <div className="checklist-actions"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Esci</button><button className="info-button" onClick={() => setShowInfo(true)}>ⓘ Informazioni utili</button></div>
      {history.length > 0 && <button className="back-step" onClick={backStep}><ArrowLeft size={16}/> Domanda precedente</button>}
      <div className="stepcount">GUIDA OPERATIVA <span>CATENA DEL FREDDO</span></div>
      {step === 'monitor' && <Question title="Hai controllato Spylog e verificato l'escursione termica?" help="Controlla quando è iniziata e l'andamento della temperatura." onYes={() => { addAnswer('Controllo Spylog e andamento temperatura', 'SÌ'); go('wait') }} onNo={() => { addAnswer('Controllo Spylog e andamento temperatura', 'NO'); go('notes-monitor') }}/>} 
      {step === 'notes-monitor' && <TextStep title="Aggiungi una nota" help="Indica brevemente cosa non è stato possibile verificare." value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => go('wait')}/>}
      {step === 'wait' && <Question title="Dopo 15–30 minuti, la temperatura è rientrata?" help="Continua a monitorare Spylog durante l'attesa." onYes={() => { addAnswer('Temperatura rientrata dopo 15–30 minuti', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Temperatura rientrata dopo 15–30 minuti', 'NO'); go('call') }}/>} 
      {step === 'call' && <Question title="Hai contattato il centralino e chiesto del reparto?" help="Chiedi se è presente personale o se qualcuno sta lavorando sul frigorifero." onYes={() => { addAnswer('Contattato centralino / reparto', 'SÌ'); go('staff') }} onNo={() => { addAnswer('Contattato centralino / reparto', 'NO'); go('call-note') }}/>} 
      {step === 'call-note' && <TextStep title="Perché non è stato possibile contattare il reparto?" value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => go('onsite')}/>}
      {step === 'staff' && <Question title="C'è qualcuno che sta lavorando sul frigorifero?" help="Se la porta è stata richiusa, continua a verificare Spylog da remoto." onYes={() => { addAnswer('Personale al lavoro sul frigorifero', 'SÌ'); go('remote') }} onNo={() => { addAnswer('Personale al lavoro sul frigorifero', 'NO'); go('onsite') }}/>} 
      {step === 'remote' && <Question title="La temperatura è rientrata durante il monitoraggio?" help="In genere, se il frigorifero è stato richiuso, si continua a controllare da remoto." onYes={() => { addAnswer('Monitoraggio remoto dopo chiusura frigorifero', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Monitoraggio remoto dopo chiusura frigorifero', 'NO'); go('onsite') }}/>} 
      {step === 'onsite' && <>
        <div className="question"><div className="qicon"><Thermometer/></div><h1>Intervento sul posto</h1><p>Identifica il frigorifero e la sonda / Spylog.</p></div>
        <label className="field-label">Numero inventario del frigorifero</label><input className="input" value={data.fridge} onChange={e => setData(d => ({...d, fridge:e.target.value}))} placeholder="Inventario frigorifero"/>
        <label className="field-label">Numero inventario della sonda / Spylog</label><input className="input" value={data.probe} onChange={e => setData(d => ({...d, probe:e.target.value}))} placeholder="Inventario sonda"/>
        <div className="photo-box"><div><b>Foto dell'intervento</b><small>Facoltative · massimo 6 foto</small></div><label className="photo-button"><ImagePlus size={18}/> Aggiungi foto<input type="file" accept="image/*" capture="environment" multiple onChange={addPhotos} hidden/></label>{photos.length > 0 && <div className="thumbs">{photos.map((p,i)=><img key={i} src={p.dataUrl} alt={p.name}/>)}</div>}</div>
        <button className="primary" onClick={() => { if (!data.fridge.trim() || !data.probe.trim()) { notify('Inserisci entrambi i numeri inventario.'); return } go('resolved') }}>Continua <ArrowRight/></button>
      </>}
      {step === 'resolved' && <Question title="Il problema è stato risolto?" help="Se il frigorifero non riparte, avvisa i responsabili per lo spostamento dei farmaci." onYes={() => { addAnswer('Problema risolto sul posto', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Problema risolto sul posto', 'NO'); go('notify') }}/>} 
      {step === 'notify' && <Question title="Hai avvisato Ingegneria Clinica e gli eventuali responsabili che i farmaci devono essere spostati?" help="Lo spostamento non è gestito dal tecnico reperibile. Dopo la comunicazione, il tuo intervento è concluso." onYes={() => { addAnswer('Comunicati necessità di spostamento farmaci ai responsabili', 'SÌ'); go('alarm') }} onNo={() => { addAnswer('Comunicati necessità di spostamento farmaci ai responsabili', 'NO'); go('notify-note') }}/>} 
      {step === 'notify-note' && <TextStep title="A chi devi ancora comunicare la necessità di spostamento?" value={data.notes} onChange={v => setData(d => ({...d, notes:v}))} onNext={() => { addAnswer('Comunicazione non completata', 'NO', data.notes); go('alarm') }}/>} 
      {step === 'alarm' && <Question title="È stato disabilitato qualche allarme?" help="Registra la sonda se un allarme è stato disabilitato, ad esempio durante uno sbrinamento." onYes={() => { addAnswer('È stato disabilitato qualche allarme?', 'SÌ'); go('alarm-id') }} onNo={() => { setData(d => ({...d, disabled:'no'})); addAnswer('È stato disabilitato qualche allarme?', 'NO'); closeReport('Intervento concluso') }}/>} 
      {step === 'alarm-id' && <>
        <div className="question"><div className="qicon"><Bell/></div><h1>Numero inventario della sonda disabilitata</h1><p>Inserisci il numero per renderlo visibile agli altri reperibili.</p></div>
        <input className="input" value={data.disabledInventory} onChange={e => setData(d => ({...d, disabledInventory:e.target.value}))} placeholder="N. inventario sonda"/>
        <button className="primary" onClick={() => { if (!data.disabledInventory.trim()) { notify('Inserisci il numero inventario della sonda.'); return } go('alarm-remind') }}>Continua <ArrowRight/></button>
      </>}
      {step === 'alarm-remind' && <Question title={`Vuoi che venga ricordato che la sonda N. INV ${data.disabledInventory} è stata disabilitata?`} help="Il promemoria sarà visibile agli altri reperibili finché non viene confermato il ripristino." onYes={() => { addAnswer('Promemoria sonda disabilitata', 'SÌ', `INV ${data.disabledInventory}`); closeReport('Intervento concluso', { disabled:'si', remindDisabled:'si' }) }} onNo={() => { addAnswer('Promemoria sonda disabilitata', 'NO', `INV ${data.disabledInventory}`); closeReport('Intervento concluso', { disabled:'si', remindDisabled:'no' }) }}/>} 
      <div className="footnote">Le risposte vengono registrate nel rapporto tecnico. Il prototipo non sostituisce le procedure del servizio.</div>
    </main>}

    {screen === 'report' && selected && <main className="page"><div className="success-head"><CheckCircle2 size={34}/><h1>Rapporto generato</h1><p>L'intervento è stato registrato.</p></div><div className="report-card"><div className="report-title"><FileText/><div><b>Rapporto tecnico</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small></div></div><pre>{selected.report}</pre>{selected.photos?.length > 0 && <div className="thumbs">{selected.photos.map((p,i)=><img key={i} src={p.dataUrl} alt={p.name}/>)}</div>}</div><button className="primary" onClick={() => printPdf(selected)}><Download/> Stampa / salva PDF</button><button className="secondary" onClick={() => downloadText(selected)}><FileText/> Scarica TXT</button><div className="share-grid"><button onClick={() => shareWhatsApp(selected)}>WhatsApp</button><button onClick={() => shareTelegram(selected)}>Telegram</button></div><button className="primary" onClick={() => shareNative(selected)}>Condividi rapporto</button><p className="privacy">Il rapporto è già salvato automaticamente nell’archivio di questo dispositivo.</p><button className="secondary" onClick={() => setScreen('home')}>Torna alla home</button></main>}

    {screen === 'archive' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Archivio rapporti</h1><p className="muted">Consultazione in sola lettura. I rapporti non sono modificabili.</p>{store.reports.length === 0 ? <div className="empty"><Archive size={28}/><b>Nessun intervento registrato</b><span>I rapporti compariranno qui al termine della checklist.</span></div> : store.reports.map(r => <button className="record" key={r.id} onClick={() => openRecord(r)}><div><b>{r.fridgeInventory ? `Frigo INV ${r.fridgeInventory}` : 'Intervento da remoto'}</b><small>{fmt(r.createdAt)} · {r.technician}</small><small>{r.outcome} · {r.photos?.length || 0} foto</small></div><ChevronRight/></button>)}</main>}

    {screen === 'detail' && selected && <main className="page"><button className="back" onClick={() => setScreen('archive')}><ArrowLeft size={17}/> Archivio</button><h1>Dettaglio intervento</h1><div className="report-card"><b>Checklist originale · sola lettura</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small><div className="answers">{selected.answers.map((a,i)=><div className="answer-row" key={i}><span>{a.question}</span><b className={a.answer === 'SÌ' ? 'yes' : 'no'}>{a.answer}</b>{a.note && <small>{a.note}</small>}</div>)}</div><pre>{selected.report}</pre>{selected.photos?.length > 0 && <div className="photo-gallery">{selected.photos.map((p,i)=><figure key={i}><img src={p.dataUrl} alt={p.name}/><figcaption>{p.name}</figcaption></figure>)}</div>}</div><button className="primary" onClick={() => printPdf(selected)}><Download/> Stampa / salva PDF</button><button className="secondary" onClick={() => downloadText(selected)}><FileText/> Scarica TXT</button></main>}

    {screen === 'reminders' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Sonde con allarme disabilitato</h1><p className="muted">Promemoria registrati dai tecnici. Conferma il ripristino solo dopo averlo verificato.</p>{activeReminders.length === 0 ? <div className="empty"><CheckCircle2 size={28}/><b>Nessun promemoria aperto</b></div> : activeReminders.map(r => <div className="reminder" key={r.id}><div><b>Sonda INV {r.inventory}</b><small>Registrata il {fmt(r.createdAt)}</small><span className="status">Da verificare / ripristinare</span></div><button onClick={() => { if (window.confirm(`Confermi il ripristino della sonda INV ${r.inventory}?`)) resolveReminder(r.id) }}>Conferma ripristino</button></div>)}</main>}
    {showInfo && <div className="modal-backdrop" onClick={() => setShowInfo(false)}><section className="info-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowInfo(false)}>✕</button><h2>Reperibili utili</h2><p><b>FARMACIA E UFA</b><span>Reperibile Farmacia</span></p><p><b>PAD 1</b><span>Reperibile FRU</span></p><p><b>PAD 5</b><span>Reperibile CCS</span></p><p><b>CBA</b><span>Referente indicato sul frigorifero / congelatore</span></p><small>Promemoria operativo rapido.</small></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Question({ title, help, onYes, onNo }) { return <><div className="question"><div className="qicon"><ClipboardList/></div><h1>{title}</h1>{help && <p>{help}</p>}</div><div className="choices"><button className="yes" onClick={onYes}><CheckCircle2/> SÌ</button><button className="no" onClick={onNo}><X/> NO</button></div></> }
function TextStep({ title, help, value, onChange, onNext }) { return <><div className="question"><div className="qicon"><FileText/></div><h1>{title}</h1>{help && <p>{help}</p>}</div><textarea className="textarea" value={value} onChange={e => onChange(e.target.value)} placeholder="Scrivi una breve nota..."/><button className="primary" onClick={onNext}>Continua <ArrowRight/></button></> }

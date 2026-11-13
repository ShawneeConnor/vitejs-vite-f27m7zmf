      <div className="success-head"><CheckCircle2 size={34}/><h1>Intervento concluso</h1><p>Il rapporto è stato registrato nell’archivio locale.</p></div>
      <div className="report-card"><div className="report-title"><FileText/><div><b>Rapporto tecnico</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small></div></div><p><b>Referente:</b> {selected.responsible?.name}</p><p><b>Fine intervento:</b> {selected.shift?.end || '—'}</p></div>
      <button className="primary" onClick={() => setShareMenuOpen(v => !v)}>Condividi <Download/></button>
      {shareMenuOpen && <><button className="secondary" onClick={() => { setShareMenuOpen(false); shareNative(selected) }}><FileText/> Condividi PDF</button><button className="secondary" onClick={() => { setShareMenuOpen(false); downloadText(selected) }}><FileText/> Scarica TXT</button></>}
      <button className="secondary" onClick={() => setScreen('report-rt')}><FileText/> Visualizza RT</button>
      <p className="privacy">Il rapporto completo, con intestazione e firma, è consultabile nella visualizzazione RT.</p>
      <button className="secondary" onClick={() => setScreen('home')}>Torna alla home</button>
    </main>}

    {screen === 'report-rt' && selected && <main className="page">
      <button className="back" onClick={() => setScreen('report-preview')}><ArrowLeft size={17}/> Torna al rapporto</button>
      <div className="report-card rt-preview"><div className="rt-letterhead"><div className="rt-logos"><img src="/fresenius-logo.png" alt="Fresenius"/><img src="/irccs-aom-logo.png" alt="IRCCS Azienda Ospedaliera Metropolitana"/></div><b>SERVIZIO DI REPERIBILITÀ – CATENA DEL FREDDO</b><h2>RAPPORTO TECNICO DI INTERVENTO</h2></div><pre>{selected.report}</pre>{selected.responsible?.signatureData && <div className="rt-signature"><b>Firma del referente</b><img src={selected.responsible.signatureData} alt="Firma del referente"/></div>}{selected.photos?.length > 0 && <div className="photo-gallery">{selected.photos.map((p,i)=><figure key={i}><img src={p.dataUrl} alt={p.name}/><figcaption>{`Foto ${i+1} – ${p.name}`}</figcaption></figure>)}</div>}</div>
      <button className="primary" onClick={() => printPdf(selected)}><Download/> Stampa / salva PDF</button>
    </main>}

    {signatureOpen && <SignatureModal onSave={dataUrl => { setSignatureData(dataUrl); setSignatureOpen(false) }} onClose={() => setSignatureOpen(false)} />}
    {spylogBlocked && <div className="modal-backdrop"><section className="info-modal done-modal" role="alertdialog" aria-modal="true"><div className="done-icon warning"><AlertTriangle size={42}/></div><h2>E CHE ASPETTI? 😂</h2><p>Prima di procedere devi verificare l'allarme su Spylog!</p><button className="primary" onClick={() => { buzz(); setSpylogBlocked(false) }}>Va bene, verifico</button></section></div>}
    {screen === 'archive' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Archivio rapporti</h1><p className="muted">Archivio locale dei rapporti. Apri un intervento per consultarlo o esportarlo.</p>{store.reports.length === 0 ? <div className="empty"><Archive size={28}/><b>Nessun intervento registrato</b><span>I rapporti compariranno qui al termine della checklist.</span></div> : store.reports.map(r => <button className="record" key={r.id} onClick={() => openRecord(r)}><div><b>{r.fridgeInventory ? `Frigo INV ${r.fridgeInventory}` : 'Intervento da remoto'}</b><small>{fmt(r.createdAt)} · {r.technician}</small><small>{r.outcome} · {r.photos?.length || 0} foto</small></div><ChevronRight/></button>)}</main>}

    {screen === 'detail' && selected && <main className="page"><button className="back" onClick={() => setScreen('archive')}><ArrowLeft size={17}/> Archivio</button><h1>Dettaglio intervento</h1><div className="report-card"><b>Checklist originale · sola lettura</b><small>{fmt(selected.createdAt)} · {selected.technician} · Turno {selected.shift?.start || '—'}–{selected.shift?.end || '—'}</small><div className="answers">{selected.answers.map((a,i)=><div className="answer-row" key={i}><span>{a.question}</span><b className={a.answer === 'SÌ' ? 'yes' : 'no'}>{a.answer}</b>{a.note && <small>{a.note}</small>}</div>)}</div><pre>{selected.report}</pre>{selected.photos?.length > 0 && <div className="photo-gallery">{selected.photos.map((p,i)=><figure key={i}><img src={p.dataUrl} alt={p.name}/><figcaption>{p.name}</figcaption></figure>)}</div>}</div><button className="primary" onClick={() => printPdf(selected)}><Download/> Stampa / salva PDF</button><button className="secondary" onClick={() => downloadText(selected)}><FileText/> Scarica TXT</button><button className="danger-button" onClick={() => deleteRecord(selected)}><X size={17}/> Elimina rapporto (responsabile)</button></main>}

    {screen === 'reminders' && <main className="page"><button className="back" onClick={() => setScreen('home')}><ArrowLeft size={17}/> Indietro</button><h1>Sonde con allarme disabilitato</h1><p className="muted">Promemoria registrati dai tecnici. Conferma il ripristino solo dopo averlo verificato.</p>{activeReminders.length === 0 ? <div className="empty"><CheckCircle2 size={28}/><b>Nessun promemoria aperto</b></div> : activeReminders.map(r => <div className="reminder" key={r.id}><div><b>Sonda INV {r.inventory}</b><small>Registrata il {fmt(r.createdAt)}</small><span className="status">Da verificare / ripristinare</span></div><button onClick={() => { if (window.confirm(`Confermi il ripristino della sonda INV ${r.inventory}?`)) resolveReminder(r.id) }}>Conferma ripristino</button></div>)}</main>}
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
  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight)

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
    const updateOrientation = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    redraw()
    const observer = typeof ResizeObserver !== 'undefined' && areaRef.current ? new ResizeObserver(redraw) : null
    if (observer && areaRef.current) observer.observe(areaRef.current)
    window.addEventListener('orientationchange', redraw)
    return () => {
      observer?.disconnect()
      window.removeEventListener('orientationchange', redraw)
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [isLandscape])

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
      <div><b>Firma del referente</b><small>Ruota il dispositivo in orizzontale per acquisire la firma</small></div>
      <button className="secondary" onClick={onClose}>Annulla</button>
    </div>
    {isLandscape ? <div className="signature-area" ref={areaRef}>
      <canvas ref={canvasRef} className="signature-canvas" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>
      {!inkVisible && <span>Firma qui con il dito o con una penna touch</span>}
    </div> : <div className="signature-rotate-notice"><b>Ruota il dispositivo</b><span>La firma può essere acquisita solo in modalità orizzontale.</span></div>}
    <div className="signature-toolbar bottom">
      <button className="secondary" onClick={clear}>Cancella</button>
      <button className="primary" disabled={!inkVisible || !isLandscape} onClick={() => { const canvas = canvasRef.current; if (canvas && inkVisible) onSave(canvas.toDataURL('image/png')) }}>Conferma firma <CheckCircle2/></button>
    </div>
  </div>
}

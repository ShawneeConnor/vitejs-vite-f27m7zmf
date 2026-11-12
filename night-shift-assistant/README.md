# Reperibilità – Catena del freddo (V3)

Prototipo React + Vite + Capacitor, mobile-first.

## Avvio su StackBlitz
1. Crea un progetto React/Vite oppure apri il progetto esistente.
2. Carica/sostituisci la cartella `night-shift-assistant`.
3. Nel terminale: `cd public/night-shift-assistant` (se l'hai caricata in `public`) e `npm install`.
4. Esegui `npm run dev -- --host 0.0.0.0`.

## Novità V3
- Identificazione tecnico e fascia oraria dell'intero turno.
- Navigazione alla domanda precedente; le risposte vengono aggiornate, non duplicate.
- Informazioni utili sempre accessibili durante la checklist.
- Archivio automatico del rapporto e condivisione rapida via WhatsApp, Telegram o condivisione nativa.
- Esportazione TXT e stampa/salvataggio PDF.

## Limiti importanti
Questa versione salva i dati in `localStorage` sul dispositivo/browser. L'archivio non è ancora condiviso tra telefoni e PC e non invia notifiche push. Per attivare sincronizzazione multiutente, ruoli e notifiche occorre configurare un progetto Firebase autorizzato dall'ente (Firestore + Authentication/ruoli + FCM). Non inserire dati reali o fotografie identificabili prima dell'autorizzazione IT/privacy.

# B&B Management App

Applicazione per la gestione professionale di Bed & Breakfast, sviluppata con Next.js 14 e stile AdminLTE.

## Caratteristiche

### Sistema Multiutente
- **Amministratore**: Accesso completo a tutte le funzionalità
- **Operatore**: Gestione location, attività e report
- **Operaio**: Visualizzazione e completamento attività assegnate
- **Cameriera**: Gestione pulizie e biancheria

### Funzionalità Principali

#### Gestione Location
- CRUD completo delle proprietà B&B
- Informazioni dettagliate (capacità, servizi, contatti)
- Generazione QR Code univoco per ogni location

#### Gestione Attività
- **Manutenzione**: Interventi tecnici e riparazioni
- **Biancheria**: Cambio e gestione tessili
- **Pulizie**: Pulizia ordinaria e straordinaria
- **Emergenze**: Interventi urgenti
- Sistema di priorità (Bassa, Media, Alta, Urgente)
- Stato attività (In Attesa, In Corso, Completata, Annullata)

#### Check-in QR Code
- Scanner QR integrato per verifica presenza
- Registrazione automatica check-in/check-out
- Tracciamento GPS (opzionale)
- Storico presenze per location

#### Flow Attività (Template)
- Template personalizzabili per ogni ruolo
- Checklist step-by-step
- Steps obbligatori e opzionali

#### Report PDF
- Generazione report per location e periodo
- Riepilogo attività completate
- Esportazione/stampa PDF

## Stack Tecnologico

- **Frontend**: Next.js 14 (App Router)
- **UI**: AdminLTE 3 (CSS custom)
- **Database**: Nile (Postgres Serverless)
- **ORM**: Prisma
- **Autenticazione**: NextAuth.js
- **QR Code**: html5-qrcode + qrcode.react
- **Notifiche**: react-hot-toast

## Installazione

### Prerequisiti
- Node.js 18+
- Account Vercel con Postgres

### Setup Locale

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd bb-management-app
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```

   Modifica `.env` con i tuoi valori:
   ```
   DATABASE_URL="postgresql://user:password@db.thenile.dev:5432/database?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
   ```

4. **Inizializza il database**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

6. **Apri l'applicazione**
   - URL: http://localhost:3000
   - Login: admin@bbmanagement.it / admin123

## Deploy su Vercel

### 1. Crea un database su Nile

1. Vai su [console.thenile.dev](https://console.thenile.dev)
2. Crea un nuovo database
3. Copia la connection string (DATABASE_URL)

### 2. Crea un nuovo progetto su Vercel

1. Importa il repository da GitHub
2. Framework Preset: Next.js

### 3. Aggiungi le variabili d'ambiente

- `DATABASE_URL`: Connection string da Nile
- `NEXTAUTH_URL`: URL del tuo sito (es. https://tuodominio.vercel.app)
- `NEXTAUTH_SECRET`: Chiave segreta (genera con `openssl rand -base64 32`)

### 4. Deploy

Il deploy avverrà automaticamente. Dopo il primo deploy:

1. Vai su Vercel > Settings > Functions
2. Esegui il seed del database (opzionale)

## Credenziali Demo

| Ruolo | Email | Password |
|-------|-------|----------|
| Admin | admin@bbmanagement.it | admin123 |
| Operatore | operatore@bbmanagement.it | user123 |
| Operaio | operaio@bbmanagement.it | user123 |
| Cameriera | cameriera@bbmanagement.it | user123 |

## Struttura Progetto

```
src/
├── app/
│   ├── api/           # API Routes
│   ├── activities/    # Gestione attività
│   ├── attendance/    # Check-in QR
│   ├── auth/          # Login
│   ├── dashboard/     # Dashboard principale
│   ├── locations/     # Gestione location
│   ├── reports/       # Report PDF
│   ├── templates/     # Flow attività
│   └── users/         # Gestione utenti
├── components/
│   ├── layout/        # Layout AdminLTE
│   └── ui/            # Componenti UI
├── lib/
│   ├── auth.ts        # Configurazione NextAuth
│   └── prisma.ts      # Client Prisma
└── types/             # TypeScript types
```

## Utilizzo

### Per Amministratori
1. Crea le location con tutti i dettagli
2. Stampa e posiziona i QR code nelle proprietà
3. Crea gli utenti del team
4. Configura i template di flow per ogni ruolo
5. Genera report periodici

### Per Operatori
1. Crea e assegna attività al team
2. Monitora lo stato delle attività
3. Verifica le presenze tramite dashboard

### Per Operai/Cameriere
1. Visualizza le attività assegnate
2. Effettua check-in con QR code
3. Aggiorna lo stato delle attività
4. Effettua check-out al termine

## Sicurezza

- Autenticazione basata su JWT
- Password hashate con bcrypt
- Protezione API per ruolo
- Sessioni sicure con NextAuth

## Licenza

MIT License

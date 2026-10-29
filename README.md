# CeccaStore

La raccolta di app, giochi e progetti di **Flavio Ceccarelli**: un’interfaccia React per esplorare le idee del suo laboratorio, provarle nel browser o scaricarne le release ufficiali.

**[Apri CeccaStore](https://carellice.github.io/CeccaStore/)** · [Repository](https://github.com/carellice/CeccaStore) · [Portfolio](https://flavioceccarelli.org)

## Cosa trovi

- **43 progetti visibili**, con loghi originali, descrizioni, piattaforme e screenshot disponibili.
- **26 progetti scaricabili**, con 40 pacchetti delle release GitHub verificate al 29 ottobre 2026.
- Ricerca, categorie, filtri per piattaforma, vista griglia/elenco, caricamento automatico scorrendo la lista e preferiti salvati sul dispositivo.
- Tema chiaro/scuro, navigazione responsive, animazioni e rispetto delle preferenze di movimento ridotto.
- Un’area con PIN per un ulteriore progetto, conservato in un pacchetto cifrato separato.

I download puntano ai repository originali: CeccaStore non ospita gli installer. Librerie e componenti tecnici sono distinti dalle applicazioni installabili.

## Sviluppo locale

Servono Node.js 22.12+ (Node.js 24 consigliato) e npm.

```sh
git clone https://github.com/carellice/CeccaStore.git
cd CeccaStore
npm ci
npm run dev
```

Per generare e provare la build di produzione:

```sh
npm run build
npm run preview
```

La build statica viene scritta in `dist/`. Non serve un backend. Preferiti e tema usano il `localStorage` del browser; lo sblocco con PIN resta solo in memoria e termina ricaricando la pagina.

## GitHub Pages

Il workflow GitHub Actions del repository compila e pubblica il sito su Pages quando viene aggiornato il branch principale. La configurazione tiene conto del percorso `/CeccaStore/`, inclusi immagini e favicon.

La pubblicazione usa i permessi temporanei di GitHub Actions per Pages. Non richiede un token personale né l’accesso ai repository privati durante la build. I metadati sono già nel catalogo versionato.

## Aggiornare la raccolta

Le schede curate sono in [`src/data/catalog.json`](src/data/catalog.json); immagini e screenshot sono in `public/`. Lo script di sincronizzazione conserva descrizioni, categorie, funzionalità, immagini e note curate, aggiornando visibilità, linguaggi, date, versioni e download. I nuovi repository ammessi ricevono `needsCuration: true` e vanno completati prima della pubblicazione.

La sincronizzazione è un’operazione **locale del proprietario**. Installa [GitHub CLI](https://cli.github.com/), accedi come `carellice` con i permessi necessari e poi esegui:

```sh
gh auth login
npm run catalog:sync
npm run build
```

Controlla il diff prima di eseguire commit e push: i metadati aggiunti al repository diventano pubblici. Le credenziali di `gh` restano sul computer e non vengono salvate nel sito. Non inserire un PAT nel workflow Pages per sincronizzare repository privati.

StreamWise, Garage, Health, Since e Subber usano gli APK pubblici di un repository di distribuzione separato, anche se il loro codice è privato. Questi download continuano a funzionare senza mostrare quel repository come scheda. Scarabben ha invece una release privata e richiede un account GitHub autorizzato.

Se una lettura delle release fallisce, lo script conserva i download precedenti e segnala un esito non riuscito. Se repository già presenti scompaiono, interrompe l’aggiornamento prima di sovrascrivere il catalogo: controlla accessi, ridenominazioni o cancellazioni. Per una rimozione intenzionale già verificata:

```sh
npm run catalog:sync -- --allow-removals
```

### Esclusioni permanenti

[`src/data/catalog-policy.json`](src/data/catalog-policy.json) contiene 20 esclusioni come hash SHA-256 in `excludedRepoHashes`. I nomi esclusi non sono elencati in chiaro nel file pubblico. `protectedRepos` identifica il progetto gestito separatamente dall’area con PIN.

La sincronizzazione applica la selezione anche ai repository ritrovati su GitHub, così non reinserisce le schede escluse o protette. Per calcolare l’hash di un nome da aggiungere alle esclusioni, usa il nome esatto del repository, senza proprietario:

```sh
node --input-type=module -e "import { repoHash } from './scripts/sync-catalog.mjs'; console.log(repoHash(process.argv[1]));" nome-repository
```

Aggiungi il risultato a `excludedRepoHashes`, poi aggiorna il catalogo. Per riammettere un progetto, rimuovi il suo hash e sincronizza. La funzione normalizza maiuscole/minuscole e spazi esterni. Gli hash evitano l’elenco diretto dei nomi e non costituiscono una protezione contro chi prova nomi già noti.

## Dati pubblici e area con PIN

Questa raccolta pubblica include **16 schede di progetti con sorgenti privati**, approvate per essere mostrate come parte del portfolio. Sono descrizioni e immagini selezionate: il codice di quei progetti non è incluso e i link GitHub conservano i loro permessi originali. Il filtro “Solo pubblici” riguarda la visibilità dei repository collegati; non nasconde dati dalla build del sito.

FunCouple è conservato in [`src/data/protected-catalog.json`](src/data/protected-catalog.json), con la sua icona incorporata. La scheda e i relativi link diventano disponibili nell’interfaccia dopo lo sblocco dal lucchetto in alto. PIN, chiave e contenuti decifrati non vengono salvati nel browser. Il PIN in chiaro non è presente nei sorgenti.

Il blocco serve alla riservatezza della raccolta, **non equivale ad autenticazione**: un PIN statico a sei cifre può essere provato offline da chi possiede il pacchetto cifrato. Il repository pubblico dell’app e i download su GitHub restano accessibili fuori da CeccaStore.

La sincronizzazione ordinaria non legge né sovrascrive il pacchetto protetto. Per aggiornarlo, usa metadati e immagini locali aggiornati e rigeneralo con `scripts/protect-catalog.mjs`, passando PIN e percorso del file sorgente come JSON tramite stdin. Non salvare il PIN in un file versionato e non aggiungerlo a un workflow.

## Licenza

Il codice dell’interfaccia e gli script originali di CeccaStore sono distribuiti con [licenza MIT](LICENSE). Icone, loghi, screenshot e materiali dei progetti catalogati mantengono i rispettivi diritti e licenze: vedi [ASSETS.md](ASSETS.md). Le licenze dei progetti collegati non vengono modificate da questo repository.

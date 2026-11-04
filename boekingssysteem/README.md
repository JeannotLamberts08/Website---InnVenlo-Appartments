# InnVenlo boekingssysteem

Dit is een eigen boekingssysteem voor InnVenlo Apartments. Boekingslogica, database, agenda en beheeromgeving zijn volledig eigen code. Er is geen extern boekingsplatform nodig om het systeem te laten werken. Externe partijen worden alleen gebruikt als:

- **SMTP-server**: voor het verzenden van e-mail (uw eigen mailprovider of een verzenddienst);
- **iCal-koppeling met Airbnb en Booking.com**: om dubbele boekingen tussen kanalen te voorkomen, zolang u daar ook verhuurt.

## 1. Hoe het in elkaar zit

```
Bezoeker ──► www.innvenlo.nl/boeken.html  (GitHub Pages, statisch, ongewijzigd hostingmodel)
                    │  fetch (HTTPS, CORS alleen voor innvenlo.nl)
                    ▼
            boeken.innvenlo.nl  (uw eigen VPS)
            ├─ Caddy            HTTPS (automatisch certificaat)
            ├─ Node.js-app      API, beheerdashboard (/beheer), e-mail, iCal, planner
            ├─ PostgreSQL 16    alle gegevens; niet bereikbaar van buitenaf
            └─ back-up          dagelijkse dump naar ./backups
```

Waarom een aparte server? GitHub Pages kan alleen statische bestanden serveren en heeft geen database of servercode. De website blijft daarom op GitHub Pages staan, en de boekingsserver draait op een kleine VPS die u zelf huurt (ca. € 5–8 per maand, bijvoorbeeld bij Hetzner, TransIP of DigitalOcean). Alle code en gegevens zijn van u.

### Bescherming tegen dubbele boekingen (drie lagen)

1. **Browser.** De kalender toont bezette nachten en laat alleen geldige periodes kiezen. Vlak vóór het versturen vraagt de pagina een actuele prijs en beschikbaarheid op.
2. **Server.** Binnen één databasetransactie gebeurt het volgende:
   - het appartement wordt vergrendeld (`SELECT … FOR UPDATE`), zodat gelijktijdige aanvragen voor hetzelfde appartement op elkaar wachten;
   - alle regels, boekingen en blokkades worden gecontroleerd;
   - pas daarna wordt de boeking opgeslagen.
3. **Database.** Een `EXCLUDE USING gist`-constraint op `bookings` maakt het onmogelijk om twee actieve boekingen met overlappende nachten in hetzelfde appartement op te slaan, ook buiten de applicatie om. Schoonmaakbuffers tellen daarbij mee.

De test met twintig gelijktijdige pogingen voor hetzelfde tijdslot bevestigt dat er precies één slaagt.

**Kanalen:** Airbnb en Booking.com worden via iCal gesynchroniseerd (zie §5). Een klein restrisico blijft: Airbnb en Booking.com halen uw agenda zelf maar periodiek op. Ontstaat er toch een overlap, dan krijgt u direct een waarschuwingsmail.

### Boekingsproces

1. De gast kiest een appartement, het aantal gasten en de aankomst- en vertrekdatum, en vult daarna zijn gegevens in.
2. De boeking krijgt de status **Nieuw**. De data worden voorlopig vastgehouden.
3. De gast krijgt een mail dat de aanvraag is ontvangen, en u krijgt een melding.
4. U bevestigt of wijst de aanvraag af in het dashboard. De gast krijgt automatisch een bevestiging of afwijzing.
5. Via de persoonlijke link in de mail kan de gast de boeking bekijken en tot 7 dagen voor aankomst kosteloos annuleren. Die termijn is instelbaar.
6. Voor bevestigde boekingen gaat er een herinnering uit, standaard 24 uur voor de inchecktijd. Een tweede herinnering kunt u optioneel instellen.
7. Na vertrek gaat de status automatisch naar **Afgerond**.

Statussen: Nieuw · Bevestigd · Geannuleerd · Afgerond · Niet verschenen.

## 2. Bestanden

**Op de website (repository-root):**

| Bestand | Functie |
|---|---|
| `boeken.html` | Boekingspagina in de huisstijl. Hierin staat ook het serveradres (`<meta name="booking-api">`) |
| `boeken.css` | Opmaak van de boekingsmodule, gebaseerd op de variabelen uit `style.css` |
| `boeken.js` | Kalender, prijs, formulier, bevestiging en "mijn boeking" (NL/EN/DE/FR) |
| `index.html`, `appartementen.html`, `contact.html` | Alleen toegevoegd: menulink "Boeken" en knoppen "Direct boeken" |
| `style.css` | Alleen het mobiele menu is aangepast, zodat vier menu-items passen |
| `_config.yml` | Zorgt dat GitHub Pages de map `boekingssysteem/` niet publiceert |

**Boekingsserver (`boekingssysteem/`):**

| Pad | Functie |
|---|---|
| `src/server.js` | Start van de app: migraties, planner en webserver |
| `src/app.js` | Webserver met beveiligingsheaders, CORS, rate-limits en foutafhandeling |
| `src/config.js` | Configuratie uit `.env` |
| `src/db.js`, `src/migrate.js`, `migrations/*.sql` | Databaseverbinding en databaseschema |
| `src/routes/public.js` | Openbare API: config, beschikbaarheid, prijs, boeken, mijn boeking, iCal-export |
| `src/routes/admin.js` | Beheer-API: login, agenda, boekingen, klanten, blokkades, prijzen, instellingen, kanalen, beheerders, logboek, export |
| `src/services/bookings.js` | Aanmaken, wijzigen, status wijzigen, annuleren en verwijderen van boekingen |
| `src/services/availability.js` | Beschikbaarheid, regels en prijsberekening |
| `src/services/email.js`, `mailtexts.js` | E-mailwachtrij, verzending en teksten in 4 talen |
| `src/services/ical.js` | Import en export van iCal-agenda's |
| `src/services/scheduler.js` | Planner: herinneringen, automatisch afronden, AVG-opschoning, iCal-synchronisatie, e-mailverzending |
| `src/services/auth.js`, `audit.js`, `settings.js` | Login en sessies, logboek, instellingen |
| `src/cli.js` | Opdrachtregel: migreren, beheerder aanmaken, wachtwoord resetten, SMTP testen |
| `admin/` | Beheerdashboard (`/beheer`) |
| `test/booking.test.js` | 30 integratietests |
| `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example` | Installatie op de server |
| `scripts/backup.sh`, `backup-loop.sh`, `restore.sh` | Back-ups maken en terugzetten |

**Databasetabellen:**

| Tabel | Inhoud |
|---|---|
| `units` | Appartementen |
| `guests` | Klanten |
| `bookings` | Boekingen, met status en annuleringsgegevens |
| `blocks` | Geblokkeerde periodes, handmatig of via iCal |
| `rate_periods` | Uitzonderingen per datum: prijs en minimum aantal nachten |
| `settings` | Systeeminstellingen, waaronder openingstijden en voorwaarden |
| `admins`, `sessions` | Beheerders en hun sessies |
| `booking_notes` | Interne notities |
| `audit_log` | Logboek van beheeracties |
| `email_outbox` | E-mailwachtrij |
| `ical_feeds` | iCal-koppelingen |
| `payments` | Voorbereid voor online betalingen (nog niet in gebruik) |

## 3. Installatie (eenmalig, ca. 1 uur)

### Wat u nodig heeft

- Een VPS met Ubuntu 24.04 en minimaal 1 GB RAM. Installeer Docker volgens <https://docs.docker.com/engine/install/ubuntu/>.
- Toegang tot de DNS-instellingen van `innvenlo.nl`, bij de partij waar u het domein heeft gekocht.
- SMTP-gegevens om e-mail te versturen (zie §4).

### Stappen

1. **DNS.** Maak een A-record `boeken` aan dat wijst naar het IP-adres van de VPS. Wacht tot `boeken.innvenlo.nl` naar de server wijst.

2. **Code op de server.**
   ```bash
   git clone https://github.com/JeannotLamberts08/Website---InnVenlo-Appartments.git innvenlo
   cd innvenlo/boekingssysteem
   cp .env.example .env
   nano .env
   ```

3. **`.env` invullen.**
   - `POSTGRES_PASSWORD` en `APP_SECRET`: genereer elk met `openssl rand -hex 32`.
   - De SMTP-gegevens.
   - Het domein, als dat afwijkt van `boeken.innvenlo.nl`.

4. **Starten.**
   ```bash
   docker compose up -d --build
   docker compose logs -f app
   ```
   Stop het meekijken met `Ctrl+C`. Caddy vraagt automatisch het HTTPS-certificaat aan.

5. **Eerste beheerder (eigenaar) aanmaken.**
   ```bash
   docker compose exec app node src/cli.js create-admin jamb.lamberts@ziggo.nl "Jeannot Lamberts" owner
   ```
   Kies een wachtwoord van minimaal 12 tekens.

6. **Inloggen** op <https://boeken.innvenlo.nl/beheer/>. Controleer onder **Instellingen** de prijzen en voorwaarden, en klik op **Testmail versturen**.

7. **Website live zetten.** Merge de branch met de boekingspagina naar de branch die GitHub Pages publiceert. `boeken.html` verwijst al naar `https://boeken.innvenlo.nl`. Gebruikt u een ander domein, pas dan `<meta name="booking-api">` in `boeken.html` aan, en ook `PUBLIC_API_URL` en `CORS_ORIGINS` in `.env`.

   **Merge pas nadat de server draait.** Daarvóór toont de boekingspagina netjes de melding dat online boeken niet beschikbaar is, met links naar Booking.com en contact.

8. **iCal-koppelingen instellen** (zie §5).

### Lokaal testen (optioneel)

Voor ontwikkelaars, met een lokale PostgreSQL:

```bash
npm ci
DATABASE_URL=postgres://… COOKIE_SECURE=false PORT=3100 PUBLIC_SITE_URL=http://localhost:8080 CORS_ORIGINS=http://localhost:8080 npm start
TEST_DATABASE_URL=postgres://…/lege_testdb npm test   # let op: wist die database
```

`boeken.js` gebruikt automatisch `http://localhost:3100` als de site op `localhost` draait.

## 4. E-mail

Het systeem verstuurt e-mail via SMTP. Zonder SMTP-gegevens staat de app in **log-modus**: mails komen wel in de wachtrij, maar worden niet echt verzonden. Het dashboard waarschuwt daarvoor.

Uw instellingen in `.env`:

| Variabele | Betekenis |
|---|---|
| `SMTP_HOST` | SMTP-server |
| `SMTP_PORT` | Poort |
| `SMTP_SECURE` | `true` bij poort 465 (SSL), `false` bij 587 (STARTTLS) |
| `SMTP_USER`, `SMTP_PASS` | Gebruikersnaam en wachtwoord |
| `MAIL_FROM` | Afzender |
| `MAIL_REPLY_TO` | Antwoordadres |

Controleer de verbinding met:

```bash
docker compose exec app node src/cli.js verify-smtp
```

**Bezorgbaarheid.** Mailt u vanaf een server buiten uw eigen provider met een `@ziggo.nl`-afzender, dan kan de mail als spam worden gemarkeerd of worden geweigerd. Dat komt door de SPF/DKIM/DMARC-regels van het afzenderdomein. Het meest betrouwbaar is een afzender op uw eigen domein, bijvoorbeeld `boekingen@innvenlo.nl`. Gebruik daarvoor domeinmail of een verzenddienst, en stel de DNS-records in die de provider opgeeft. Een verzenddienst doet dan alleen de technische verzending. Alle logica en gegevens blijven in uw systeem.

Mislukte verzendingen worden tot 8 keer opnieuw geprobeerd, met steeds langere wachttijd. Per boeking ziet u in het dashboard welke mails zijn verstuurd.

## 5. Airbnb en Booking.com koppelen (iCal)

Doe dit per appartement en per kanaal:

1. Ga in het dashboard naar **Kanalen**, kies het appartement en voeg een koppeling toe ("Airbnb" of "Booking.com").
2. **Importlink.** Zoek in Airbnb of Booking.com bij de agenda- of kalendersynchronisatie van de listing de optie om de agenda te **exporteren**. Kopieer die `.ics`-link en plak hem bij "Importlink". Het systeem haalt deze agenda standaard elke 30 minuten op en blokkeert die nachten op uw website.
3. **Exportlink.** Kopieer de "Exportlink van dit systeem" en voeg die in Airbnb of Booking.com toe als agenda om te **importeren**. Zo ziet dat kanaal uw eigen boekingen en blokkades.

Elke koppeling krijgt een eigen exportlink. Die laat de reserveringen weg die van datzelfde kanaal komen, zodat er geen echo-lussen ontstaan. De export bevat alleen "Bezet"-periodes, nooit namen of andere gegevens.

## 6. Dagelijks gebruik (dashboard)

- **Overzicht.** Open aanvragen, aankomsten en vertrekken, en waarschuwingen (e-mail, iCal).
- **Agenda.** Dag-, week- en maandweergave per appartement:
  - kleuren per status, geblokkeerde periodes grijs, Airbnb/Booking.com blauw;
  - klik op een balk om de boeking te openen;
  - klik op een lege dag om een boeking toe te voegen.
- **Boekingen.** Zoeken en filteren, handmatig toevoegen (bijvoorbeeld een telefonische boeking), wijzigen, de status aanpassen, notities toevoegen en de e-mailhistorie bekijken.
  - **Verwijderen** kan alleen de eigenaar. Een actieve boeking moet eerst worden geannuleerd, en ter bevestiging typt u het boekingsnummer.
- **Beschikbaarheid.**
  - Vakanties, vrije dagen en onderhoud blokkeren. U kunt ook de hele agenda tijdelijk sluiten via Instellingen → "Online boeken ingeschakeld".
  - Uitzonderingen per datum instellen: een afwijkende prijs of een minimum aantal nachten.
- **Instellingen** (alleen eigenaar):
  - minimum en maximum aantal nachten;
  - toegestane aankomst- en vertrekdagen;
  - in- en uitchecktijden;
  - bufferdagen;
  - minimale tijd vooraf en maximale termijn vooruit;
  - annuleringsvoorwaarden in 4 talen;
  - herinneringen;
  - bewaartermijn;
  - het meldingsadres;
  - prijzen per appartement.
- **Beheerders** (alleen eigenaar): accounts toevoegen met de rol Eigenaar of Medewerker, deactiveren en wachtwoorden resetten.
- **Logboek** (alleen eigenaar): wie deed wat en wanneer.

## 7. Beveiliging en privacy (AVG)

**Inloggen en sessies**
- Wachtwoorden worden opgeslagen met argon2id.
- Na 5 mislukte pogingen wordt een account 15 minuten geblokkeerd. Logins zijn ook per IP-adres beperkt.
- Sessiecookies zijn `HttpOnly`, `Secure` en `SameSite=Strict`, en verlopen na 12 uur. Elke wijziging vereist bovendien een CSRF-token.

**Rollen**
- Eigenaar: volledige toegang.
- Medewerker: geen instellingen, beheerders, export of verwijderen.

**Invoer en misbruik**
- Alle invoer wordt op de server gecontroleerd volgens vaste schema's; onbekende velden worden geweigerd.
- Tegen spam: een honeypot-veld, een minimale invultijd, maximaal 5 aanvragen per 15 minuten per IP-adres en maximaal 3 open aanvragen per e-mailadres.

**Afscherming van gegevens**
- Bezoekers zien uitsluitend bezette datums.
- Een gast ziet alleen de eigen boeking, via een geheime link van 256 bits. In de database staat alleen een hash van die link.
- De database is niet bereikbaar van buitenaf.
- IP-adressen worden alleen gehasht opgeslagen.

**Bewaartermijn**
- Persoonsgegevens worden automatisch geanonimiseerd na een instelbare termijn, standaard 24 maanden na het laatste verblijf.
- Verzonden e-mails worden na 90 dagen verwijderd.
- **Controleer met uw boekhouder of gemeente welke termijn voor u verplicht is**, bijvoorbeeld de fiscale bewaarplicht of het nachtregister. Pas de termijn daarop aan.

**Rechten van betrokkenen**
- Onder **Klanten** kunt u alle gegevens van een klant exporteren (inzageverzoek) of direct anonimiseren (verwijderverzoek).

**Logboek**
- Inloggen, wijzigingen aan boekingen, instellingen, blokkades, exports en verwijderingen worden vastgelegd.

**Privacyverklaring**
- Neem in de privacyverklaring van de website op dat u boekingsgegevens verwerkt, met welk doel en hoe lang. Die tekst valt buiten dit systeem.

## 8. Back-ups en onderhoud

**Automatische back-up.** Elke nacht om 03:15 wordt een volledige database-dump gemaakt in `boekingssysteem/backups/`. Dumps ouder dan 30 dagen worden verwijderd; dat is instelbaar met `BACKUP_KEEP_DAYS`.

**Back-up buiten de server.** Een back-up op dezelfde server beschermt niet tegen het verlies van die server. Kopieer `backups/` regelmatig naar een andere locatie, bijvoorbeeld:
- de back-upfunctie van uw VPS-provider;
- `rclone` naar cloudopslag;
- `scp` naar een eigen computer.

**Handmatig een back-up maken:**

```bash
docker compose exec backup bash /scripts/backup.sh
```

**Back-up terugzetten:**

```bash
docker compose exec backup bash /scripts/restore.sh /backups/innvenlo-JJJJMMDD-UUMMSS.dump
docker compose restart app
```

Test het terugzetten eens per kwartaal op een testserver.

**Updates van de code:**

```bash
cd innvenlo && git pull
cd boekingssysteem && docker compose up -d --build
```

Databasemigraties worden bij het starten automatisch uitgevoerd.

**Updates van het systeem.** Installeer maandelijks Ubuntu-updates met `sudo apt update && sudo apt upgrade` en vernieuw de Docker-images met `docker compose pull && docker compose up -d`.

**Logs en status:**

```bash
docker compose logs --tail 200 app
docker compose ps
```

Voor externe controle kunt u een uptime-monitor laten kijken naar `https://boeken.innvenlo.nl/health`.

**Wachtwoord vergeten:**

```bash
docker compose exec app node src/cli.js reset-password jamb.lamberts@ziggo.nl
```

## 9. Later uitbreiden: online betalingen

De datastructuur is hierop voorbereid:
- de tabel `payments`;
- de velden `payment_status` en `amount_paid_cents` bij boekingen.

Een betaalprovider (bijvoorbeeld Mollie voor iDEAL en creditcard) wordt alleen gebruikt voor de transactie. Het werkt dan zo:
1. De boeking wordt eerst aangemaakt zoals nu.
2. Daarna start de betaling (aanbetaling of volledig).
3. Een webhook van de provider zet `payment_status` bij.

De boekingslogica blijft in dit systeem. Bij betaling vooraf ligt het voor de hand om goedkeuring vooraf uit te zetten, of een aanbetaling pas na uw bevestiging te vragen. Dit is nog niet gebouwd. Daarvoor zijn een account bij een betaalprovider en API-sleutels nodig.

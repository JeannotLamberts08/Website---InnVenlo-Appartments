-- InnVenlo boekingssysteem: basisschema
-- Alle datums zijn kalenderdatums (Europe/Amsterdam). Een boeking beslaat de nachten [check_in, check_out).

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE booking_status AS ENUM ('new', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE admin_role AS ENUM ('owner', 'staff');

-- Systeeminstellingen (sleutel/waarde)
CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Boekbare eenheden (appartementen)
CREATE TABLE units (
  id                serial PRIMARY KEY,
  slug              text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name              text NOT NULL,
  max_guests        int  NOT NULL CHECK (max_guests BETWEEN 1 AND 20),
  base_price_cents  int  NOT NULL CHECK (base_price_cents >= 0),
  active            boolean NOT NULL DEFAULT true,
  sort_order        int NOT NULL DEFAULT 0,
  ical_export_token text NOT NULL UNIQUE,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Uitzonderingen per periode: afwijkende prijs en/of minimum aantal nachten
CREATE TABLE rate_periods (
  id           serial PRIMARY KEY,
  unit_id      int NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  start_date   date NOT NULL,
  end_date     date NOT NULL,           -- exclusief
  price_cents  int CHECK (price_cents IS NULL OR price_cents >= 0),
  min_nights   int CHECK (min_nights IS NULL OR min_nights BETWEEN 1 AND 365),
  note         text,
  CHECK (end_date > start_date)
);
CREATE INDEX rate_periods_unit_idx ON rate_periods (unit_id, start_date);

-- Klanten
CREATE TABLE guests (
  id             serial PRIMARY KEY,
  first_name     text,
  last_name      text,
  email          text,
  phone          text,
  language       text NOT NULL DEFAULT 'nl',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  anonymized_at  timestamptz
);
CREATE UNIQUE INDEX guests_email_idx ON guests (lower(email)) WHERE email IS NOT NULL;

-- Boekingen
CREATE TABLE bookings (
  id                 serial PRIMARY KEY,
  reference          text NOT NULL UNIQUE,
  unit_id            int NOT NULL REFERENCES units(id),
  guest_id           int NOT NULL REFERENCES guests(id),
  check_in           date NOT NULL,
  check_out          date NOT NULL,
  buffer_days        int  NOT NULL DEFAULT 0 CHECK (buffer_days BETWEEN 0 AND 14),
  -- bezette periode inclusief schoonmaak-/bufferdagen na vertrek
  occupancy          daterange GENERATED ALWAYS AS (daterange(check_in, check_out + buffer_days, '[)')) STORED,
  guests_count       int  NOT NULL CHECK (guests_count BETWEEN 1 AND 20),
  status             booking_status NOT NULL DEFAULT 'new',
  source             text NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'admin')),
  total_cents        int  NOT NULL CHECK (total_cents >= 0),
  price_breakdown    jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency           text NOT NULL DEFAULT 'EUR',
  payment_status     text NOT NULL DEFAULT 'none' CHECK (payment_status IN ('none', 'pending', 'partial', 'paid', 'refunded')),
  amount_paid_cents  int  NOT NULL DEFAULT 0,
  remarks            text,
  language           text NOT NULL DEFAULT 'nl',
  policy_snapshot    jsonb NOT NULL DEFAULT '{}'::jsonb,
  manage_token_hash  text UNIQUE,
  consent_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  confirmed_at       timestamptz,
  cancelled_at       timestamptz,
  cancelled_by       text CHECK (cancelled_by IN ('guest', 'host')),
  cancel_reason      text,
  reminder1_sent_at  timestamptz,
  reminder2_sent_at  timestamptz,
  CHECK (check_out > check_in),
  -- KERN van de dubbele-boekingsbescherming: de database weigert overlappende actieve boekingen per appartement,
  -- ook bij gelijktijdige transacties.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (unit_id WITH =, occupancy WITH &&)
    WHERE (status IN ('new', 'confirmed', 'completed'))
);
CREATE INDEX bookings_dates_idx ON bookings (check_in, check_out);
CREATE INDEX bookings_status_idx ON bookings (status);
CREATE INDEX bookings_guest_idx ON bookings (guest_id);

-- iCal-koppelingen met externe kanalen (Airbnb, Booking.com)
CREATE TABLE ical_feeds (
  id             serial PRIMARY KEY,
  unit_id        int NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name           text NOT NULL,
  import_url     text,
  export_token   text NOT NULL UNIQUE,
  active         boolean NOT NULL DEFAULT true,
  last_sync_at   timestamptz,
  last_status    text,
  last_error     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Geblokkeerde periodes: vakantie, onderhoud, eigen gebruik, of geïmporteerd uit iCal
CREATE TABLE blocks (
  id            serial PRIMARY KEY,
  unit_id       int NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  start_date    date NOT NULL,
  end_date      date NOT NULL,          -- exclusief
  reason        text,
  source        text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ical')),
  feed_id       int REFERENCES ical_feeds(id) ON DELETE CASCADE,
  external_uid  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  CHECK ((source = 'ical') = (feed_id IS NOT NULL))
);
CREATE INDEX blocks_unit_idx ON blocks USING gist (unit_id, daterange(start_date, end_date, '[)'));

-- Beheerders
CREATE TABLE admins (
  id               serial PRIMARY KEY,
  email            text NOT NULL,
  name             text NOT NULL,
  password_hash    text NOT NULL,
  role             admin_role NOT NULL DEFAULT 'staff',
  active           boolean NOT NULL DEFAULT true,
  failed_attempts  int NOT NULL DEFAULT 0,
  locked_until     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX admins_email_idx ON admins (lower(email));

CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  admin_id    int NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  csrf_token  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  ip          text,
  user_agent  text
);
CREATE INDEX sessions_admin_idx ON sessions (admin_id);

-- Interne notities bij boekingen
CREATE TABLE booking_notes (
  id          serial PRIMARY KEY,
  booking_id  int NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  admin_id    int REFERENCES admins(id) ON DELETE SET NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Logboek van beheeracties
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  admin_id    int REFERENCES admins(id) ON DELETE SET NULL,
  actor       text NOT NULL,
  action      text NOT NULL,
  entity      text,
  entity_id   text,
  details     jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);

-- Uitgaande e-mail (wachtrij; wordt in dezelfde transactie als de boeking aangemaakt)
CREATE TABLE email_outbox (
  id          bigserial PRIMARY KEY,
  booking_id  int REFERENCES bookings(id) ON DELETE SET NULL,
  kind        text NOT NULL,
  to_address  text NOT NULL,
  subject     text NOT NULL,
  body_text   text NOT NULL,
  body_html   text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts    int NOT NULL DEFAULT 0,
  last_error  text,
  send_after  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_outbox_pending_idx ON email_outbox (send_after) WHERE status = 'pending';

-- Voorbereid voor online betalingen (nog niet in gebruik)
CREATE TABLE payments (
  id             serial PRIMARY KEY,
  booking_id     int NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider       text NOT NULL,
  provider_ref   text,
  kind           text NOT NULL DEFAULT 'full' CHECK (kind IN ('deposit', 'full', 'refund')),
  amount_cents   int NOT NULL,
  status         text NOT NULL DEFAULT 'open',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

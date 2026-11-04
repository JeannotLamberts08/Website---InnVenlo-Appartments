-- Startgegevens: de twee boekbare eenheden. Prijs en capaciteit zijn later aan te passen in het dashboard.
INSERT INTO units (slug, name, max_guests, base_price_cents, sort_order, ical_export_token) VALUES
  ('one-bedroom',   'One-Bedroom Apartment', 3, 14000, 1, replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  ('deluxe-double', 'Deluxe Double Room',    3, 14000, 2, replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
ON CONFLICT (slug) DO NOTHING;

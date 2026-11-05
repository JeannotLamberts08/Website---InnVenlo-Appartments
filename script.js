// InnVenlo Apartments – taalkeuze (NL/EN/DE/FR) en fotoslider.
// Nederlands staat in de HTML zelf; hieronder alleen de vertalingen.
(() => {
  'use strict';

  const T = {
    en: {
      titleHome: 'Apartment rental in Venlo | InnVenlo Apartments',
      home: 'Home', apartments: 'Apartments', contact: 'Contact',
      homeTitle: 'Apartment rental in Venlo',
      homeIntro: 'Stay in Venlo in a spacious, comfortable short stay apartment with a private entrance, kitchen and free WiFi.',
      view: 'View the apartments',
      about: 'Stay in Venlo, in a prime location',
      aboutP1: 'Venlo lies on the river Maas, close to the German border, and is a pleasant base for tourists and business travellers alike. At InnVenlo Apartments you stay in your own apartment instead of a standard hotel room. Ideal for a weekend away, a working week or a longer stay.',
      aboutP2: 'Toverland theme park is about 20 km and Borussia-Park in Mönchengladbach about 34 km from the property.',
      why: 'Why choose InnVenlo Apartments?',
      own: 'Private entrance', ownText: 'Come and go whenever suits you, with complete privacy.',
      kitchen: 'Full kitchen', kitchenText: 'Hob, fridge, dishwasher and tableware. Ideal for a short stay in Venlo.',
      wifi: 'Free WiFi', wifiText: 'Fast internet for work, streaming and planning your route.',
      city: 'City view', cityText: 'Wake up quietly with a view over Venlo and your own coffee machine.',
      our: 'Our apartments in Venlo',
      oneBedroomShort: 'One-Bedroom Apartment',
      idxOneDesc: 'Spacious apartment with a separate living room, separate bedroom and a bathroom with bath. Parquet floor, seating area with flat-screen TV, private entrance and city view. 2 beds.',
      tagLiving: 'Living room', tagBedroom: 'Bedroom', tagKitchen: 'Kitchen', tagBath: 'Bath',
      bookDirect: 'Book direct', bookShort: 'Book',
      bookBooking: 'Check availability on Booking.com', bookAirbnb: 'Book now on Airbnb',
      deluxeShort: 'Deluxe Double Room',
      idxDeluxeDesc: 'Spacious room with private entrance, coffee machine, dining area, sofa and flat-screen TV. Private bathroom with bath and shower and access to a well-equipped kitchen. 2 beds.',
      dining: 'Dining area', couch: 'Sofa', tagBathShower: 'Bath and shower',
      moreFeatures: 'View all features →',
      reviews: 'What our guests say',
      reviewsIntro: 'Read the experiences of previous guests on the platforms where you can book.',
      reviewsBooking: 'Reviews on Booking.com', reviewsAirbnb: 'Reviews on Airbnb', reviewsGoogle: 'Reviews on Google',
      short: 'Short stay in Venlo: for every kind of stay',
      shortText: 'Looking for a holiday home in Venlo for a short break, or an apartment for a business trip? Our apartments combine the convenience of a hotel with the space and freedom of your own home. Book easily and securely via Booking.com or Airbnb.',
      footerTag: 'Apartment rental in Venlo, Limburg',
      footerRights: '© 2026 InnVenlo Apartments. All rights reserved.',
      titleApartments: 'Apartments for rent in Venlo | InnVenlo Apartments',
      apartmentsTitle: 'Apartments in Venlo',
      apartmentsIntro: 'Choose your short stay apartment in Venlo. Both have a private entrance, coffee machine, flat-screen TV, free WiFi and city view. The centre is within walking distance. Toverland theme park is about 20 km away.',
      oneBedroom: 'One-Bedroom Apartment',
      aptOneDesc: 'A spacious apartment with a separate living room and a separate bedroom. Cook in the well-equipped kitchen and relax in the seating area with flat-screen TV, overlooking Venlo.',
      beds: 'Beds', twoBeds: '2 beds', rooms: 'Rooms', roomsOne: '1 living room, 1 bedroom',
      bathroom: 'Bathroom', bathOne: '1, with bath and free toiletries',
      floor: 'Floor', floorParquet: 'Parquet', facilities: 'Facilities', moreInfo: 'Details and facilities',
      hob: 'Hob', fridge: 'Fridge', dishwasher: 'Dishwasher', utensils: 'Kitchenware',
      coffeeMachine: 'Coffee machine', tv: 'Flat-screen TV',
      alsoVia: 'Also available on',
      deluxe: 'Deluxe Double Room',
      aptDeluxeDesc: 'A spacious room with private entrance, dining area and sofa. Ideal for a short city trip or business stay in Venlo, with access to a well-equipped kitchen.',
      roomsDeluxe: '1 room with seating and dining area', bathDeluxe: '1, with bath and shower', floorCarpet: 'Carpet',
      questionStay: 'Questions about your stay in Venlo?',
      contactUs: 'Feel free to contact us for information about the apartments.',
      contactButton: 'Get in touch',
      titleContact: 'Contact | InnVenlo Apartments Venlo',
      contactTitle: 'Contact InnVenlo Apartments',
      contactIntro: 'Questions about staying in Venlo or about our apartments? Send us a message or view the location on Google Maps.',
      address: 'Address and details', region: 'Limburg, the Netherlands',
      phone: 'Phone', emailLabel: 'Email', map: 'View on Google Maps',
      directBooking: 'Want to book? View the apartments and book via Booking.com or Airbnb.',
      message: 'Send a message', name: 'Name', email: 'Email address', yourMessage: 'Your message', send: 'Send message',
      mainMenu: 'Main menu', chooseLanguage: 'Choose language', footerMenu: 'Footer menu', callUs: 'Call us'
    },
    de: {
      titleHome: 'Ferienwohnung mieten in Venlo | InnVenlo Apartments',
      home: 'Start', apartments: 'Apartments', contact: 'Kontakt',
      homeTitle: 'Apartment mieten in Venlo',
      homeIntro: 'Übernachten in Venlo in einem geräumigen, komfortablen Short-Stay-Apartment mit eigenem Eingang, Küche und kostenlosem WLAN.',
      view: 'Apartments ansehen',
      about: 'Übernachten in Venlo, in bester Lage',
      aboutP1: 'Venlo liegt an der Maas, direkt an der deutschen Grenze, und ist ein angenehmer Ausgangspunkt für Touristen und Geschäftsreisende. Bei InnVenlo Apartments wohnen Sie in einem eigenen Apartment statt in einem gewöhnlichen Hotelzimmer. Ideal für ein Wochenende, eine Arbeitswoche oder einen längeren Aufenthalt.',
      aboutP2: 'Der Freizeitpark Toverland liegt etwa 20 km und der Borussia-Park in Mönchengladbach etwa 34 km von der Unterkunft entfernt.',
      why: 'Warum InnVenlo Apartments?',
      own: 'Eigener Eingang', ownText: 'Kommen und gehen Sie, wann Sie möchten, mit voller Privatsphäre.',
      kitchen: 'Voll ausgestattete Küche', kitchenText: 'Kochfeld, Kühlschrank, Geschirrspüler und Geschirr. Ideal für einen Kurzaufenthalt in Venlo.',
      wifi: 'Kostenloses WLAN', wifiText: 'Schnelles Internet für Arbeit, Streaming und Routenplanung.',
      city: 'Stadtblick', cityText: 'Ruhig aufwachen mit Blick über Venlo und eigener Kaffeemaschine.',
      our: 'Unsere Apartments in Venlo',
      oneBedroomShort: 'One-Bedroom Apartment',
      idxOneDesc: 'Geräumiges Apartment mit separatem Wohnzimmer, separatem Schlafzimmer und Badezimmer mit Badewanne. Parkettboden, Sitzecke mit Flachbild-TV, eigener Eingang und Stadtblick. 2 Betten.',
      tagLiving: 'Wohnzimmer', tagBedroom: 'Schlafzimmer', tagKitchen: 'Küche', tagBath: 'Badewanne',
      bookDirect: 'Direkt buchen', bookShort: 'Buchen',
      bookBooking: 'Verfügbarkeit auf Booking.com prüfen', bookAirbnb: 'Jetzt über Airbnb buchen',
      deluxeShort: 'Deluxe Double Room',
      idxDeluxeDesc: 'Geräumiges Zimmer mit eigenem Eingang, Kaffeemaschine, Essbereich, Sofa und Flachbild-TV. Eigenes Bad mit Badewanne und Dusche sowie Zugang zu einer gut ausgestatteten Küche. 2 Betten.',
      dining: 'Essbereich', couch: 'Sofa', tagBathShower: 'Badewanne und Dusche',
      moreFeatures: 'Alle Merkmale ansehen →',
      reviews: 'Was unsere Gäste sagen',
      reviewsIntro: 'Lesen Sie die Erfahrungen früherer Gäste auf den Plattformen, auf denen Sie buchen können.',
      reviewsBooking: 'Bewertungen auf Booking.com', reviewsAirbnb: 'Bewertungen auf Airbnb', reviewsGoogle: 'Bewertungen auf Google',
      short: 'Short Stay in Venlo: für jeden Aufenthalt',
      shortText: 'Sie suchen eine Ferienwohnung in Venlo für einen Kurzurlaub oder ein Apartment für eine Geschäftsreise? Unsere Apartments verbinden den Komfort eines Hotels mit dem Platz und der Freiheit einer eigenen Wohnung. Buchen Sie einfach und sicher über Booking.com oder Airbnb.',
      footerTag: 'Apartment mieten in Venlo, Limburg',
      footerRights: '© 2026 InnVenlo Apartments. Alle Rechte vorbehalten.',
      titleApartments: 'Apartments in Venlo mieten | InnVenlo Apartments',
      apartmentsTitle: 'Apartments in Venlo',
      apartmentsIntro: 'Wählen Sie Ihr Short-Stay-Apartment in Venlo. Beide Unterkünfte haben einen eigenen Eingang, Kaffeemaschine, Flachbild-TV, kostenloses WLAN und Stadtblick. Das Zentrum ist zu Fuß erreichbar. Der Freizeitpark Toverland liegt etwa 20 km entfernt.',
      oneBedroom: 'One-Bedroom Apartment',
      aptOneDesc: 'Ein geräumiges Apartment mit separatem Wohnzimmer und separatem Schlafzimmer. Sie kochen in der gut ausgestatteten Küche und entspannen in der Sitzecke mit Flachbild-TV und Blick über Venlo.',
      beds: 'Schlafplätze', twoBeds: '2 Betten', rooms: 'Zimmer', roomsOne: '1 Wohnzimmer, 1 Schlafzimmer',
      bathroom: 'Badezimmer', bathOne: '1, mit Badewanne und kostenlosen Pflegeprodukten',
      floor: 'Boden', floorParquet: 'Parkett', facilities: 'Ausstattung', moreInfo: 'Details und Ausstattung',
      hob: 'Kochfeld', fridge: 'Kühlschrank', dishwasher: 'Geschirrspüler', utensils: 'Küchenutensilien',
      coffeeMachine: 'Kaffeemaschine', tv: 'Flachbild-TV',
      alsoVia: 'Auch verfügbar über',
      deluxe: 'Deluxe Double Room',
      aptDeluxeDesc: 'Ein geräumiges Zimmer mit eigenem Eingang, Essbereich und Sofa. Ideal für einen kurzen Städtetrip oder Geschäftsaufenthalt in Venlo, mit Zugang zu einer gut ausgestatteten Küche.',
      roomsDeluxe: '1 Zimmer mit Sitz- und Essbereich', bathDeluxe: '1, mit Badewanne und Dusche', floorCarpet: 'Teppichboden',
      questionStay: 'Fragen zu Ihrem Aufenthalt in Venlo?',
      contactUs: 'Kontaktieren Sie uns gern für Informationen über die Apartments.',
      contactButton: 'Kontakt aufnehmen',
      titleContact: 'Kontakt | InnVenlo Apartments Venlo',
      contactTitle: 'Kontakt zu InnVenlo Apartments',
      contactIntro: 'Fragen zur Übernachtung in Venlo oder zu unseren Apartments? Schreiben Sie uns oder sehen Sie sich die Lage auf Google Maps an.',
      address: 'Adresse und Daten', region: 'Limburg, Niederlande',
      phone: 'Telefon', emailLabel: 'E-Mail', map: 'Auf Google Maps ansehen',
      directBooking: 'Direkt buchen? Sehen Sie sich die Apartments an und buchen Sie über Booking.com oder Airbnb.',
      message: 'Nachricht senden', name: 'Name', email: 'E-Mail-Adresse', yourMessage: 'Ihre Nachricht', send: 'Nachricht senden',
      mainMenu: 'Hauptmenü', chooseLanguage: 'Sprache wählen', footerMenu: 'Fußzeilenmenü', callUs: 'Rufen Sie uns an'
    },
    fr: {
      titleHome: 'Location d’appartement à Venlo | InnVenlo Apartments',
      home: 'Accueil', apartments: 'Appartements', contact: 'Contact',
      homeTitle: 'Location d’appartement à Venlo',
      homeIntro: 'Séjournez à Venlo dans un appartement short stay spacieux et confortable, avec entrée privée, cuisine et WiFi gratuit.',
      view: 'Voir les appartements',
      about: 'Séjourner à Venlo, dans un emplacement idéal',
      aboutP1: 'Venlo se trouve au bord de la Meuse, tout près de la frontière allemande, et constitue une base agréable pour les touristes comme pour les voyageurs d’affaires. Chez InnVenlo Apartments, vous logez dans votre propre appartement plutôt que dans une chambre d’hôtel classique. Idéal pour un week-end, une semaine de travail ou un séjour plus long.',
      aboutP2: 'Le parc d’attractions Toverland se trouve à environ 20 km et le Borussia-Park de Mönchengladbach à environ 34 km de l’hébergement.',
      why: 'Pourquoi choisir InnVenlo Apartments ?',
      own: 'Entrée privée', ownText: 'Allez et venez quand vous le souhaitez, en toute intimité.',
      kitchen: 'Cuisine complète', kitchenText: 'Plaque de cuisson, réfrigérateur, lave-vaisselle et vaisselle. Idéal pour un court séjour à Venlo.',
      wifi: 'WiFi gratuit', wifiText: 'Internet rapide pour travailler, regarder des séries et planifier vos trajets.',
      city: 'Vue sur la ville', cityText: 'Réveillez-vous au calme avec vue sur Venlo et votre propre machine à café.',
      our: 'Nos appartements à Venlo',
      oneBedroomShort: 'One-Bedroom Apartment',
      idxOneDesc: 'Appartement spacieux avec salon séparé, chambre séparée et salle de bains avec baignoire. Parquet, coin salon avec télévision à écran plat, entrée privée et vue sur la ville. 2 lits.',
      tagLiving: 'Salon', tagBedroom: 'Chambre', tagKitchen: 'Cuisine', tagBath: 'Baignoire',
      bookDirect: 'Réserver en direct', bookShort: 'Réserver',
      bookBooking: 'Voir les disponibilités sur Booking.com', bookAirbnb: 'Réserver sur Airbnb',
      deluxeShort: 'Deluxe Double Room',
      idxDeluxeDesc: 'Chambre spacieuse avec entrée privée, machine à café, coin repas, canapé et télévision à écran plat. Salle de bains privée avec baignoire et douche, et accès à une cuisine bien équipée. 2 lits.',
      dining: 'Coin repas', couch: 'Canapé', tagBathShower: 'Baignoire et douche',
      moreFeatures: 'Voir toutes les caractéristiques →',
      reviews: 'Ce que disent nos clients',
      reviewsIntro: 'Découvrez l’avis des clients précédents sur les plateformes où vous pouvez réserver.',
      reviewsBooking: 'Avis sur Booking.com', reviewsAirbnb: 'Avis sur Airbnb', reviewsGoogle: 'Avis sur Google',
      short: 'Short stay à Venlo : pour chaque séjour',
      shortText: 'Vous cherchez une location de vacances à Venlo pour une courte escapade, ou un appartement pour un séjour professionnel ? Nos appartements allient le confort d’un hôtel à l’espace et à la liberté d’un logement à vous. Réservez facilement et en toute sécurité via Booking.com ou Airbnb.',
      footerTag: 'Location d’appartement à Venlo, Limbourg',
      footerRights: '© 2026 InnVenlo Apartments. Tous droits réservés.',
      titleApartments: 'Appartements à louer à Venlo | InnVenlo Apartments',
      apartmentsTitle: 'Appartements à Venlo',
      apartmentsIntro: 'Choisissez votre appartement short stay à Venlo. Les deux logements disposent d’une entrée privée, d’une machine à café, d’une télévision à écran plat, du WiFi gratuit et d’une vue sur la ville. Le centre est accessible à pied. Le parc d’attractions Toverland est à environ 20 km.',
      oneBedroom: 'One-Bedroom Apartment',
      aptOneDesc: 'Un appartement spacieux avec un salon séparé et une chambre séparée. Cuisinez dans la cuisine bien équipée et détendez-vous dans le coin salon avec télévision à écran plat, avec vue sur Venlo.',
      beds: 'Couchages', twoBeds: '2 lits', rooms: 'Pièces', roomsOne: '1 salon, 1 chambre',
      bathroom: 'Salle de bains', bathOne: '1, avec baignoire et articles de toilette gratuits',
      floor: 'Sol', floorParquet: 'Parquet', facilities: 'Équipements', moreInfo: 'Détails et équipements',
      hob: 'Plaque de cuisson', fridge: 'Réfrigérateur', dishwasher: 'Lave-vaisselle', utensils: 'Ustensiles de cuisine',
      coffeeMachine: 'Machine à café', tv: 'Télévision à écran plat',
      alsoVia: 'Également disponible sur',
      deluxe: 'Deluxe Double Room',
      aptDeluxeDesc: 'Une chambre spacieuse avec entrée privée, coin repas et canapé. Idéale pour un court city-trip ou un séjour professionnel à Venlo, avec accès à une cuisine bien équipée.',
      roomsDeluxe: '1 pièce avec coin salon et coin repas', bathDeluxe: '1, avec baignoire et douche', floorCarpet: 'Moquette',
      questionStay: 'Des questions sur votre séjour à Venlo ?',
      contactUs: 'N’hésitez pas à nous contacter pour toute information sur les appartements.',
      contactButton: 'Nous contacter',
      titleContact: 'Contact | InnVenlo Apartments Venlo',
      contactTitle: 'Contacter InnVenlo Apartments',
      contactIntro: 'Des questions sur un séjour à Venlo ou sur nos appartements ? Envoyez-nous un message ou consultez l’emplacement sur Google Maps.',
      address: 'Adresse et coordonnées', region: 'Limbourg, Pays-Bas',
      phone: 'Téléphone', emailLabel: 'E-mail', map: 'Voir sur Google Maps',
      directBooking: 'Envie de réserver ? Découvrez les appartements et réservez via Booking.com ou Airbnb.',
      message: 'Envoyer un message', name: 'Nom', email: 'Adresse e-mail', yourMessage: 'Votre message', send: 'Envoyer le message',
      mainMenu: 'Menu principal', chooseLanguage: 'Choisir la langue', footerMenu: 'Menu du pied de page', callUs: 'Appelez-nous'
    }
  };
  const LANGS = ['nl', 'en', 'de', 'fr'];

  // ---------- Vertalen ----------
  const textEls = [...document.querySelectorAll('[data-i18n]')];
  const ariaEls = [...document.querySelectorAll('[data-i18n-aria]')];
  // Bewaar de Nederlandse tekst uit de HTML zodat we terug kunnen naar NL
  textEls.forEach((el) => { el.dataset.nl = el.textContent; });
  ariaEls.forEach((el) => { el.dataset.nlAria = el.getAttribute('aria-label') || ''; });

  const store = {
    get() { try { return localStorage.getItem('lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('lang', v); } catch { /* privémodus */ } }
  };

  function applyLang(lang) {
    if (!LANGS.includes(lang)) lang = 'nl';
    const dict = T[lang] || {};
    textEls.forEach((el) => { el.textContent = lang === 'nl' ? el.dataset.nl : (dict[el.dataset.i18n] ?? el.dataset.nl); });
    ariaEls.forEach((el) => { el.setAttribute('aria-label', lang === 'nl' ? el.dataset.nlAria : (dict[el.dataset.i18nAria] ?? el.dataset.nlAria)); });
    document.documentElement.lang = lang;
    document.querySelectorAll('.current-language').forEach((el) => { el.textContent = lang.toUpperCase(); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  }

  // ---------- Taalmenu ----------
  document.querySelectorAll('.language-switch').forEach((sw) => {
    const toggle = sw.querySelector('.language-current');
    const setOpen = (open) => { sw.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!sw.classList.contains('open')); });
    sw.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
      applyLang(b.dataset.lang); store.set(b.dataset.lang); setOpen(false); toggle.focus();
    }));
    document.addEventListener('click', (e) => { if (!sw.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sw.classList.contains('open')) { setOpen(false); toggle.focus(); } });
  });

  // Startaal: eerder gekozen taal, anders browsertaal, anders Nederlands
  const saved = store.get();
  const browser = (navigator.language || 'nl').slice(0, 2).toLowerCase();
  const start = LANGS.includes(saved) ? saved : (LANGS.includes(browser) ? browser : 'nl');
  applyLang(start);

  // ---------- Uitklapbare details: op computer altijd open, op telefoon dicht ----------
  const wide = window.matchMedia('(min-width: 781px)');
  const syncDetails = () => document.querySelectorAll('details.more-info').forEach((d) => { d.open = wide.matches; });
  syncDetails(); wide.addEventListener('change', syncDetails);

  // ---------- Fotoslider ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const imgs = [...slider.querySelectorAll('img')];
    if (imgs.length < 2) return;
    let i = Math.max(0, imgs.findIndex((img) => img.classList.contains('active')));
    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(slider);
    }
    const go = (n) => {
      imgs[i].classList.remove('active');
      i = (n + imgs.length) % imgs.length;
      const img = imgs[i];
      if (img.loading === 'lazy') img.loading = 'eager';
      img.classList.add('active');
      // Volgende foto alvast laden
      const next = imgs[(i + 1) % imgs.length]; if (next.loading === 'lazy') next.loading = 'eager';
    };
    // ---------- Swipen (touch en muis) ----------
    let last = 0;                       // tijdstip laatste interactie: automatische overgang wacht even
    let drag = null;                    // { x, y, t, dx, locked, nb }
    const W = () => slider.clientWidth;
    imgs.forEach((img) => { img.draggable = false; });
    const neighbour = (dir) => imgs[(i + dir + imgs.length) % imgs.length];
    const clear = (el) => { el.style.transform = ''; el.style.opacity = ''; el.classList.remove('swipe-anim'); };

    slider.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || slider.classList.contains('animating')) return;
      drag = { x: e.clientX, y: e.clientY, t: Date.now(), dx: 0, locked: false, nb: null };
    });
    slider.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }   // verticaal: gewoon scrollen
        drag.locked = true; slider.classList.add('dragging');
        try { slider.setPointerCapture(e.pointerId); } catch { /* oudere browsers */ }
      }
      drag.dx = dx;
      const dir = dx < 0 ? 1 : -1;
      const nb = neighbour(dir);
      if (drag.nb && drag.nb !== nb) clear(drag.nb);
      drag.nb = nb;
      if (nb.loading === 'lazy') nb.loading = 'eager';
      imgs[i].style.transform = `translateX(${dx}px)`;
      nb.style.opacity = '1';
      nb.style.transform = `translateX(${dx + dir * W()}px)`;
    });
    const end = () => {
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.locked) { last = Date.now(); go(i + 1); return; }      // tik = volgende foto
      slider.classList.remove('dragging');
      const cur = imgs[i], nb = d.nb, w = W();
      const fast = Math.abs(d.dx) / Math.max(1, Date.now() - d.t) > 0.5;
      const commit = nb && (Math.abs(d.dx) > w * 0.2 || fast);
      const dir = d.dx < 0 ? 1 : -1;
      slider.classList.add('animating');
      [cur, nb].forEach((el) => el && el.classList.add('swipe-anim'));
      requestAnimationFrame(() => {
        cur.style.transform = commit ? `translateX(${-dir * w}px)` : 'translateX(0)';
        if (nb) nb.style.transform = commit ? 'translateX(0)' : `translateX(${dir * w}px)`;
      });
      setTimeout(() => {
        slider.classList.add('instant');
        if (commit) {
          cur.classList.remove('active'); nb.classList.add('active');
          i = imgs.indexOf(nb);
          const next = neighbour(1); if (next.loading === 'lazy') next.loading = 'eager';
        }
        clear(cur); if (nb) clear(nb);
        requestAnimationFrame(() => requestAnimationFrame(() => slider.classList.remove('instant', 'animating')));
      }, 360);
      last = Date.now();
    };
    slider.addEventListener('pointerup', end);
    slider.addEventListener('pointercancel', () => { if (!drag) return; if (!drag.locked) { drag = null; return; } drag.dx = 0; end(); });
    // Sleep met de muis mag geen klik op een link of tekstselectie veroorzaken
    slider.addEventListener('click', (e) => e.preventDefault());

    if (!reduceMotion) setInterval(() => { if (visible && !document.hidden && Date.now() - last > 6000 && !drag) go(i + 1); }, 5000);
  });
})();

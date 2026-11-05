// InnVenlo Apartments – taalkeuze (NL/EN/DE/FR) en fotoslider.
// Nederlands staat in de HTML zelf; hieronder alleen de vertalingen.
(() => {
  'use strict';

  const T = {
    en: {
      titleHome: 'Stay in Venlo city centre | Private apartment – InnVenlo',
      home: 'Home', apartments: 'Apartments', contact: 'Contact',
      homeTitle: 'Stay in the heart of Venlo', homeTitleA: 'Stay in the', homeTitleB: 'heart of Venlo',
      homeIntro: 'In your own apartment, with a private entrance, kitchen and free WiFi. Everything within walking distance.',
      view: 'View the apartments',
      about: 'In the very centre of Venlo, on the Maas – for every stay',
      aboutP1: 'Venlo, on the river Maas and close to the German border, is the ideal base for a weekend away, a business stay or a longer visit. At InnVenlo Apartments you enjoy the comfort of a hotel, combined with the space, privacy and freedom of your own apartment.',
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
      rev1: '“Incredibly spacious apartment; it feels like coming home. A very pleasant, central location.”',
      rev2: '“Beautiful apartment in a special and very central location.”',
      rev3: '“By far the most beautiful and complete apartment we have ever stayed in. The location is super central; everything is just a few steps away, and inside you find an oasis of calm.”',
      rev4: '“Stunning apartment in a prime location in the heart of Venlo. Spotlessly clean, wonderfully spacious and nicely furnished.”',
      rev5: '“Really lovely, beautiful and spacious apartment, very close to everything”',
      msgSent: 'Thank you! Your message has been sent. We will reply as soon as possible.',
      faqTitle: 'Frequently asked questions',
      faqQ1: 'What are the check-in and check-out times?', faqA1: 'Check-in is from 2:00 pm, check-out until 11:00 am. Want to arrive earlier or leave later? Please arrange the time with us in advance.',
      faqQ2: 'Can I park at the apartment?', faqA2: 'There is no private parking. You can park (paid) in a public car park within walking distance, such as Q-Park Arsenaal, Q-Park Maasboulevard or Q-Park Nolensplein.',
      faqQ3: 'How far is it to the centre and the station?', faqA3: 'Shops, restaurants and the river Maas are within walking distance. Venlo station is about a 10-minute walk.',
      faqQ4: 'How many guests can stay?', faqA4: 'Both apartments have 2 beds and are suitable for 2 guests.',
      faqQ5: 'Are pets allowed?', faqA5: 'Pets are generally not allowed. If you have a special situation, please contact us in advance.',
      faqQ6: 'What is the minimum stay?', faqA6: 'You can usually book from 1 night. A 2-night minimum may apply during busy periods.',
      faqQ7: 'What does the apartment include?', faqA7: 'A private entrance, kitchen with hob, fridge and dishwasher, coffee machine, flat-screen TV and free WiFi.',
      faqQ8: 'How can I book direct?', faqA8: 'Choose your apartment and dates on the booking page and send a request. You will receive a confirmation by email within 24 hours. You can also book via Booking.com or Airbnb.',
      distToverland: 'Toverland theme park', distBorussia: 'Borussia-Park, Mönchengladbach',
      aboutP3: 'Whether you come for a short holiday, a working week or a longer stay: our fully furnished apartments offer everything for a pleasant stay in Venlo.', bookLead: 'Book easily and securely via:', bookLeadA: 'Book easily and securely', bookLeadB: 'via:', bookNow: 'Book direct', orVia: 'or via', orWord: 'or',
      mainMenu: 'Main menu', chooseLanguage: 'Choose language', footerMenu: 'Footer menu', callUs: 'Call us'
    },
    de: {
      titleHome: 'Ferienwohnung in Venlo Zentrum | Übernachten – InnVenlo',
      home: 'Start', apartments: 'Apartments', contact: 'Kontakt',
      homeTitle: 'Übernachten im Zentrum von Venlo', homeTitleA: 'Übernachten im', homeTitleB: 'Zentrum von Venlo',
      homeIntro: 'In Ihrer eigenen Ferienwohnung, mit eigenem Eingang, Küche und kostenlosem WLAN. Alles zu Fuß erreichbar.',
      view: 'Apartments ansehen',
      about: 'Mitten im Zentrum von Venlo, an der Maas – für jeden Aufenthalt',
      aboutP1: 'Venlo liegt an der Maas, direkt an der deutschen Grenze, und ist der ideale Ausgangspunkt für ein Wochenende, eine Geschäftsreise oder einen längeren Aufenthalt. Bei InnVenlo Apartments genießen Sie den Komfort eines Hotels, kombiniert mit dem Platz, der Privatsphäre und der Freiheit einer eigenen Wohnung.',
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
      rev1: '„Unglaublich geräumige Wohnung; es fühlt sich an wie nach Hause kommen. Sehr angenehme, zentrale Lage.“',
      rev2: '„Wunderschöne Wohnung in einer besonderen und sehr zentralen Lage.“',
      rev3: '„Mit Abstand die schönste und vollständigste Wohnung, in der wir je übernachtet haben. Die Lage ist super zentral, alles ist nur ein paar Schritte entfernt, und drinnen erlebt man eine Oase der Ruhe.“',
      rev4: '„Wahnsinnig schöne Wohnung in Top-Lage mitten in Venlo. Super sauber, herrlich geräumig und schön eingerichtet.“',
      rev5: '„Super schöne, hübsche und geräumige Wohnung, ganz nah an allem“',
      msgSent: 'Vielen Dank! Ihre Nachricht wurde gesendet. Wir antworten so schnell wie möglich.',
      faqTitle: 'Häufige Fragen',
      faqQ1: 'Wann ist Check-in und Check-out?', faqA1: 'Check-in ab 14:00 Uhr, Check-out bis 11:00 Uhr. Sie möchten früher anreisen oder später abreisen? Bitte stimmen Sie die Uhrzeit vorher mit uns ab.',
      faqQ2: 'Kann ich an der Wohnung parken?', faqA2: 'Es gibt keinen eigenen Parkplatz. Sie parken gebührenpflichtig in einem öffentlichen Parkhaus in Gehweite, z. B. Q-Park Arsenaal, Q-Park Maasboulevard oder Q-Park Nolensplein.',
      faqQ3: 'Wie weit ist es ins Zentrum und zum Bahnhof?', faqA3: 'Geschäfte, Restaurants und die Maas sind zu Fuß erreichbar. Der Bahnhof Venlo ist etwa 10 Gehminuten entfernt.',
      faqQ4: 'Für wie viele Personen sind die Wohnungen geeignet?', faqA4: 'Beide Wohnungen haben 2 Betten und sind für 2 Personen geeignet.',
      faqQ5: 'Sind Haustiere erlaubt?', faqA5: 'Haustiere sind grundsätzlich nicht erlaubt. Bei besonderen Umständen kontaktieren Sie uns bitte vorab.',
      faqQ6: 'Wie lange ist der Mindestaufenthalt?', faqA6: 'Meist können Sie schon ab 1 Nacht buchen. In der Hochsaison kann ein Mindestaufenthalt von 2 Nächten gelten.',
      faqQ7: 'Was ist in der Wohnung vorhanden?', faqA7: 'Eigener Eingang, Küche mit Kochfeld, Kühlschrank und Geschirrspüler, Kaffeemaschine, Flachbild-TV und kostenloses WLAN.',
      faqQ8: 'Wie kann ich direkt buchen?', faqA8: 'Wählen Sie auf der Buchungsseite Ihre Wohnung und Ihre Daten und senden Sie eine Anfrage. Sie erhalten innerhalb von 24 Stunden eine Bestätigung per E-Mail. Buchen über Booking.com oder Airbnb ist ebenfalls möglich.',
      distToverland: 'Freizeitpark Toverland', distBorussia: 'Borussia-Park, Mönchengladbach',
      aboutP3: 'Ob Kurzurlaub, Arbeitswoche oder längerer Aufenthalt: Unsere voll eingerichteten Apartments bieten alles für einen angenehmen Aufenthalt in Venlo.', bookLead: 'Buchen Sie einfach und sicher über:', bookLeadA: 'Einfach & sicher buchen', bookLeadB: 'über:', bookNow: 'Direkt buchen', orVia: 'oder über', orWord: 'oder',
      mainMenu: 'Hauptmenü', chooseLanguage: 'Sprache wählen', footerMenu: 'Fußzeilenmenü', callUs: 'Rufen Sie uns an'
    },
    fr: {
      titleHome: 'Séjourner au centre de Venlo | Appartement privé – InnVenlo',
      home: 'Accueil', apartments: 'Appartements', contact: 'Contact',
      homeTitle: 'Séjourner au cœur de Venlo', homeTitleA: 'Séjourner au', homeTitleB: 'cœur de Venlo',
      homeIntro: 'Dans votre propre appartement, avec entrée privée, cuisine et WiFi gratuit. Tout est accessible à pied.',
      view: 'Voir les appartements',
      about: 'En plein centre de Venlo, au bord de la Meuse – pour chaque séjour',
      aboutP1: 'Venlo, au bord de la Meuse et tout près de la frontière allemande, est le point de départ idéal pour un week-end, un déplacement professionnel ou un séjour plus long. Chez InnVenlo Apartments, vous profitez du confort d’un hôtel, associé à l’espace, à l’intimité et à la liberté d’un appartement bien à vous.',
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
      rev1: '«\xa0Appartement incroyablement spacieux\xa0; on s’y sent comme chez soi. Emplacement très agréable et central.\xa0»',
      rev2: '«\xa0Magnifique appartement dans un lieu particulier et très central.\xa0»',
      rev3: '«\xa0De loin l’appartement le plus beau et le plus complet où nous ayons jamais séjourné. L’emplacement est très central, tout est à quelques pas, et à l’intérieur on découvre une oasis de calme.\xa0»',
      rev4: '«\xa0Appartement superbe, idéalement situé en plein cœur de Venlo. Très propre, merveilleusement spacieux et joliment aménagé.\xa0»',
      rev5: '«\xa0Appartement vraiment agréable, beau et spacieux, tout près de tout\xa0»',
      msgSent: 'Merci ! Votre message a bien été envoyé. Nous vous répondrons au plus vite.',
      faqTitle: 'Questions fréquentes',
      faqQ1: 'Quels sont les horaires d’arrivée et de départ ?', faqA1: 'Arrivée à partir de 14 h, départ jusqu’à 11 h. Vous souhaitez arriver plus tôt ou partir plus tard ? Convenez de l’horaire avec nous à l’avance.',
      faqQ2: 'Puis-je me garer près de l’appartement ?', faqA2: 'Il n’y a pas de place de parking privée. Vous pouvez vous garer (payant) dans un parking public à distance de marche, comme Q-Park Arsenaal, Q-Park Maasboulevard ou Q-Park Nolensplein.',
      faqQ3: 'À quelle distance se trouvent le centre et la gare ?', faqA3: 'Commerces, restaurants et la Meuse sont accessibles à pied. La gare de Venlo est à environ 10 minutes à pied.',
      faqQ4: 'Pour combien de personnes sont les appartements ?', faqA4: 'Les deux appartements disposent de 2 lits et conviennent à 2 personnes.',
      faqQ5: 'Les animaux sont-ils acceptés ?', faqA5: 'Les animaux ne sont en principe pas acceptés. Pour une situation particulière, contactez-nous à l’avance.',
      faqQ6: 'Quelle est la durée minimale du séjour ?', faqA6: 'Vous pouvez généralement réserver dès 1 nuit. En haute saison, un minimum de 2 nuits peut s’appliquer.',
      faqQ7: 'Qu’y a-t-il dans l’appartement ?', faqA7: 'Une entrée privée, une cuisine avec plaque de cuisson, réfrigérateur et lave-vaisselle, une machine à café, une télévision à écran plat et le WiFi gratuit.',
      faqQ8: 'Comment réserver en direct ?', faqA8: 'Choisissez votre appartement et vos dates sur la page de réservation et envoyez une demande. Vous recevrez une confirmation par e-mail sous 24 heures. Vous pouvez aussi réserver via Booking.com ou Airbnb.',
      distToverland: 'Parc d’attractions Toverland', distBorussia: 'Borussia-Park, Mönchengladbach',
      aboutP3: 'Que vous veniez pour de courtes vacances, une semaine de travail ou un séjour prolongé : nos appartements entièrement équipés offrent tout pour un séjour agréable à Venlo.', bookLead: 'Réservez simplement et en toute sécurité via :', bookLeadA: 'Réservez en toute sécurité', bookLeadB: 'via\xa0:', bookNow: 'Réserver', orVia: 'ou via', orWord: 'ou',
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
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
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

  // ---------- Recensies tussen de scores: langzaam verschijnen, even blijven, verdwijnen ----------
  document.querySelectorAll('.quotes').forEach((box) => {
    const qs = [...box.querySelectorAll('.q')];
    if (!qs.length) return;
    let k = 0;
    const show = () => {
      qs.forEach((q, n) => q.classList.toggle('show', n === k));
      k = (k + 1) % qs.length;
    };
    show();
    setInterval(show, 7500);   // ±2,5 s verschijnen, ±4 s goed leesbaar, ±1 s verdwijnen
  });

  // ---------- Contactformulier: bevestiging na verzenden ----------
  const sent = document.getElementById('sent');
  if (sent && new URLSearchParams(location.search).get('verzonden') === '1') {
    sent.hidden = false;
    history.replaceState(null, '', location.pathname);
  }

  // ---------- Logo: letter voor letter bij het openen (één keer per bezoek) ----------
  (() => {
    const logo = document.querySelector('.logo');
    if (!logo) return;
    let seen = false;
    try { seen = sessionStorage.getItem('logoShown') === '1'; sessionStorage.setItem('logoShown', '1'); } catch { /* privémodus */ }
    if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    logo.setAttribute('aria-label', logo.textContent.trim());
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...ch.textContent].forEach((c) => {
            if (c === ' ') { frag.append(' '); return; }
            const s = document.createElement('span');
            s.className = 'l'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', i++); s.textContent = c;
            frag.append(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) split(ch);
      });
    };
    split(logo);
    logo.style.setProperty('--reveal-end', `${i * 70 + 250 + 450}ms`);
    logo.classList.add('reveal', 'bubble');
  })();

  // ---------- Fotoslider ----------
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const imgs = [...slider.querySelectorAll('img')];
    if (imgs.length < 2) return;
    // Foto's pas ophalen wanneer ze nodig zijn (scheelt ruim 1 MB per pagina)
    const load = (img) => { if (img && img.dataset.src && !img.getAttribute('src')) img.src = img.dataset.src; };
    let i = Math.max(0, imgs.findIndex((img) => img.classList.contains('active')));
    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { load(imgs[(i + 1) % imgs.length]); load(imgs[(i - 1 + imgs.length) % imgs.length]); } }, { rootMargin: '200px' }).observe(slider);
    }
    const go = (n) => {
      imgs[i].classList.remove('active');
      i = (n + imgs.length) % imgs.length;
      const img = imgs[i];
      load(img);
      img.classList.add('active');
      // Volgende foto alvast laden
      load(imgs[(i + 1) % imgs.length]);
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
      load(nb);
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
          load(neighbour(1)); load(neighbour(-1));
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

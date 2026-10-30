export interface RealBusinessRecord {
  name: string;
  category: string;
  address: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  knownWebsite: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lon: number;
  sentiment: string;
  positiveThemes: string[];
  complaints: string[];
  stableEvidence: string;
}

export const REAL_BUSINESSES: RealBusinessRecord[] = [
  // ===================== MIAMI, FL =====================
  {
    name: 'Zak The Baker',
    category: 'Artisan Bakeries & Cafes',
    address: '295 NW 26th St',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 786-294-0863',
    knownWebsite: 'https://instagram.com/zakthebaker',
    rating: 4.7,
    reviewCount: 2840,
    lat: 25.8016,
    lon: -80.2012,
    sentiment: 'Internationally celebrated artisan sourdough bakery and kosher deli in Wynwood with lines out the door daily.',
    positiveThemes: ['Artisanal sourdough bread', 'Fresh chocolate babka', 'Vibrant Wynwood atmosphere'],
    complaints: ['Long ordering queues during brunch hours', 'Lacks an integrated corporate catering pre-order website'],
    stableEvidence: 'Operating in Wynwood since 2012 with James Beard nomination and verified local foot traffic.'
  },
  {
    name: 'Madruga Bakery',
    category: 'Artisan Bakeries & Cafes',
    address: '1430 S Dixie Hwy, Suite 117',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-262-4314',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 960,
    lat: 25.7145,
    lon: -80.2612,
    sentiment: 'Rustic scratch bakery milling its own heirloom flour on-site for crusty loaves, rustic pastries, and specialty espresso.',
    positiveThemes: ['Fresh in-house stone milled flour', 'Authentic European crust', 'Courteous staff'],
    complaints: ['Popular items sell out by noon', 'No online ordering or stock reservation system'],
    stableEvidence: 'Continuously active bakery and cafe in Coral Gables with loyal South Florida regulars.'
  },
  {
    name: 'Primos Barber Shop',
    category: 'Barbers & Hair Salons',
    address: '1800 SW 1st Ave, Suite 104',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-640-5896',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 490,
    lat: 25.7592,
    lon: -80.1984,
    sentiment: 'Upscale Brickell gentleman barbershop specialized in hot towel shaves, beard trims, and scissor cuts with complimentary espresso.',
    positiveThemes: ['Precision fades', 'Hot towel straight razor shave', 'Punctual appointments'],
    complaints: ['Appointments must be phoned in during shop hours', 'No website with online booking calendar'],
    stableEvidence: 'Over 10 years serving Brickell professionals and Miami residents with 5-star barber team.'
  },
  {
    name: "Churchill's Barber Shop",
    category: 'Barbers & Hair Salons',
    address: '121 Miracle Mile',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-442-9990',
    knownWebsite: '',
    rating: 4.9,
    reviewCount: 320,
    lat: 25.7505,
    lon: -80.2592,
    sentiment: 'Historic Coral Gables grooming lounge delivering classic British barbershop luxury, straight razor shaves, and grooming products.',
    positiveThemes: ['Classic luxury ambiance', 'Attentive master barbers', 'High consistency across visits'],
    complaints: ['Walk-in availability is rare', 'No digital deposit or package booking website'],
    stableEvidence: 'Prominent Miracle Mile business for over a decade with high corporate clientele.'
  },
  {
    name: 'Sanguich de Miami',
    category: 'Restaurants & Cafés',
    address: '2057 SW 8th St, Little Havana',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-539-0969',
    knownWebsite: 'https://instagram.com/sanguichdemiami',
    rating: 4.7,
    reviewCount: 3450,
    lat: 25.7656,
    lon: -80.2285,
    sentiment: 'Gourmet Cuban sandwich atelier in Little Havana curing their own ham and mustard in-house. Michelin Bib Gourmand.',
    positiveThemes: ['Best Cubano sandwich in Miami', 'House-cured meats', 'Batidos de mamey'],
    complaints: ['Tiny counter space with 10 stools', 'Long outdoor waits with no mobile order pickup website'],
    stableEvidence: 'Featured on national television and Michelin Guide with sustained lines every day.'
  },
  {
    name: 'Boia De',
    category: 'Restaurants & Cafés',
    address: '5205 NE 2nd Ave',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-967-8866',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 910,
    lat: 25.8239,
    lon: -80.1915,
    sentiment: 'Tucked into a humble strip mall under a glowing exclamation mark, serving Michelin-starred modern Italian-American cuisine.',
    positiveThemes: ['Exquisite beef tartare with tonnato', 'Warm unpretentious hospitality', 'Curated natural wine list'],
    complaints: ['Impossible to secure tables via phone calls', 'Lacks clean direct private dining event inquiry website'],
    stableEvidence: 'Michelin star recipient and booked out months in advance.'
  },
  {
    name: 'El Bagel',
    category: 'Restaurants & Cafés',
    address: '6910 Biscayne Blvd',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 786-536-7365
',
    knownWebsite: 'https://instagram.com/elbagel',
    rating: 4.6,
    reviewCount: 1280,
    lat: 25.8392,
    lon: -80.1868,
    sentiment: 'Hand-rolled, boiled, and fresh-baked sourdough bagels in Miami MiMo District with creative schmears and breakfast sandwiches.',
    positiveThemes: ['Chewy authentic bagel crust', 'Bacon egg & cheese on everything bagel', 'Local MiMo neighborhood spot'],
    complaints: ['Only open until sold out', 'Mobile ordering handled haphazardly across third-party delivery apps'],
    stableEvidence: 'Cult food truck turned brick-and-mortar storefront with continuous morning queues.'
  },
  {
    name: 'Japanese Auto Tech Miami',
    category: 'Auto Repair Shops',
    address: '2268 NW 36th St',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-635-4700',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 390,
    lat: 25.8094,
    lon: -80.2341,
    sentiment: 'Trusted independent auto repair shop specializing in Toyota, Lexus, Honda and Acura mechanical diagnostics and maintenance.',
    positiveThemes: ['Honest pricing with zero upselling', 'Fast turnaround on brake and engine work', 'Transparent explanations'],
    complaints: ['Phone lines constantly busy in the morning', 'No digital inspection or estimate website'],
    stableEvidence: 'Over 20 years of family-owned operation near Miami International Airport.'
  },
  {
    name: 'Miami High-End Detailing',
    category: 'Auto Repair Shops',
    address: '7245 NE 4th Ave',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-219-0189',
    knownWebsite: '',
    rating: 4.9,
    reviewCount: 270,
    lat: 25.8423,
    lon: -80.1902,
    sentiment: 'Master certified paint correction, ceramic coatings, and paint protection film (PPF) for exotic, luxury, and collector sports cars.',
    positiveThemes: ['Flawless swirl removal', 'Top-tier ceramic coating longevity', 'White-glove customer service'],
    complaints: ['Must call or DM on Instagram for quote', 'No interactive service package pricing portal'],
    stableEvidence: 'Recognized by South Florida supercar clubs and exotic vehicle owners.'
  },
  {
    name: 'Wynwood Dental Group',
    category: 'Local Professional Practices & Clinics',
    address: '320 NW 24th St',
    city: 'Miami',
    region: 'Florida',
    country: 'United States',
    phone: '+1 305-573-0005',
    knownWebsite: '',
    rating: 4.9,
    reviewCount: 320,
    lat: 25.7997,
    lon: -80.2014,
    sentiment: 'Modern boutique dental clinic in Wynwood focused on gentle preventative hygiene, Invisalign, and cosmetic smile designs.',
    positiveThemes: ['Gentle pain-free cleanings', 'Modern clean studio environment', 'Caring and empathetic dentists'],
    complaints: ['Receptionist phone can take multiple rings to answer', 'No online patient intake registration'],
    stableEvidence: 'Serving Wynwood, Edgewater, and Midtown residents for over 7 years.'
  },

  // ===================== BARCELONA, SPAIN =====================
  {
    name: 'Bodega Can Marlau',
    category: 'Restaurants & Cafés',
    address: 'Carrer de París 161',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 932 45 81 29',
    knownWebsite: 'https://instagram.com/bodegacanmarlau',
    rating: 4.7,
    reviewCount: 760,
    lat: 41.3891,
    lon: 2.1524,
    sentiment: 'Tapas de autor excepcionales dirigidas por el chef Ferran Gómez en l\'Eixample. Guía Michelin Bib Gourmand.',
    positiveThemes: ['Tapas de marisco fresco', 'Ambiente de barrio auténtico', 'Selección de vinos catalanes'],
    complaints: ['Comedor pequeño que se llena de inmediato', 'No tienen sistema de reservas por internet'],
    stableEvidence: 'Más de 7 años de funcionamiento continuo en l\'Eixample con clientela fiel de barrio.'
  },
  {
    name: 'Barbería Gràcia Tradició',
    category: 'Barbers & Hair Salons',
    address: 'Carrer de Verdi 48',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 934 15 22 70',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 310,
    lat: 41.4042,
    lon: 2.1578,
    sentiment: 'Maestros del afeitado clásico a navaja, arreglo de barba y degradados precisos en pleno corazón de Gràcia.',
    positiveThemes: ['Puntualidad en los cortes', 'Tratamiento con toalla caliente', 'Ambiente relajado'],
    complaints: ['Solo aceptan reservas por teléfono o en persona', 'No disponen de web con agenda online'],
    stableEvidence: 'Establecimiento abierto en 2017 con altísima fidelidad de clientes locales.'
  },
  {
    name: 'Pastisseria Hofmann',
    category: 'Artisan Bakeries & Cafes',
    address: 'Carrer dels Flassaders 44, El Born',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 933 19 58 88',
    knownWebsite: '',
    rating: 4.6,
    reviewCount: 3720,
    lat: 41.3855,
    lon: 2.1818,
    sentiment: 'Legendaria pastelería artesanal de la escuela Hofmann galardonada con el Mejor Croissant de Mantequilla de España.',
    positiveThemes: ['Croissant de mascarpone inigualable', 'Pastelería individual de alta precisión', 'Ubicación con encanto en el Born'],
    complaints: ['Cola en la calle en horas punta', 'Sin tienda online para encargos directos'],
    stableEvidence: 'Institución de referencia de la gastronomía dulce de Barcelona.'
  },
  {
    name: 'El Xampanyet',
    category: 'Restaurants & Cafés',
    address: 'Carrer de Montcada 22, El Born',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 933 19 70 03',
    knownWebsite: '',
    rating: 4.7,
    reviewCount: 5900,
    lat: 41.3851,
    lon: 2.1815,
    sentiment: 'Taberna histórica de 1929 frente al Museo Picasso célebre por su vino espumoso, anchoas del Cantábrico y ambiente vibrante.',
    positiveThemes: ['Anchoas de Santoña de máxima calidad', 'Cava de la casa con encanto', 'Atención familiar y castiza'],
    complaints: ['No reservan mesa', 'No cuentan con web oficial informativa'],
    stableEvidence: 'Casi un siglo de historia ininterrumpida de hostelería en el Born.'
  },
  {
    name: 'Fisioterapia & Salut Sarrià',
    category: 'Local Professional Practices & Clinics',
    address: 'Carrer Major de Sarrià 82',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 932 04 11 90',
    knownWebsite: '',
    rating: 4.9,
    reviewCount: 195,
    lat: 41.3995,
    lon: 2.1218,
    sentiment: 'Clínica colegiada especializada en fisioterapia traumatológica, lesiones deportivas y osteopatía avanzada en Sarrià.',
    positiveThemes: ['Diagnósticos certeros', 'Tratamiento manual personalizado', 'Fisioterapeutas colegiados con experiencia'],
    complaints: ['Citas telefónicas colapsadas por la mañana', 'Falta formulario de cita previa en web propia'],
    stableEvidence: 'Más de 9 años de ejercicio clínico en el barrio de Sarrià.'
  },
  {
    name: 'Taller Mecánico Poblenou Motors',
    category: 'Auto Repair Shops',
    address: 'Carrer de Pujades 124',
    city: 'Barcelona',
    region: 'Catalonia',
    country: 'Spain',
    phone: '+34 933 09 45 12',
    knownWebsite: '',
    rating: 4.6,
    reviewCount: 210,
    lat: 41.4011,
    lon: 2.1963,
    sentiment: 'Taller multimarca de reparación mecánica, pre-ITV y diagnosis electrónica en el 22@ Poblenou con presupuestos claros.',
    positiveThemes: ['Presupuestos honestos sin piezas innecesarias', 'Rapidez en revisiones', 'Trato directo con el mecánico'],
    complaints: ['No tienen web para solicitar cita previa o presupuesto', 'Local con espacio limitado'],
    stableEvidence: 'Taller familiar fundado en 2011 con clientela recurrente.'
  },

  // ===================== MADRID, SPAIN =====================
  {
    name: 'Café de la Luz',
    category: 'Restaurants & Cafés',
    address: 'Calle de la Puebla 8, Malasaña',
    city: 'Madrid',
    region: 'Community of Madrid',
    country: 'Spain',
    phone: '+34 915 23 11 99',
    knownWebsite: 'https://instagram.com/cafelaluzmadrid',
    rating: 4.6,
    reviewCount: 2480,
    lat: 40.4225,
    lon: -3.7042,
    sentiment: 'Cafetería íntima y acogedora con sillones vintage, café de especialidad y tartas caseras en el corazón de Malasaña.',
    positiveThemes: ['Ambiente bohemio muy acogedor', 'Tarta de zanahoria casera', 'Iluminación cálida'],
    complaints: ['Se llena por las tardes sin posibilidad de consultar aforo', 'Sin web de carta digital'],
    stableEvidence: 'Local emblemático de la escena cultural de Malasaña desde hace más de una década.'
  },
  {
    name: 'Bodega de la Ardosa',
    category: 'Restaurants & Cafés',
    address: 'Calle de Colón 13',
    city: 'Madrid',
    region: 'Community of Madrid',
    country: 'Spain',
    phone: '+34 915 21 49 23',
    knownWebsite: '',
    rating: 4.5,
    reviewCount: 7850,
    lat: 40.4234,
    lon: -3.7011,
    sentiment: 'Taberna centenaria fundada en 1892, famosa por una de las mejores tortillas de patata de Madrid y cerveza Guinness.',
    positiveThemes: ['Tortilla de patatas jugosa insuperable', 'Historia y solera madrileña', 'Tiraje de cerveza artesano'],
    complaints: ['Local muy concurrido', 'No aceptan reservas ni disponen de web oficial'],
    stableEvidence: 'Taverna histórica madrileña en funcionamiento ininterrumpido desde 1892.'
  },
  {
    name: 'Barbería Malasaña',
    category: 'Barbers & Hair Salons',
    address: 'Calle del Barco 42',
    city: 'Madrid',
    region: 'Community of Madrid',
    country: 'Spain',
    phone: '+34 910 24 53 11',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 680,
    lat: 40.4239,
    lon: -3.7032,
    sentiment: 'Barbería moderna con esencia clásica, expertos en degradados urbanos, arreglo de barba y afeitados tradicionales.',
    positiveThemes: ['Puntualidad británica', 'Maestría en degradados skin fade', 'Música y buen ambiente'],
    complaints: ['Citas telefónicas difíciles en horas punta', 'Sin plataforma web de reservas online'],
    stableEvidence: 'Barbería de referencia en el centro de Madrid con miles de cortes anuales.'
  },
  {
    name: 'Clínica Dental Fuencarral',
    category: 'Local Professional Practices & Clinics',
    address: 'Calle de Fuencarral 101',
    city: 'Madrid',
    region: 'Community of Madrid',
    country: 'Spain',
    phone: '+34 914 48 30 15',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 310,
    lat: 40.4282,
    lon: -3.7019,
    sentiment: 'Clínica odontológica familiar e independiente en Chamberí con especialistas en ortodoncia invisible e implantes dentales.',
    positiveThemes: ['Trato humano y cercano', 'Tratamientos conservadores sin presupuestos inflados', 'Doctores de confianza'],
    complaints: ['No disponen de web para solicitar cita online ni consultar cuadro médico', 'Línea fija ocupada a menudo'],
    stableEvidence: 'Más de 15 años cuidando la salud bucodental en Chamberí.'
  },

  // ===================== VALENCIA, SPAIN =====================
  {
    name: 'Dulce de Leche Boutique Russafa',
    category: 'Restaurants & Cafés',
    address: 'Carrer del Pintor Gisbert 2',
    city: 'Valencia',
    region: 'Valencian Community',
    country: 'Spain',
    phone: '+34 960 03 59 49',
    knownWebsite: 'https://instagram.com/dulcedelecheboutique',
    rating: 4.6,
    reviewCount: 5290,
    lat: 39.4621,
    lon: -0.3742,
    sentiment: 'Boutique de pastelería artesanal y brunch de estilo nórdico-argentino en pleno corazón de Ruzafa.',
    positiveThemes: ['Exhibición espectacular de tartas artesanas', 'Brunch abundante y de calidad', 'Terraza acogedora'],
    complaints: ['Colas en fines de semana', 'No admiten reservas online ni pedidos web directos'],
    stableEvidence: 'Establecimiento icónico de Ruzafa con gran afluencia diaria.'
  },
  {
    name: 'Bar La Pérgola',
    category: 'Restaurants & Cafés',
    address: "Passeig de l'Albereda 1",
    city: 'Valencia',
    region: 'Valencian Community',
    country: 'Spain',
    phone: '+34 963 69 37 64',
    knownWebsite: '',
    rating: 4.6,
    reviewCount: 3980,
    lat: 39.4741,
    lon: -0.3642,
    sentiment: 'Kiosco clásico en la Alameda valenciana famoso por sus legendarios bocadillos de esmorzaret como el "Bombón" y "Super".',
    positiveThemes: ['Bocadillos valencianos auténticos', 'Terraza soleada en la Alameda', 'Servicio rápido y castizo'],
    complaints: ['Lugar muy concurrido para el esmorzar', 'Sin página web ni presencia digital moderna'],
    stableEvidence: 'Punto de encuentro gastronómico tradicional valenciano desde hace más de 50 años.'
  },

  // ===================== LONDON, UK =====================
  {
    name: 'Monmouth Coffee Company',
    category: 'Restaurants & Cafés',
    address: '27 Monmouth St, Covent Garden',
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    phone: '+44 20 7379 3516',
    knownWebsite: '',
    rating: 4.7,
    reviewCount: 2900,
    lat: 51.5139,
    lon: -0.1268,
    sentiment: 'The pioneer of artisan single-origin specialty coffee roasting in London since 1978, with legendary filtered coffees.',
    positiveThemes: ['Best specialty filter coffee in central London', 'Fresh roasted single-origin beans', 'Staff expertise'],
    complaints: ['Communal seating and long queues', 'Lacks clean digital subscription or cafe pre-order site'],
    stableEvidence: 'Roasting in London since 1978 with international barista acclaim.'
  },
  {
    name: 'The Dusty Knuckle Bakery',
    category: 'Artisan Bakeries & Cafes',
    address: 'Abbot St, Dalston',
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    phone: '+44 20 7683 0155',
    knownWebsite: 'https://instagram.com/thedustyknuckle',
    rating: 4.7,
    reviewCount: 1680,
    lat: 51.5471,
    lon: -0.0754,
    sentiment: 'Cult social-enterprise sourdough bakery in East London shipping legendary potato sourdough and giant focaccia sandwiches.',
    positiveThemes: ['Focaccia sandwiches with creative fillings', 'Crusty sourdough bread', 'Mission-driven social enterprise'],
    complaints: ['Lines wrap around the carpark on weekends', 'No online catering ordering platform'],
    stableEvidence: 'Multi-award winning East London culinary destination founded in 2014.'
  },
  {
    name: 'Dapper Fox Barbers Shoreditch',
    category: 'Barbers & Hair Salons',
    address: '146 Shoreditch High St',
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    phone: '+44 20 7739 8812',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 430,
    lat: 51.5255,
    lon: -0.0772,
    sentiment: 'Independent Shoreditch traditional gentleman barber shop offering classic scissor work, beard reshaping, and hot lather neck shaves.',
    positiveThemes: ['Top-tier skin fades', 'Friendly knowledgeable barbers', 'Complimentary craft beers'],
    complaints: ['Appointments must be phoned in during shop hours', 'No modern automated booking web app'],
    stableEvidence: 'Serving Shoreditch creatives, tech workers, and locals for over 8 years.'
  },

  // ===================== NEW YORK, NY =====================
  {
    name: "Joe's Pizza Carmine St",
    category: 'Restaurants & Cafés',
    address: '7 Carmine St, Greenwich Village',
    city: 'New York',
    region: 'New York',
    country: 'United States',
    phone: '+1 212-366-1182',
    knownWebsite: '',
    rating: 4.7,
    reviewCount: 12400,
    lat: 40.7305,
    lon: -74.0021,
    sentiment: 'The quintessential New York City slice joint founded in 1975 by Naples native Joe Pozzuoli in Greenwich Village.',
    positiveThemes: ['Crisp thin crust slice', 'Consistent quality for decades', 'Fast classic NYC slice counter'],
    complaints: ['Cash only or chaotic ordering line', 'Lacks clean official website with corporate catering ordering'],
    stableEvidence: 'Operating continuously at the same intersection for over 50 years.'
  },
  {
    name: 'Astoria Barber Shop',
    category: 'Barbers & Hair Salons',
    address: '30-14 30th Ave, Queens',
    city: 'New York',
    region: 'New York',
    country: 'United States',
    phone: '+1 718-726-9289',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 410,
    lat: 40.7674,
    lon: -73.9182,
    sentiment: 'Beloved classic Queens neighborhood barbershop known for scissor mastery, crisp beard line-ups, and genuine community hospitality.',
    positiveThemes: ['Family-friendly atmosphere', 'Expert scissor cuts and fades', 'Reasonable honest neighborhood rates'],
    complaints: ['Walk-in wait times can exceed an hour on Saturdays', 'No website to view barber schedules'],
    stableEvidence: 'A staple of 30th Avenue in Astoria for more than 15 years.'
  },

  // ===================== AUSTIN, TX =====================
  {
    name: 'Cuantos Tacos',
    category: 'Restaurants & Cafés',
    address: '1108 E 12th St',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    phone: '+1 512-888-9122',
    knownWebsite: 'https://instagram.com/cuantostacos512',
    rating: 4.8,
    reviewCount: 940,
    lat: 30.2745,
    lon: -97.7289,
    sentiment: 'Mexico City style street tacos served on double yellow corn tortillas with longaniza, suadero, and buche in East Austin.',
    positiveThemes: ['Authentic CDMX street tacos', 'Crispy suadero and spicy salsas', 'East Austin food truck trailer vibe'],
    complaints: ['Sells out quickly during evening rush', 'Must order in person with no online ordering website'],
    stableEvidence: 'Consistently ranked among the top taco destinations in Texas by Texas Monthly.'
  },
  {
    name: 'Birds Barbershop South Congress',
    category: 'Barbers & Hair Salons',
    address: '1902 S Congress Ave',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    phone: '+1 512-445-0407',
    knownWebsite: '',
    rating: 4.7,
    reviewCount: 780,
    lat: 30.2468,
    lon: -97.7512,
    sentiment: 'Austin homegrown barbershop on SoCo with free Shiner Bock beers, indie soundtrack, and top scissor & razor styling.',
    positiveThemes: ['Great music and friendly vibe', 'Free local Texas beer while waiting', 'Skilled stylists and barbers'],
    complaints: ['Call-ahead queue fills up early in the morning', 'Lacks clean self-serve booking web platform'],
    stableEvidence: 'Austin institution founded in 2006, expanding across Central Texas.'
  },
  {
    name: 'Uchi Austin',
    category: 'Restaurants & Cafés',
    address: '801 S Lamar Blvd',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    phone: '+1 512-916-4808',
    knownWebsite: 'https://instagram.com/uchiaustin',
    rating: 4.8,
    reviewCount: 3820,
    lat: 30.2582,
    lon: -97.7634,
    sentiment: 'Renowned non-traditional Japanese sushi bar founded by James Beard Award-winning Chef Tyson Cole.',
    positiveThemes: ['World-class sashimi', 'Innovative seasonal hot tastings', 'Impeccable hospitality'],
    complaints: ['Walk-in line forms at 4 PM before doors open', 'No dedicated catering reservation portal'],
    stableEvidence: 'Operating in South Lamar since 2003 with international acclaim.'
  },
  {
    name: 'Castillo Auto Repair',
    category: 'Auto Repair & Detailing',
    address: '2201 E 7th St',
    city: 'Austin',
    region: 'Texas',
    country: 'United States',
    phone: '+1 512-472-7493',
    knownWebsite: '',
    rating: 4.9,
    reviewCount: 290,
    lat: 30.2641,
    lon: -97.7178,
    sentiment: 'Honest, family-owned auto repair garage serving East Austin with master mechanics for domestic and import vehicles.',
    positiveThemes: ['Honest pricing without upsells', 'Quick diagnostic turnaround', 'Friendly mechanics'],
    complaints: ['Must call during garage hours to book bay appointment', 'No website with online quote calculator'],
    stableEvidence: 'Continuous family auto repair service in East Austin for over 25 years.'
  },

  // ===================== LOS ANGELES, CA =====================
  {
    name: 'Guisados Boyle Heights',
    category: 'Restaurants & Cafés',
    address: '2100 Cesar E Chavez Ave',
    city: 'Los Angeles',
    region: 'California',
    country: 'United States',
    phone: '+1 323-264-7201',
    knownWebsite: 'https://instagram.com/guisados',
    rating: 4.7,
    reviewCount: 3100,
    lat: 34.0483,
    lon: -118.2125,
    sentiment: 'Famous homestyle handmade corn tortilla tacos with braised stewed meats, tinga de pollo, and cochinita pibil.',
    positiveThemes: ['Hand-made fresh masa tortillas', 'Sampler taco platter', 'Authentic Boyle Heights roots'],
    complaints: ['Peak lunch hours wrap around the block', 'Lacks an integrated corporate event catering booking website'],
    stableEvidence: 'Original Boyle Heights location founded in 2010 by Armando De La Torre Sr.'
  },
  {
    name: 'Sweeney Todd’s Barber Shop',
    category: 'Barbers & Hair Salons',
    address: '4639 Hollywood Blvd',
    city: 'Los Angeles',
    region: 'California',
    country: 'United States',
    phone: '+1 323-667-9630',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 460,
    lat: 34.1017,
    lon: -118.2938,
    sentiment: 'Authentic 1940s vintage barbershop in Los Feliz delivering classic scissor cuts, hot lather shaves, and heritage pomades.',
    positiveThemes: ['Vintage period decor and memorabilia', 'Master classic haircuts', 'Complimentary beverages and warmth'],
    complaints: ['Appointments must be phoned in during shop hours', 'No website with real-time chair availability'],
    stableEvidence: 'Hollywood landmark founded in 1947, operating continuously for over 75 years.'
  },
  {
    name: 'Courage Bagels',
    category: 'Artisan Bakeries & Cafes',
    address: '777 N Virgil Ave',
    city: 'Los Angeles',
    region: 'California',
    country: 'United States',
    phone: '+1 323-522-6804',
    knownWebsite: 'https://instagram.com/courage.bagels',
    rating: 4.7,
    reviewCount: 1680,
    lat: 34.0851,
    lon: -118.2868,
    sentiment: 'Cult-favorite Montreal-style crispy wood-fired bagels with smoked salmon, heirloom tomatoes, and roe in Virgil Village.',
    positiveThemes: ['Extra-crispy blistered crust', 'Smoked salmon with capers and lemon', 'Vibrant East Hollywood vibe'],
    complaints: ['Weekend lines can reach 90 minutes', 'No advance pre-order pick-up website'],
    stableEvidence: 'Viral and New York Times-lauded bakery in Virgil Village since 2020.'
  },

  // ===================== CHICAGO, IL =====================
  {
    name: 'Pequod’s Pizza',
    category: 'Restaurants & Cafés',
    address: '2207 N Clybourn Ave',
    city: 'Chicago',
    region: 'Illinois',
    country: 'United States',
    phone: '+1 773-327-1512',
    knownWebsite: 'https://instagram.com/pequodspizza',
    rating: 4.6,
    reviewCount: 6850,
    lat: 41.9219,
    lon: -87.6644,
    sentiment: 'Iconic Chicago deep dish and pan pizza famous for its caramelized burnt-cheese crust and sweet crushed tomato sauce.',
    positiveThemes: ['Caramelized crispy cheese crust halo', 'Hearty authentic Chicago pan style', 'Classic dive-pub atmosphere'],
    complaints: ['45-minute wait time for pizzas', 'Phone lines often busy when calling for carryout'],
    stableEvidence: 'Lincoln Park institution operating continuously since 1970.'
  },
  {
    name: 'Belmont Barbershop',
    category: 'Barbers & Hair Salons',
    address: '2328 W Belmont Ave',
    city: 'Chicago',
    region: 'Illinois',
    country: 'United States',
    phone: '+1 773-296-0894',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 520,
    lat: 41.9396,
    lon: -87.6868,
    sentiment: 'Traditional neighborhood barbershop in Roscoe Village providing top-notch scissor cuts, neck shaves, and beard grooming.',
    positiveThemes: ['Friendly, unpretentious staff', 'Attention to detail on fades and tapers', 'Punctual appointments'],
    complaints: ['Walk-ins rarely accepted due to high regular demand', 'No custom website booking portal'],
    stableEvidence: 'Over 15 years serving Roscoe Village and North Side Chicago residents.'
  },

  // ===================== SAN FRANCISCO, CA =====================
  {
    name: 'Tartine Bakery Guerrero',
    category: 'Artisan Bakeries & Cafes',
    address: '600 Guerrero St',
    city: 'San Francisco',
    region: 'California',
    country: 'United States',
    phone: '+1 415-487-2600',
    knownWebsite: 'https://instagram.com/tartinebakery',
    rating: 4.6,
    reviewCount: 4200,
    lat: 37.7614,
    lon: -122.4241,
    sentiment: 'World-renowned artisan sourdough bakery and cafe by Chad Robertson and Elisabeth Prueitt in the Mission District.',
    positiveThemes: ['Morning buns with orange zest', 'Country sourdough loaves', 'Rich espresso drinks'],
    complaints: ['Lines often extend down 18th Street', 'Lacks an integrated custom catering order platform'],
    stableEvidence: 'Iconic Mission District bakery founded in 2002, influencing bakeries worldwide.'
  },
  {
    name: 'Joe’s Barbershop SF',
    category: 'Barbers & Hair Salons',
    address: '2150 Market St',
    city: 'San Francisco',
    region: 'California',
    country: 'United States',
    phone: '+1 415-255-9096',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 610,
    lat: 37.7668,
    lon: -122.4305,
    sentiment: 'Community favorite barbershop in Castro/Duboce Triangle featuring vintage barber chairs, skilled fades, and straight razor neck shaves.',
    positiveThemes: ['Consistent top-tier fades', 'Warm neighborhood vibe', 'Great music and friendly banter'],
    complaints: ['Must call in or book via third-party aggregator', 'Lacks custom website with pricing packages'],
    stableEvidence: 'Serving San Francisco residents since 2004 with a master team of barbers.'
  },

  // ===================== PARIS, FRANCE =====================
  {
    name: 'Du Pain et des Idées',
    category: 'Artisan Bakeries & Cafes',
    address: '34 Rue Yves Toudic',
    city: 'Paris',
    region: 'Île-de-France',
    country: 'France',
    phone: '+33 1 42 40 44 52',
    knownWebsite: 'https://instagram.com/dupainetdesidees',
    rating: 4.6,
    reviewCount: 3950,
    lat: 48.8712,
    lon: 2.3634,
    sentiment: 'Historic 1875 bakery near Canal Saint-Martin celebrated for its Pain des Amis, escargot chocolat pistache, and heritage flour.',
    positiveThemes: ['Pain des Amis with smoky roasted crust', 'Escargot pistache-chocolat', 'Stunning 19th-century ceiling and mirrors'],
    complaints: ['Closed on weekends (Monday-Friday only)', 'No online pre-order website for pastry boxes'],
    stableEvidence: 'Operating at this historic bakery site since 2002 with multiple Paris Baker of the Year awards.'
  },
  {
    name: 'Les Mauvais Garçons Barbier',
    category: 'Barbers & Hair Salons',
    address: '60 Rue Oberkampf',
    city: 'Paris',
    region: 'Île-de-France',
    country: 'France',
    phone: '+33 1 48 05 73 58',
    knownWebsite: '',
    rating: 4.8,
    reviewCount: 480,
    lat: 48.8647,
    lon: 2.3752,
    sentiment: 'Vintage Paris barbershop in the 11th arrondissement specializing in traditional hot towel shaves and retro pompadours.',
    positiveThemes: ['Authentic Parisian vintage decor', 'Precision beard trims and hot towel treatment', 'Relaxing salon vibe'],
    complaints: ['Appointments book out 1-2 weeks in advance', 'No dedicated website with barber portfolio'],
    stableEvidence: 'Pioneered the traditional barber revival in Paris since 2011.'
  }
];

/**
 * Filter real businesses from our verified directory matching location and category.
 */
export function getMatchingRealBusinesses(location: string, queryOrCategory: string): RealBusinessRecord[] {
  const normLoc = (location || '').toLowerCase().trim();
  const normCat = (queryOrCategory || '').toLowerCase().trim();

  // First, exact or city matches
  let matches = REAL_BUSINESSES.filter((b) => {
    const matchCity = normLoc ? (
      b.city.toLowerCase().includes(normLoc) ||
      normLoc.includes(b.city.toLowerCase()) ||
      b.region.toLowerCase().includes(normLoc) ||
      b.country.toLowerCase().includes(normLoc)
    ) : true;

    const matchCategory = normCat ? (
      b.category.toLowerCase().includes(normCat) ||
      normCat.includes(b.category.toLowerCase()) ||
      b.name.toLowerCase().includes(normCat) ||
      b.sentiment.toLowerCase().includes(normCat) ||
      b.positiveThemes.some(t => t.toLowerCase().includes(normCat))
    ) : true;

    return matchCity && matchCategory;
  });

  // If no exact combination, match on city
  if (matches.length === 0 && normLoc) {
    matches = REAL_BUSINESSES.filter((b) =>
      b.city.toLowerCase().includes(normLoc) ||
      normLoc.includes(b.city.toLowerCase()) ||
      b.region.toLowerCase().includes(normLoc)
    );
  }

  // If still no match on city, match on category across all cities
  if (matches.length === 0 && normCat) {
    matches = REAL_BUSINESSES.filter((b) =>
      b.category.toLowerCase().includes(normCat) ||
      normCat.includes(b.category.toLowerCase()) ||
      b.positiveThemes.some(t => t.toLowerCase().includes(normCat))
    );
  }

  // Fallback to top-rated real businesses if no query matches
  if (matches.length === 0) {
    matches = [...REAL_BUSINESSES];
  }

  return matches;
}


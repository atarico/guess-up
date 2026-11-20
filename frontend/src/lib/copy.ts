// Every user-facing string, in Spanish (03 §3). Components never hold Spanish literals.

/** A piece of a sentence: plain text, or a figure set in the monospace face (bold in the verdict, 03 §5.4). */
export type Part = { text: string; figure: boolean; tone?: Tone };
/** The colour a figure takes in the stats screen: yours (accent), the coin's band (gold), a gain or a cost. */
export type Tone = 'accent' | 'gold' | 'up' | 'down';
const text = (t: string): Part => ({ text: t, figure: false });
const figure = (t: string, tone?: Tone): Part => (tone ? { text: t, figure: true, tone } : { text: t, figure: true });
export const copy = {
  appTitle: 'Guess-Up',
  tagline: 'Una gráfica real y anónima, cortada en una fecha pasada al azar. Compras o pasas. Después, la verdad.',
  // 03 §5.1 and §5.2: the same text link on both screens, shown only with the demo credentials.
  demoLink: 'Probar la cuenta demo',
  // Page titles, 03 §10.
  titles: {
    login: 'Guess-Up · Iniciar sesión',
    play: 'Guess-Up · Jugar',
    stats: 'Guess-Up · Estadísticas',
  },
  // 03 §5.1
  welcome: {
    headline: '¿De verdad sabes leer una gráfica?',
    start: 'Crear cuenta',
    // The decorative chart above the headline: one year shown, three months hidden.
    heroLabel: 'Gráfica anónima de un año de precios; los tres meses siguientes están ocultos',
    heroPast: 'Un año, sin nombre ni fechas',
    heroFuture: '3 meses después',
    logIn: 'Iniciar sesión',
    footer: 'Precios históricos reales de Twelve Data. Esto no es asesoría de inversión.',
  },
  // 03 §5.2
  login: {
    signup: {
      title: 'Crear cuenta',
      pending: 'Creando cuenta…',
      switchMode: '¿Ya tienes cuenta? Inicia sesión',
    },
    login: {
      title: 'Iniciar sesión',
      pending: 'Entrando…',
      switchMode: '¿No tienes cuenta? Crea una',
    },
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    passwordHint: 'Mínimo 8 caracteres.',
    // 03 §8, only when the server rejected the token.
    sessionExpired: 'Tu sesión expiró. Inicia sesión de nuevo.',
    errors: {
      EMAIL_TAKEN: 'Ya existe una cuenta con ese correo.',
      INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
      VALIDATION: 'Revisa el correo y la contraseña. La contraseña debe tener al menos 8 caracteres.',
      RATE_LIMITED: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    } as Record<string, string>,
  },
  // 03 §8: offline, 5xx or any code without its own text.
  genericError: 'Algo salió mal. Intenta de nuevo.',
  // 03 §8: the screen shown while a call waits for a sleeping server (components/ServerWaking.tsx).
  waking: {
    title: 'Despertando el servidor',
    body: 'El servidor se duerme tras 15 minutos sin uso. La primera carga puede tardar cerca de un minuto. Entrarás en cuanto responda.',
    progress: 'Esperando al servidor',
    retrying: (seconds: number) => `Reintentando · ${seconds} s`,
  },
  retry: 'Reintentar',
  // 03 §5.3, §8, §10
  play: {
    roundCount: (n: number) => `Gráfica ${n}`,
    statsLink: 'Estadísticas',
    question: '¿Compras o pasas?',
    questionHint: 'Después verás la empresa, las fechas y lo que pasó en los tres meses siguientes.',
    chips: ['Acción real', 'Un año', 'Sin nombre ni fechas'],
    onceNote: 'Tu decisión se registra una sola vez.',
    // Comprar is the left button, so the left arrow buys (03 §5.3).
    keys: '← Comprar · → Pasar',
    // The card above the chart, the first time this browser plays (lib/howItWorks.ts), and the button that shows it again.
    howItWorks: {
      lines: [
        'Esta es la gráfica real de una acción, sin nombre ni fechas.',
        'Decide si la comprarías o la dejarías pasar. Después verás qué acción era y qué pasó.',
        'A las 10 gráficas recibes tu veredicto: si tu criterio le gana a lanzar una moneda.',
      ],
      open: '¿Cómo funciona?',
    },
    // The top bar pill says what the streak counts: right calls in a row.
    streak: (n: number) => [text('Racha: '), figure(String(n)), text(n === 1 ? ' acierto' : ' aciertos')],
    // The reveal (03 §5.3).
    inThreeMonths: 'en 3 meses',
    cutLabel: 'Corte',
    meta: (sector: string, exchange: string) => `${sector} · ${exchange}`,
    pricesRow: 'Corte → 3 meses',
    todayRow: 'Hoy',
    todayLoading: 'Cargando el precio de hoy',
    currentStreak: 'Racha actual',
    bestStreak: 'Mejor racha',
    // What happened, decided on the raw return with the backend's isCorrect boundary; flat is exactly zero.
    call: {
      buy: { up: 'Compraste. Subió.', down: 'Compraste. Bajó.', flat: 'Compraste. No cambió.' },
      pass: { up: 'Pasaste. Subió.', down: 'Pasaste. Bajó.', flat: 'Pasaste. No cambió.' },
    },
    // Whether the call was right (isCorrect), shown beside the call.
    result: { right: 'Acertaste', wrong: 'Fallaste' },
    pass: 'Pasar',
    buy: 'Comprar',
    decisionFailed: 'No se pudo guardar tu respuesta. Intenta de nuevo.',
    noData: 'Todavía no hay gráficas cargadas. La biblioteca de precios se está llenando.',
    prices: (from: string, to: string) => `${from} → ${to}`,
    priceNote: 'Precios ajustados por splits.',
    next: 'Siguiente gráfica',
    // On the reveal of the tenth chart, the whole sentence is the link to Stats (lib/progress.ts).
    verdictReady: 'Tu primer veredicto está listo en Estadísticas.',
    // (P1) The live line (03 §5.3). `sinceThen` follows the headline's arrow and percent.
    live: {
      today: (price: string) => `Hoy: ${price} ·`,
      sinceThen: 'desde entonces',
      limit: 'El precio de hoy no está disponible en este momento (límite de la API).',
      // Not in 03 §5.3: the spec's text blames the API limit, which is untrue for a timeout or an error.
      unavailable: 'El precio de hoy no está disponible en este momento.',
    },
    // Accessible labels of the headline's arrow.
    up: 'Subió',
    down: 'Bajó',
  },
  // 03 §5.4. Approved wording: do not rephrase. Figures arrive already formatted (lib/verdict.ts).
  stats: {
    verdict: {
      cost: (picks: string, all: string, points: string) => [
        text('Tus selecciones rindieron '),
        figure(picks, 'accent'),
        text(' en promedio. Comprar todas las gráficas rindió '),
        figure(all),
        text('. Tu criterio te costó '),
        figure(`${points} puntos porcentuales`, 'down'),
        text(' por compra.'),
      ],
      gain: (picks: string, all: string, points: string) => [
        text('Tus selecciones rindieron '),
        figure(picks, 'accent'),
        text(' en promedio. Comprar todas las gráficas rindió '),
        figure(all),
        text('. Tu criterio te sumó '),
        figure(`${points} puntos porcentuales`, 'up'),
        text(' por compra.'),
      ],
      same: (all: string) => [
        text('Tus selecciones y comprar todas las gráficas rindieron lo mismo: '),
        figure(all),
        text(' en promedio. Tu criterio no cambió el resultado.'),
      ],
      remaining: (n: number) =>
        n === 1
          ? [text('Falta '), figure('1 gráfica'), text(' para tu primer veredicto.')]
          : [text('Faltan '), figure(`${n} gráficas`), text(' para tu primer veredicto.')],
      boughtAll: [
        text('Compraste todas las gráficas, así que tu resultado es el mismo que el de comprar todo. Prueba dejar pasar las que no te convenzan.'),
      ],
      boughtNone: [text('Todavía no has comprado ninguna gráfica. Aún no hay nada que medir.')],
    },
  },
  // 03 §5.4: the cards of the stats screen, in their order.
  statsCards: {
    decided: (n: number) => (n === 1 ? 'Tu resultado · 1 gráfica decidida' : `Tu resultado · ${n} gráficas decididas`),
    // The verdict card: the short verdict against the coin.
    verdictLine: {
      coin: 'Por ahora, tu criterio no se distingue de lanzar una moneda.',
      better: 'Por ahora, mejor que una moneda.',
      worse: 'Por ahora, peor que una moneda.',
    },
    averages: {
      heading: 'Rendimiento promedio a 3 meses',
      picks: 'Tus selecciones',
      all: 'Comprar todas',
      passed: 'Las que pasaste',
      edge: 'Ventaja de tu criterio',
      edgeHint: 'Tus selecciones menos comprar todas',
      // Percentage points: "puntos" everywhere but the verdict sentence and the coin legend (03 §3).
      points: (value: string) => `${value} puntos`,
    },
    coin: {
      heading: 'Tú contra la moneda',
      intro: (trials: string, buys: string, rounds: string) =>
        `${trials} monedas compraron ${buys} gráficas al azar de las mismas ${rounds} que tú viste. Esta es la ventaja que obtuvo cada una.`,
      histogramLabel: (trials: string) => `Histograma de la ventaja de ${trials} monedas, con el rango donde cae el 90% y tu ventaja marcada`,
      you: (value: string) => `Tú ${value}`,
      legendRange: '90% de las monedas',
      legendYou: 'Tu ventaja, en puntos porcentuales',
      // Under the histogram: why the coin's spread can have two humps.
      twoHumps: 'Si ves dos montañas, es porque una sola acción se movió mucho: algunas monedas la compraron y otras no.',
      range: (low: string, high: string) => [
        text('El 90% de las monedas terminó entre '),
        figure(low, 'gold'),
        text(' y '),
        figure(high, 'gold'),
        text(' puntos. '),
      ],
      within: (share: string) => [text('Tú quedaste dentro de ese rango y le ganaste al '), figure(share), text(' de las monedas.')],
      above: (share: string) => [text('Tú quedaste por encima de ese rango y le ganaste al '), figure(share), text(' de las monedas.')],
      below: (share: string) => [text('Tú quedaste por debajo de ese rango: la moneda te ganó el '), figure(share), text(' de las veces.')],
    },
    hits: {
      heading: 'Aciertos y rachas',
      count: (right: number, total: number) => `${right} de ${total} ${total === 1 ? 'acierto' : 'aciertos'}`,
      hint: 'Comprar y que suba, o pasar y que no suba',
      current: 'Racha actual',
      best: 'Mejor',
    },
    recent: {
      heading: (n: number) => (n === 1 ? 'Tu última gráfica' : `Últimas ${n} gráficas`),
      legend: 'Barra llena: compraste. Barra vacía: pasaste. La más reciente, a la derecha.',
      stripLabel: 'Rendimiento a tres meses de tus últimas gráficas',
      bought: 'Compraste',
      passed: 'Pasaste',
      right: 'Acierto',
      wrong: 'Fallo',
    },
  },
  // 03 §5.4 and §10: the stats screen around the sentences.
  statsScreen: {
    // 03 §5.4, only when user.isDemo is true.
    demoBanner: 'Cuenta demo: estas decisiones las tomó una moneda.',
    playedSplit: (buys: number, passes: number) =>
      `${buys} ${buys === 1 ? 'compra' : 'compras'} · ${passes} ${passes === 1 ? 'pase' : 'pases'}`,
    smallPrint:
      'Rendimiento de precio a tres meses, sin dividendos, comisiones ni impuestos. Las acciones que aparecen siguen cotizando hoy, lo que favorece a "comprar todas". Con pocas gráficas, el rango de la moneda es amplio: todavía no hay forma de saber si es habilidad.',
    logOut: 'Cerrar sesión',
    // The way back to the game (the design's text).
    keepPlaying: 'Jugar otra gráfica',
    // A figure that is undefined, such as the picks with no buys.
    missing: '—',
  },
  // 03 §6, §10
  chart: {
    sealed: 'Gráfica anónima de un año de precios, sin nombre, fechas ni escala',
    revealed: (name: string) => `Gráfica de ${name}: un año hasta el corte y los tres meses siguientes`,
    unknown: '?',
  },
  // 03 §3: sector names arrive in English from the API; anything not listed is shown as it comes.
  sectors: {
    Technology: 'Tecnología',
    'Health Care': 'Salud',
    Financials: 'Finanzas',
    Energy: 'Energía',
    Industrials: 'Industria',
    'Consumer Discretionary': 'Consumo discrecional',
    'Consumer Staples': 'Consumo básico',
    'Communication Services': 'Comunicaciones',
    Utilities: 'Servicios públicos',
    Materials: 'Materiales',
    'Real Estate': 'Bienes raíces',
  } as Record<string, string>,
};

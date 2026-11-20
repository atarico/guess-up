// Every user-facing string, in Spanish (03 §3). Components never hold Spanish literals.

/** A piece of a sentence: plain text, or a figure set in the monospace face (bold in the verdict, 03 §5.4). */
export type Part = { text: string; figure: boolean };
const text = (t: string): Part => ({ text: t, figure: false });
const figure = (t: string): Part => ({ text: t, figure: true });
export const copy = {
  appTitle: 'Guess-Up',
  tagline: 'Una gráfica real de una acción, sin nombre ni fechas. Comprar o pasar. Después, la verdad.',
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
    start: 'Empezar',
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
  retry: 'Reintentar',
  // 03 §5.3, §8, §10
  play: {
    streak: (n: number) => `Racha: ${n}`,
    roundCount: (n: number) => `Gráfica ${n}`,
    statsLink: 'Estadísticas',
    question: '¿Comprarías esta acción?',
    pass: 'Pasar',
    buy: 'Comprar',
    keyHints: '← Pasar · → Comprar',
    decisionFailed: 'No se pudo guardar tu respuesta. Intenta de nuevo.',
    noData: 'Todavía no hay gráficas cargadas. La biblioteca de precios se está llenando.',
    identity: (symbol: string, name: string) => `${symbol} · ${name}`,
    window: (from: string, to: string) => `${from} → ${to}`,
    horizon: (to: string) => `los 3 meses siguientes, hasta el ${to}`,
    prices: (from: string, to: string) => `${from} → ${to}`,
    priceNote: 'Precios ajustados por splits.',
    next: 'Siguiente gráfica',
    // Accessible labels of the headline's arrow.
    up: 'Subió',
    down: 'Bajó',
    calls: {
      buyUp: 'Compraste. Buena decisión.',
      buyDown: 'Compraste. Bajó.',
      buyFlat: 'Compraste. No cambió.',
      passDownOrFlat: 'Pasaste. Buena decisión.',
      passUp: 'Pasaste. Subió sin ti.',
    },
  },
  // 03 §5.4. Approved wording: do not rephrase. Figures arrive already formatted (lib/verdict.ts).
  stats: {
    verdict: {
      cost: (picks: string, all: string, points: string) => [
        text('Tus selecciones rindieron '),
        figure(picks),
        text(' en promedio. Comprar todas las gráficas rindió '),
        figure(all),
        text('. Tu criterio te costó '),
        figure(`${points} puntos porcentuales`),
        text(' por compra.'),
      ],
      gain: (picks: string, all: string, points: string) => [
        text('Tus selecciones rindieron '),
        figure(picks),
        text(' en promedio. Comprar todas las gráficas rindió '),
        figure(all),
        text('. Tu criterio te sumó '),
        figure(`${points} puntos porcentuales`),
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
    coin: {
      opening: (buys: string, rounds: string, low: string, high: string) => [
        text('Una moneda que compra al azar '),
        figure(buys),
        text(' de estas '),
        figure(rounds),
        text(' gráficas queda entre '),
        figure(low),
        text(' y '),
        figure(high),
        text(' puntos nueve de cada diez veces.'),
      ],
      within: [text('Tu resultado está dentro de ese rango. Por ahora, tu criterio no se distingue de lanzar una moneda.')],
      above: (share: string) => [
        text('Tu resultado está por encima de ese rango. Por ahora, mejor que una moneda: superas al '),
        figure(share),
        text(' de los lanzamientos.'),
      ],
      below: (share: string) => [
        text('Tu resultado está por debajo de ese rango. Por ahora, peor que una moneda: la moneda te gana el '),
        figure(share),
        text(' de las veces.'),
      ],
    },
  },
  // 03 §5.4 and §10: the stats screen around the sentences.
  statsScreen: {
    // 03 §5.4, only when user.isDemo is true.
    demoBanner: 'Cuenta demo. Sus primeras 40 gráficas las jugó una moneda.',
    picks: 'Tus selecciones',
    all: 'Comprar todo',
    passed: 'Lo que dejaste pasar',
    coinHeading: 'Contra una moneda',
    hitRate: 'Aciertos',
    currentStreak: 'Racha actual',
    bestStreak: 'Mejor racha',
    played: 'Gráficas jugadas',
    playedSplit: (buys: number, passes: number) =>
      `${buys} ${buys === 1 ? 'compra' : 'compras'} · ${passes} ${passes === 1 ? 'pase' : 'pases'}`,
    smallPrint:
      'Rendimientos por precio a 63 jornadas bursátiles (unos 3 meses). No incluyen dividendos, comisiones ni impuestos. Las acciones que aparecen siguen cotizando hoy, lo que favorece a "comprar todo".',
    logOut: 'Cerrar sesión',
    // The author's text for the way back to the game (work unit 6).
    keepPlaying: 'Seguir jugando',
    // A figure that is undefined, such as the picks with no buys.
    missing: '—',
    coinBandLabel: (low: string, high: string, you: string) => `Rango de la moneda: de ${low} a ${high} puntos. Tu resultado: ${you} puntos.`,
  },
  // 03 §6, §10
  chart: {
    sealedLabel: 'Gráfica de precios anónima, un año de precios diarios',
    revealedLabel: (symbol: string, from: string, to: string) => `Gráfica de ${symbol}, del ${from} al ${to}`,
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

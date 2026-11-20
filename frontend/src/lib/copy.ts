// Every user-facing string, in Spanish (03 §3). Components never hold Spanish literals.
export const copy = {
  appTitle: 'Guess-Up',
  tagline: 'Una gráfica real de una acción, sin nombre ni fechas. Comprar o pasar. Después, la verdad.',
  // Page titles, 03 §10.
  titles: {
    login: 'Guess-Up · Iniciar sesión',
    play: 'Guess-Up · Jugar',
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
  // Provisional /play of work unit 3; replaced by the game in work unit 5.
  provisionalPlay: {
    signedInAs: 'Sesión iniciada como',
    logOut: 'Cerrar sesión',
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

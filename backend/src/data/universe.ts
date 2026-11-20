// The curated universe (01 §10): 60 US stocks across the 11 sectors of 03 §3, deliberately including
// some that did badly. Approved by the author in the spec review (session 00), with KHC replaced by CPB.
// The entries marked "did badly" were chosen for that reason. Names and sectors are stored as written here;
// the exchange comes from the provider (02 §5.5).

export const SECTORS = [
  'Technology',
  'Health Care',
  'Financials',
  'Energy',
  'Industrials',
  'Consumer Discretionary',
  'Consumer Staples',
  'Communication Services',
  'Utilities',
  'Materials',
  'Real Estate',
] as const;

export type Sector = (typeof SECTORS)[number];

export type UniverseEntry = { symbol: string; name: string; sector: Sector };

export const UNIVERSE: UniverseEntry[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology' },
  { symbol: 'MU', name: 'Micron Technology, Inc.', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' }, // did badly
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'Communication Services' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Communication Services' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services' }, // did badly
  { symbol: 'VZ', name: 'Verizon Communications Inc.', sector: 'Communication Services' }, // did badly
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'HD', name: 'The Home Depot, Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer Discretionary' },
  { symbol: 'NKE', name: 'NIKE, Inc.', sector: 'Consumer Discretionary' }, // did badly
  { symbol: 'F', name: 'Ford Motor Company', sector: 'Consumer Discretionary' }, // did badly
  { symbol: 'M', name: 'Macy\'s, Inc.', sector: 'Consumer Discretionary' }, // did badly
  { symbol: 'PG', name: 'The Procter & Gamble Company', sector: 'Consumer Staples' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples' },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', sector: 'Consumer Staples' },
  { symbol: 'CPB', name: 'The Campbell\'s Company', sector: 'Consumer Staples' }, // did badly
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care' },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', sector: 'Health Care' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Health Care' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Health Care' }, // did badly
  { symbol: 'BIIB', name: 'Biogen Inc.', sector: 'Health Care' }, // did badly
  { symbol: 'CVS', name: 'CVS Health Corporation', sector: 'Health Care' }, // did badly
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  { symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financials' },
  { symbol: 'GS', name: 'The Goldman Sachs Group, Inc.', sector: 'Financials' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials' }, // did badly
  { symbol: 'AIG', name: 'American International Group, Inc.', sector: 'Financials' }, // did badly
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials' },
  { symbol: 'DE', name: 'Deere & Company', sector: 'Industrials' },
  { symbol: 'UNP', name: 'Union Pacific Corporation', sector: 'Industrials' },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials' }, // did badly
  { symbol: 'UPS', name: 'United Parcel Service, Inc.', sector: 'Industrials' }, // did badly
  { symbol: 'AAL', name: 'American Airlines Group Inc.', sector: 'Industrials' }, // did badly
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources, Inc.', sector: 'Energy' },
  { symbol: 'SLB', name: 'SLB', sector: 'Energy' }, // did badly
  { symbol: 'APA', name: 'APA Corporation', sector: 'Energy' }, // did badly
  { symbol: 'NEE', name: 'NextEra Energy, Inc.', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
  { symbol: 'SO', name: 'The Southern Company', sector: 'Utilities' },
  { symbol: 'PCG', name: 'PG&E Corporation', sector: 'Utilities' }, // did badly
  { symbol: 'SHW', name: 'The Sherwin-Williams Company', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products and Chemicals, Inc.', sector: 'Materials' },
  { symbol: 'NUE', name: 'Nucor Corporation', sector: 'Materials' },
  { symbol: 'MOS', name: 'The Mosaic Company', sector: 'Materials' }, // did badly
  { symbol: 'PLD', name: 'Prologis, Inc.', sector: 'Real Estate' },
  { symbol: 'AMT', name: 'American Tower Corporation', sector: 'Real Estate' },
  { symbol: 'O', name: 'Realty Income Corporation', sector: 'Real Estate' },
  { symbol: 'MAC', name: 'The Macerich Company', sector: 'Real Estate' }, // did badly
];

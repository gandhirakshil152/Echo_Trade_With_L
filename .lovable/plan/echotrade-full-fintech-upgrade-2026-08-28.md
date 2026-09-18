# EchoTrade: full fintech upgrade

One build pass covering the splash page, redesigned terminal, live market data (charts, news, fundamentals), broker filters, add-funds via simulated UPI, and better voice accuracy.

## 1. Splash / landing page

- New public landing route with a distinctive fintech look: animated index ticker, live NIFTY/SENSEX/BANKNIFTY/NIFTY IT cards pulled from the live feed, "how voice trading works" flow, broker logos strip, security note, and a single clear "Enter terminal" CTA.
- Signed-in users land straight in the terminal; signed-out users see the splash.
- Own SEO metadata (title, description, social tags).

## 2. UI/UX rework of the terminal

The current dense single-screen layout is the source of confusion. It becomes:

- Persistent top bar: brand, market status (open/closed IST), total funds, active broker filter chip, voice button, profile menu.
- Floating index panel: compact draggable/collapsible bar showing selected indices, with an "add index" picker so you choose which indices sit in the floating bar (saved per user).
- Clear left-to-right structure: watchlist + search (left), chart + stock detail tabs (centre), order ticket + positions (right). Collapses to stacked tabs on mobile.
- Stock detail tabs: Chart, Fundamentals, Technicals, News, Orders.
- Consistent empty states, skeleton loaders, and toast feedback everywhere.

## 3. Search with suggestions

- Typeahead dropdown as you type: symbol, company name, exchange badge, live price and % change, keyboard navigation, recent searches.
- Fuzzy matching so partial or misspelled names still resolve.

## 4. Live market data (free public feeds)

Extend the existing server-side quote layer (Yahoo Finance India primary, Stooq fallback, simulated tape as last resort):

- Intraday and historical candles for 1D / 1W / 1M / 6M / 1Y / 5Y, rendered as an area/candle chart with volume.
- Fundamentals: market cap, P/E, P/B, EPS, dividend yield, 52-week range, sector, book value.
- Technicals: SMA/EMA, RSI, MACD, VWAP, day range and a simple bullish/bearish read computed from the candle series.
- News: latest headlines per symbol plus a general market feed, with source and time.
- Results/corporate data where the free feed exposes it; sections degrade gracefully with a "data unavailable" state instead of breaking.

## 5. Broker filters everywhere

- Global broker filter: All / Zerodha / Upstox / Angel One.
- Applied to funds total, portfolio/holdings, order book, P&L, brokerage summary, and watchlist (watchlist has no broker column, so it filters by which symbols that broker has traded or holds; "All" shows everything).
- Filter state is shared across tabs and reflected in the top bar chip.

## 6. Add funds (simulated UPI)

- "Add funds" per broker: amount entry with quick chips, a generated QR code and UPI ID request screen, then instant credit to that broker's balance.
- Every credit is recorded as a funds transaction so there is a per-broker funds history (date, amount, method, reference).
- Clearly labelled as a simulation; no real money moves.

## 7. P&L and brokerage

- Per-holding and per-broker P&L: invested, current value, unrealised P&L, day change, realised P&L from sells.
- Brokerage estimate per order and totals per broker (brokerage, STT, exchange charges, GST, stamp duty) using standard Indian discount-broker slabs.

## 8. Voice accuracy and coverage

- Use multiple speech-recognition alternatives and pick the one that resolves to a known scrip, instead of only the top guess.
- Expand the symbol dictionary with spoken aliases and common mishearings (e.g. "infosis", "tata motor", "airtell", "hitachi" -> HDFC-type confusions), plus phonetic matching already in place.
- New voice commands: broker filters ("show Zerodha portfolio", "all brokers orders"), add funds ("add fifty thousand to Upstox"), charts ("show Reliance chart one month"), news ("news for TCS"), fundamentals/technicals, index panel ("add Bank Nifty to index bar"), funds history, P&L.
- Voice never accepts a PIN; PINs stay typed only.
- Spoken confirmation of what was understood, with a visible "did you mean X?" correction chip.

## 9. Broker setup by user

Keep and polish the existing flow: each broker panel is configured by you with holder name, client ID and a typed 4-6 digit PIN; opening balance is randomised between Rs 5,000 and Rs 20,00,000. Setup, edit, connect/disconnect and per-broker status are surfaced clearly on the redesigned Brokers screen.

## Technical notes

- Data access stays in server functions (`src/lib/quotes.functions.ts` plus new `market.functions.ts` for candles/news/fundamentals) so outbound calls happen server-side with caching; no API key required.
- New tables: `fund_transactions` (UPI simulation ledger) and `user_preferences` (floating index panel selection), each with RLS scoped to the owner and grants.
- Charts use the already-installed Recharts; QR rendering via a small client-side generator.
- Voice work stays in `src/hooks/useVoiceCommands.ts`; scrip dictionary extracted into a dedicated module.
- Design tokens in `src/styles.css` extended rather than hardcoded colours in components.
- Verification: typecheck plus a browser pass through splash, search, chart, filters, add funds and an order.

## Out of scope

Real broker execution APIs (Zerodha/Upstox/Angel One) and real payments remain simulated against the app database.

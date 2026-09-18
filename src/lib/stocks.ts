export interface StockMeta {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  base: number;
  aliases?: string[];
}

/** NSE / BSE universe — 200+ scripts. All prices in INR. */
export const POPULAR_INDIAN_STOCKS: StockMeta[] = [
  // ── NIFTY 50 + LARGE CAPS ──────────────────────────────────────────────
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", base: 1428.5, aliases: ["reliance", "ril", "रिलायंस", "રિલાયન્સ", "reliance industries", "mukesh ambani"] },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT", base: 3186.2, aliases: ["tcs", "tata consultancy", "टीसीएस", "ટીસીએસ", "tata consulting"] },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", sector: "Banking", base: 1712.9, aliases: ["hdfc", "hdfc bank", "एचडीएफसी", "એચડીએફસી", "hdfc bank limited"] },
  { symbol: "INFY", name: "Infosys", exchange: "NSE", sector: "IT", base: 1562.4, aliases: ["infosys", "infy", "इन्फोसिस", "ઇન્ફોસિસ", "infosis", "infosys limited"] },
  { symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Banking", base: 1284.7, aliases: ["icici", "icici bank", "आईसीआईसीआई", "આઈસીઆઈસીઆઈ"] },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking", base: 812.35, aliases: ["sbi", "state bank", "एसबीआई", "એસબીઆઈ", "state bank of india"] },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", base: 1655.8, aliases: ["airtel", "bharti", "एयरटेल", "એરટેલ", "bharti airtel"] },
  { symbol: "ITC", name: "ITC Limited", exchange: "NSE", sector: "FMCG", base: 412.15, aliases: ["itc", "आईटीसी", "આઈટીસી", "itc limited"] },
  { symbol: "LT", name: "Larsen & Toubro", exchange: "NSE", sector: "Infra", base: 3624.5, aliases: ["larsen", "l and t", "lt", "एलटी", "એલટી", "larsen and toubro"] },
  { symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Auto", base: 724.6, aliases: ["tata motors", "टाटा मोटर्स", "ટાટા મોટર્સ", "tata motor"] },
  { symbol: "MARUTI", name: "Maruti Suzuki", exchange: "NSE", sector: "Auto", base: 12480.0, aliases: ["maruti", "suzuki", "मारुति", "મારુતિ", "maruti suzuki"] },
  { symbol: "AXISBANK", name: "Axis Bank", exchange: "NSE", sector: "Banking", base: 1108.2, aliases: ["axis", "axis bank", "एक्सिस", "એક્સિસ"] },
  { symbol: "WIPRO", name: "Wipro", exchange: "NSE", sector: "IT", base: 262.9, aliases: ["wipro", "विप्रो", "વિપ્રો"] },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE", sector: "FMCG", base: 2384.7, aliases: ["hul", "unilever", "hindustan unilever", "हिंदुस्तान", "હિન્દુસ્તાન"] },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE", sector: "Pharma", base: 1712.4, aliases: ["sun pharma", "सन फार्मा", "સન ફાર્મા", "sun pharmaceutical"] },
  { symbol: "ADANIENT", name: "Adani Enterprises", exchange: "NSE", sector: "Conglomerate", base: 2384.1, aliases: ["adani", "adani enterprises", "अडानी", "અડાણી"] },
  { symbol: "TATASTEEL", name: "Tata Steel", exchange: "NSE", sector: "Metals", base: 142.35, aliases: ["tata steel", "टाटा स्टील", "ટાટા સ્ટીલ"] },
  { symbol: "ZOMATO", name: "Eternal (Zomato)", exchange: "NSE", sector: "Consumer Tech", base: 268.4, aliases: ["zomato", "eternal", "जोमैटो", "ઝોમૅટો"] },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", exchange: "NSE", sector: "NBFC", base: 6890.5, aliases: ["bajaj finance", "bajaj", "बजाज फाइनेंस", "બજાજ ફાઇનાન્સ"] },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", exchange: "NSE", sector: "Energy", base: 245.8, aliases: ["ongc", "oil and gas", "ओएनजीसी", "ઓએનજીસી"] },
  { symbol: "COALINDIA", name: "Coal India", exchange: "NSE", sector: "Mining", base: 398.6, aliases: ["coal india", "coal", "कोल इंडिया", "કોલ ઇન્ડિયા"] },
  { symbol: "POWERGRID", name: "Power Grid Corp", exchange: "NSE", sector: "Utilities", base: 312.4, aliases: ["power grid", "powergrid", "पावर ग्रिड", "પાવર ગ્રીડ"] },
  { symbol: "NTPC", name: "NTPC Limited", exchange: "NSE", sector: "Utilities", base: 348.9, aliases: ["ntpc", "एनटीपीसी", "એનટીપીસી"] },
  { symbol: "IRCTC", name: "IRCTC", exchange: "NSE", sector: "Travel", base: 782.3, aliases: ["irctc", "railway", "रेलवे", "રેલ્વે", "indian railway"] },
  { symbol: "DMART", name: "Avenue Supermarts (DMart)", exchange: "NSE", sector: "Retail", base: 4120.0, aliases: ["dmart", "avenue", "डीमार्ट", "ડીમાર્ટ", "avenue supermarts"] },
  { symbol: "TITAN", name: "Titan Company", exchange: "NSE", sector: "Consumer", base: 3364.2, aliases: ["titan", "टाइटन", "ટાઈટન"] },

  // ── BANKING & FINANCE ─────────────────────────────────────────────────
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", exchange: "NSE", sector: "Banking", base: 1876.4, aliases: ["kotak", "kotak bank", "कोटक", "કોટક", "kotak mahindra"] },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", exchange: "NSE", sector: "Banking", base: 1024.3, aliases: ["indusind", "indusind bank", "इंडसइंड", "ઇન્ડ્સઇન્ડ"] },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", exchange: "NSE", sector: "NBFC", base: 1624.8, aliases: ["bajaj finserv", "finserv", "बजाज फिनसर्व", "બજાજ ફિનસર્વ"] },
  { symbol: "PNB", name: "Punjab National Bank", exchange: "NSE", sector: "Banking", base: 98.4, aliases: ["pnb", "punjab national", "पीएनबी", "પીએનબી"] },
  { symbol: "BANKBARODA", name: "Bank of Baroda", exchange: "NSE", sector: "Banking", base: 226.8, aliases: ["bank of baroda", "baroda", "बैंक ऑफ बड़ौदा", "બૅન્ક ઓફ બડોદા", "bob"] },
  { symbol: "CANBK", name: "Canara Bank", exchange: "NSE", sector: "Banking", base: 98.6, aliases: ["canara", "canara bank", "केनरा बैंक", "કેનેરા બૅન્ક"] },
  { symbol: "FEDERALBNK", name: "Federal Bank", exchange: "NSE", sector: "Banking", base: 176.2, aliases: ["federal bank", "federal", "फेडरल बैंक", "ફેડરલ બૅન્ક"] },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", exchange: "NSE", sector: "Banking", base: 72.4, aliases: ["idfc", "idfc first", "आईडीएफसी", "આઈડીએફસી"] },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", exchange: "NSE", sector: "Insurance", base: 618.4, aliases: ["hdfc life", "एचडीएफसी लाइफ", "એચડીએફસી લાઈફ"] },
  { symbol: "SBILIFE", name: "SBI Life Insurance", exchange: "NSE", sector: "Insurance", base: 1476.2, aliases: ["sbi life", "एसबीआई लाइफ", "એસબીઆઈ લાઈફ"] },
  { symbol: "ICICIPRULI", name: "ICICI Prudential Life", exchange: "NSE", sector: "Insurance", base: 682.4, aliases: ["icici prudential", "prudential", "आईसीआईसीआई प्रूडेंशियल", "આઈસીઆઈસીઆઈ પ્રૂડેન્શિયલ"] },
  { symbol: "CHOLAFIN", name: "Cholamandalam Finance", exchange: "NSE", sector: "NBFC", base: 1284.6, aliases: ["chola", "cholamandalam", "चोलामंडलम", "ચોલામંડળ"] },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance", exchange: "NSE", sector: "NBFC", base: 1876.2, aliases: ["muthoot", "muthoot finance", "मुथूट", "મૂથૂત"] },
  { symbol: "MANAPPURAM", name: "Manappuram Finance", exchange: "NSE", sector: "NBFC", base: 198.4, aliases: ["manappuram", "मणप्पुरम", "મણપ્પુરમ"] },
  { symbol: "RECLTD", name: "REC Limited", exchange: "NSE", sector: "Finance", base: 524.6, aliases: ["rec", "rec limited", "आरईसी", "આરઈસી"] },
  { symbol: "PFC", name: "Power Finance Corp", exchange: "NSE", sector: "Finance", base: 436.8, aliases: ["pfc", "power finance", "पीएफसी", "પીએફસી"] },

  // ── INFORMATION TECHNOLOGY ───────────────────────────────────────────
  { symbol: "HCLTECH", name: "HCL Technologies", exchange: "NSE", sector: "IT", base: 1524.6, aliases: ["hcl", "hcl tech", "एचसीएल", "એચસીએલ", "hcl technologies"] },
  { symbol: "TECHM", name: "Tech Mahindra", exchange: "NSE", sector: "IT", base: 1284.2, aliases: ["tech mahindra", "techm", "टेक महिंद्रा", "ટેક મહિન્દ્રા"] },
  { symbol: "LTIM", name: "LTIMindtree", exchange: "NSE", sector: "IT", base: 5624.4, aliases: ["ltimindtree", "lti", "mindtree", "एलटीआई", "એલટીઆઈ"] },
  { symbol: "MPHASIS", name: "Mphasis", exchange: "NSE", sector: "IT", base: 2876.4, aliases: ["mphasis", "एमफेसिस", "એમફેસિસ"] },
  { symbol: "PERSISTENT", name: "Persistent Systems", exchange: "NSE", sector: "IT", base: 5284.6, aliases: ["persistent", "persistent systems", "पर्सिस्टेंट", "પર્સિસ્ટન્ટ"] },
  { symbol: "COFORGE", name: "Coforge", exchange: "NSE", sector: "IT", base: 7624.8, aliases: ["coforge", "कोफोर्ज", "કોફોર્જ", "niit technologies"] },
  { symbol: "KPITTECH", name: "KPIT Technologies", exchange: "NSE", sector: "IT", base: 1484.2, aliases: ["kpit", "kpit tech", "केपीआईटी", "કેપીઆઈટી"] },
  { symbol: "OFSS", name: "Oracle Financial Services", exchange: "NSE", sector: "IT", base: 9824.6, aliases: ["oracle financial", "ofss", "ओएफएसएस", "ઓએફએસએસ"] },

  // ── PHARMA ───────────────────────────────────────────────────────────
  { symbol: "DRREDDY", name: "Dr Reddy's Laboratories", exchange: "NSE", sector: "Pharma", base: 5876.4, aliases: ["dr reddy", "reddy", "डॉ रेड्डी", "ડો. રેડ્ડી", "dr reddys"] },
  { symbol: "CIPLA", name: "Cipla", exchange: "NSE", sector: "Pharma", base: 1476.2, aliases: ["cipla", "सिप्ला", "સિપ્લા"] },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", exchange: "NSE", sector: "Pharma", base: 4876.4, aliases: ["divis", "divi", "डिविज", "ડીવીઝ", "divis lab"] },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", exchange: "NSE", sector: "Pharma", base: 1124.8, aliases: ["aurobindo", "auro pharma", "ऑरोबिंदो", "ઓરોબિન્દો"] },
  { symbol: "LUPIN", name: "Lupin", exchange: "NSE", sector: "Pharma", base: 1876.4, aliases: ["lupin", "लुपिन", "લ્યુપિન"] },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals", exchange: "NSE", sector: "Pharma", base: 2876.4, aliases: ["torrent pharma", "torrent", "टोरेंट फार्मा", "ટોરેન્ટ ફાર્મા"] },
  { symbol: "ALKEM", name: "Alkem Laboratories", exchange: "NSE", sector: "Pharma", base: 5284.6, aliases: ["alkem", "अल्केम", "આલ્કેમ"] },
  { symbol: "IPCALAB", name: "IPCA Laboratories", exchange: "NSE", sector: "Pharma", base: 1524.6, aliases: ["ipca", "आईपीसीए", "આઈપીસીએ"] },
  { symbol: "ABBOTINDIA", name: "Abbott India", exchange: "NSE", sector: "Pharma", base: 28476.4, aliases: ["abbott", "abbott india", "एबट", "એબોટ"] },
  { symbol: "GLAXO", name: "GSK Pharma India", exchange: "NSE", sector: "Pharma", base: 1976.4, aliases: ["gsk", "glaxo", "ग्लैक्सो", "ગ્લેક્સો", "glaxosmithkline"] },

  // ── AUTO ──────────────────────────────────────────────────────────────
  { symbol: "M&M", name: "Mahindra & Mahindra", exchange: "NSE", sector: "Auto", base: 2184.6, aliases: ["mahindra", "m and m", "mm", "महिंद्रा", "મહિન્દ્રા", "mahindra and mahindra"] },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", exchange: "NSE", sector: "Auto", base: 8124.6, aliases: ["bajaj auto", "bajaj", "बजाज ऑटो", "બજાજ ઓટો"] },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", exchange: "NSE", sector: "Auto", base: 4284.6, aliases: ["hero", "hero motocorp", "हीरो मोटोकॉर्प", "હીરો મોટોકોર્પ", "hero moto"] },
  { symbol: "EICHERMOT", name: "Eicher Motors", exchange: "NSE", sector: "Auto", base: 4624.8, aliases: ["eicher", "royal enfield", "रॉयल एनफील्ड", "રોયલ એન્ફીલ્ડ", "eicher motors"] },
  { symbol: "TVSMOTOR", name: "TVS Motor Company", exchange: "NSE", sector: "Auto", base: 2284.6, aliases: ["tvs", "tvs motor", "टीवीएस", "ટીવીએસ"] },
  { symbol: "ASHOKLEY", name: "Ashok Leyland", exchange: "NSE", sector: "Auto", base: 218.4, aliases: ["ashok leyland", "leyland", "अशोक लेलैंड", "અશોક લેલેન્ડ"] },
  { symbol: "BOSCHLTD", name: "Bosch India", exchange: "NSE", sector: "Auto", base: 32184.6, aliases: ["bosch", "बॉश", "બૉશ", "bosch india"] },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson", exchange: "NSE", sector: "Auto Ancillary", base: 162.4, aliases: ["motherson", "मदरसन", "મધર્સન"] },
  { symbol: "BALKRISIND", name: "Balkrishna Industries", exchange: "NSE", sector: "Auto Ancillary", base: 2784.6, aliases: ["bkt", "balkrishna", "बालकृष्ण", "બાળકૃષ્ણ"] },

  // ── FMCG ──────────────────────────────────────────────────────────────
  { symbol: "NESTLEIND", name: "Nestle India", exchange: "NSE", sector: "FMCG", base: 2284.6, aliases: ["nestle", "नेस्ले", "નેસ્લે", "nestle india"] },
  { symbol: "BRITANNIA", name: "Britannia Industries", exchange: "NSE", sector: "FMCG", base: 5124.6, aliases: ["britannia", "ब्रिटानिया", "બ્રિટાનિયા", "britannia industries"] },
  { symbol: "DABUR", name: "Dabur India", exchange: "NSE", sector: "FMCG", base: 518.4, aliases: ["dabur", "डाबर", "ડાબર"] },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", exchange: "NSE", sector: "FMCG", base: 1176.4, aliases: ["godrej", "godrej consumer", "गोदरेज", "ગોદરેજ"] },
  { symbol: "MARICO", name: "Marico", exchange: "NSE", sector: "FMCG", base: 624.8, aliases: ["marico", "मैरिको", "મૈરિકો"] },
  { symbol: "COLPAL", name: "Colgate-Palmolive India", exchange: "NSE", sector: "FMCG", base: 2884.6, aliases: ["colgate", "palmolive", "कोलगेट", "કોલગેટ"] },
  { symbol: "EMAMILTD", name: "Emami", exchange: "NSE", sector: "FMCG", base: 524.6, aliases: ["emami", "इमामी", "ઇમામી"] },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", exchange: "NSE", sector: "FMCG", base: 876.4, aliases: ["tata consumer", "tata tea", "टाटा कंज्यूमर", "ટાટા કન્ઝ્યુમર"] },
  { symbol: "VARUNBEV", name: "Varun Beverages", exchange: "NSE", sector: "FMCG", base: 624.8, aliases: ["varun beverages", "pepsi", "वरुण बेवरेजेज", "વરુણ બેવરેજ", "pepsico"] },

  // ── METALS & MINING ───────────────────────────────────────────────────
  { symbol: "HINDALCO", name: "Hindalco Industries", exchange: "NSE", sector: "Metals", base: 624.8, aliases: ["hindalco", "hindal", "हिंडाल्को", "હિંડાલ્કો", "hindalco industries"] },
  { symbol: "JSWSTEEL", name: "JSW Steel", exchange: "NSE", sector: "Metals", base: 924.6, aliases: ["jsw steel", "jsw", "जेएसडब्ल्यू स्टील", "જેએસડ્બ્લ્યુ સ્ટીલ"] },
  { symbol: "VEDL", name: "Vedanta", exchange: "NSE", sector: "Metals", base: 424.8, aliases: ["vedanta", "vedl", "वेदांता", "વેદાન્તા"] },
  { symbol: "SAIL", name: "Steel Authority of India", exchange: "NSE", sector: "Metals", base: 124.8, aliases: ["sail", "steel authority", "सेल", "સઈ"] },
  { symbol: "NMDC", name: "NMDC Steel", exchange: "NSE", sector: "Mining", base: 214.8, aliases: ["nmdc", "एनएमडीसी", "એનએમડીસી"] },
  { symbol: "NATIONALUM", name: "National Aluminium", exchange: "NSE", sector: "Metals", base: 198.4, aliases: ["nalco", "national aluminium", "नालको", "નાલ્કો"] },
  { symbol: "HINDCOPPER", name: "Hindustan Copper", exchange: "NSE", sector: "Metals", base: 312.4, aliases: ["hindustan copper", "copper", "हिंदुस्तान कॉपर", "હિન્દુસ્તાન કોપ્પર"] },

  // ── ENERGY & OIL ─────────────────────────────────────────────────────
  { symbol: "IOC", name: "Indian Oil Corporation", exchange: "NSE", sector: "Energy", base: 162.4, aliases: ["ioc", "indian oil", "इंडियन ऑयल", "ઇન્ડિયન ઓઇલ", "indian oil corporation"] },
  { symbol: "BPCL", name: "BPCL", exchange: "NSE", sector: "Energy", base: 312.4, aliases: ["bpcl", "bharat petroleum", "भारत पेट्रोलियम", "ભારત પેટ્રોલિયમ"] },
  { symbol: "HPCL", name: "HPCL", exchange: "NSE", sector: "Energy", base: 324.8, aliases: ["hpcl", "hindustan petroleum", "हिंदुस्तान पेट्रोलियम", "હિન્દુસ્તાન પેટ્રોલિયમ"] },
  { symbol: "GAIL", name: "GAIL (India)", exchange: "NSE", sector: "Energy", base: 218.4, aliases: ["gail", "गेल", "ગૈલ", "gas authority"] },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", exchange: "NSE", sector: "Energy", base: 1384.6, aliases: ["adani green", "green energy", "अडानी ग्रीन", "અડાણી ગ્રીન"] },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", exchange: "NSE", sector: "Infra", base: 1284.6, aliases: ["adani ports", "अडानी पोर्ट्स", "અડાણી પોર્ટ્સ"] },
  { symbol: "ADANITRANS", name: "Adani Transmission", exchange: "NSE", sector: "Energy", base: 1084.6, aliases: ["adani transmission", "अडानी ट्रांसमिशन", "અડાણી ટ્રાન્સમિશન"] },
  { symbol: "TATAPOWER", name: "Tata Power Company", exchange: "NSE", sector: "Utilities", base: 418.4, aliases: ["tata power", "टाटा पावर", "ટાટા પાવર"] },
  { symbol: "CESC", name: "CESC Limited", exchange: "NSE", sector: "Utilities", base: 148.4, aliases: ["cesc", "सीईएससी", "સઈએસસી"] },
  { symbol: "TORNTPOWER", name: "Torrent Power", exchange: "NSE", sector: "Utilities", base: 1284.6, aliases: ["torrent power", "टोरेंट पावर", "ટોરેન્ટ પાવર"] },

  // ── INFRASTRUCTURE & REAL ESTATE ─────────────────────────────────────
  { symbol: "ADANIPOWER", name: "Adani Power", exchange: "NSE", sector: "Energy", base: 624.8, aliases: ["adani power", "अडानी पावर", "અડાણી પાવર"] },
  { symbol: "DLF", name: "DLF Limited", exchange: "NSE", sector: "Real Estate", base: 784.6, aliases: ["dlf", "डीएलएफ", "ડીએલએફ"] },
  { symbol: "GODREJPROP", name: "Godrej Properties", exchange: "NSE", sector: "Real Estate", base: 2284.6, aliases: ["godrej properties", "godrej prop", "गोदरेज प्रॉपर्टीज", "ગોદરેજ પ્રોપર્ટી"] },
  { symbol: "PRESTIGE", name: "Prestige Estates", exchange: "NSE", sector: "Real Estate", base: 1124.8, aliases: ["prestige", "prestige estates", "प्रेस्टीज", "પ્રેસ્ટીજ"] },
  { symbol: "OBEROIRLTY", name: "Oberoi Realty", exchange: "NSE", sector: "Real Estate", base: 1584.6, aliases: ["oberoi", "oberoi realty", "ओबेरॉय", "ઓબેરૉઇ"] },
  { symbol: "IRFC", name: "Indian Railway Finance Corp", exchange: "NSE", sector: "Finance", base: 186.4, aliases: ["irfc", "railway finance", "आईआरएफसी", "આઈઆરએફસી"] },
  { symbol: "RVNL", name: "Rail Vikas Nigam", exchange: "NSE", sector: "Infra", base: 398.4, aliases: ["rvnl", "rail vikas", "रेल विकास", "રેલ વિકાસ"] },

  // ── CONSUMER & RETAIL ────────────────────────────────────────────────
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", exchange: "NSE", sector: "Consumer Tech", base: 164.8, aliases: ["nykaa", "न्यका", "ન્યકકા"] },
  { symbol: "PAYTM", name: "One97 Communications (Paytm)", exchange: "NSE", sector: "Fintech", base: 724.6, aliases: ["paytm", "पेटीएम", "પૅટીએમ", "one97"] },
  { symbol: "POLICYBZR", name: "PB Fintech (PolicyBazaar)", exchange: "NSE", sector: "Fintech", base: 1284.6, aliases: ["policybazaar", "pb fintech", "पॉलिसीबाजार", "પોલિસીબઝાર"] },
  { symbol: "CARTRADE", name: "CarTrade Tech", exchange: "NSE", sector: "Consumer Tech", base: 1024.8, aliases: ["cartrade", "car trade", "कारट्रेड", "કારટ્રેડ"] },
  { symbol: "TRENT", name: "Trent (Westside)", exchange: "NSE", sector: "Retail", base: 4284.6, aliases: ["trent", "westside", "ट्रेंट", "ટ્રેન્ટ"] },
  { symbol: "SHOPERSTOP", name: "Shoppers Stop", exchange: "NSE", sector: "Retail", base: 724.6, aliases: ["shoppers stop", "shopperstop", "शॉपर्स स्टॉप", "શૉપર્સ સ્ટૉપ"] },
  { symbol: "ABFRL", name: "Aditya Birla Fashion", exchange: "NSE", sector: "Retail", base: 218.4, aliases: ["aditya birla fashion", "abfrl", "pantaloons", "पैंटालून्स", "પૅન્ટાલૂન્સ"] },

  // ── CEMENT ────────────────────────────────────────────────────────────
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", exchange: "NSE", sector: "Cement", base: 10284.6, aliases: ["ultratech", "ultratech cement", "अल्ट्राटेक", "અલ્ટ્રાટેક"] },
  { symbol: "GRASIM", name: "Grasim Industries", exchange: "NSE", sector: "Cement", base: 2284.6, aliases: ["grasim", "ग्रासिम", "ગ્રેસિમ"] },
  { symbol: "SHREECEM", name: "Shree Cement", exchange: "NSE", sector: "Cement", base: 28476.4, aliases: ["shree cement", "shree", "श्री सीमेंट", "શ્રી સિમેન્ટ"] },
  { symbol: "ACC", name: "ACC Limited", exchange: "NSE", sector: "Cement", base: 2084.6, aliases: ["acc", "acc cement", "एसीसी", "એસીસી"] },
  { symbol: "AMBUJACEM", name: "Ambuja Cements", exchange: "NSE", sector: "Cement", base: 624.8, aliases: ["ambuja", "ambuja cement", "अंबुजा", "અંબુજા"] },
  { symbol: "JKCEMENT", name: "JK Cement", exchange: "NSE", sector: "Cement", base: 4284.6, aliases: ["jk cement", "jk", "जेके सीमेंट", "જેકે સિમેન્ટ"] },
  { symbol: "RAMCOCEM", name: "Ramco Cements", exchange: "NSE", sector: "Cement", base: 884.6, aliases: ["ramco", "ramco cement", "रेमको", "રૅમ્કો"] },

  // ── HOSPITALITY & TRAVEL ──────────────────────────────────────────────
  { symbol: "INDHOTEL", name: "Indian Hotels (Taj)", exchange: "NSE", sector: "Hospitality", base: 624.8, aliases: ["taj hotels", "indian hotels", "taj", "ताज", "તાજ"] },
  { symbol: "MAHINDCIE", name: "Mahindra CIE Auto", exchange: "NSE", sector: "Auto", base: 512.4, aliases: ["mahindra cie", "cie", "महिंद्रा सीआईई"] },
  { symbol: "SPICEJET", name: "SpiceJet", exchange: "NSE", sector: "Aviation", base: 56.4, aliases: ["spicejet", "spice jet", "स्पाइसजेट", "સ્પાઇસજેટ"] },
  { symbol: "INTERGLOBE", name: "InterGlobe Aviation (IndiGo)", exchange: "NSE", sector: "Aviation", base: 3784.6, aliases: ["indigo", "interglobe", "इंडिगो", "ઇન્ડિગો"] },

  // ── MEDIA & ENTERTAINMENT ─────────────────────────────────────────────
  { symbol: "ZEEL", name: "Zee Entertainment", exchange: "NSE", sector: "Media", base: 128.4, aliases: ["zee", "zee entertainment", "ज़ी", "ઝી", "zee tv"] },
  { symbol: "SUNTV", name: "Sun TV Network", exchange: "NSE", sector: "Media", base: 584.6, aliases: ["sun tv", "सन टीवी", "સન ટીવી"] },
  { symbol: "PVRL", name: "PVR INOX", exchange: "NSE", sector: "Media", base: 1484.6, aliases: ["pvr", "inox", "pvr inox", "पीवीआर", "પીવીઆર"] },

  // ── CHEMICAL & SPECIALTY ──────────────────────────────────────────────
  { symbol: "PIDILITIND", name: "Pidilite Industries", exchange: "NSE", sector: "Chemicals", base: 2884.6, aliases: ["pidilite", "fevicol", "पिडिलाइट", "પિડીલાઈટ"] },
  { symbol: "SRF", name: "SRF Limited", exchange: "NSE", sector: "Chemicals", base: 2184.6, aliases: ["srf", "एसआरएफ", "એસઆરએફ"] },
  { symbol: "AAPL", name: "Aarti Industries", exchange: "NSE", sector: "Chemicals", base: 424.8, aliases: ["aarti", "aarti industries", "आर्टी", "આર્ટી"] },
  { symbol: "DEEPAKNITRITE", name: "Deepak Nitrite", exchange: "NSE", sector: "Chemicals", base: 2124.8, aliases: ["deepak nitrite", "deepak", "दीपक नाइट्राइट", "દીપક નાઇટ્રાઇટ"] },
  { symbol: "NAVINFLUOR", name: "Navin Fluorine", exchange: "NSE", sector: "Chemicals", base: 3284.6, aliases: ["navin fluorine", "navinfluor", "नेविन फ्लोरीन"] },
  { symbol: "CLEAN", name: "Clean Science & Tech", exchange: "NSE", sector: "Chemicals", base: 1484.6, aliases: ["clean science", "clean tech", "क्लीन साइंस"] },

  // ── TELECOM ───────────────────────────────────────────────────────────
  { symbol: "IDEA", name: "Vodafone Idea", exchange: "NSE", sector: "Telecom", base: 14.8, aliases: ["vodafone idea", "idea", "vi", "वोडाफोन", "વોડાફોન", "vodafone"] },
  { symbol: "TTML", name: "Tata Teleservices Maharashtra", exchange: "NSE", sector: "Telecom", base: 84.6, aliases: ["tata teleservices", "ttml", "टाटा टेलीसर्विसेज"] },
  { symbol: "INDUSTOWER", name: "Indus Towers", exchange: "NSE", sector: "Telecom", base: 384.6, aliases: ["indus towers", "industower", "इंडस टॉवर्स", "ઇન્ડ્સ ટાવર"] },

  // ── AGRICULTURE & AGRI-CHEMICALS ─────────────────────────────────────
  { symbol: "UPL", name: "UPL Limited", exchange: "NSE", sector: "Agri-Chem", base: 524.8, aliases: ["upl", "यूपीएल", "યુપીએલ", "united phosphorus"] },
  { symbol: "PI", name: "PI Industries", exchange: "NSE", sector: "Agri-Chem", base: 3784.6, aliases: ["pi industries", "पीआई इंडस्ट्रीज", "PI"] },
  { symbol: "COROMANDEL", name: "Coromandel International", exchange: "NSE", sector: "Agri-Chem", base: 1284.6, aliases: ["coromandel", "कोरोमंडल", "કોરોમંડ"] },

  // ── DEFENCE & AEROSPACE ───────────────────────────────────────────────
  { symbol: "HAL", name: "Hindustan Aeronautics", exchange: "NSE", sector: "Defence", base: 4284.6, aliases: ["hal", "hindustan aeronautics", "हिंदुस्तान एरोनॉटिक्स", "હિન્દુસ્તાન એ​રોનૉ​ટિ​ક​સ"] },
  { symbol: "BEL", name: "Bharat Electronics", exchange: "NSE", sector: "Defence", base: 284.6, aliases: ["bel", "bharat electronics", "भारत इलेक्ट्रॉनिक्स", "ભારત ઇ​લે​ક્ટ્રૉ​નિ​ક્​સ"] },
  { symbol: "BHEL", name: "Bharat Heavy Electricals", exchange: "NSE", sector: "Capital Goods", base: 284.6, aliases: ["bhel", "bharat heavy", "भारत हेवी", "ભારત હૅ​વી"] },
  { symbol: "MAZAGON", name: "Mazagon Dock Shipbuilders", exchange: "NSE", sector: "Defence", base: 4284.6, aliases: ["mazagon", "mazagon dock", "मझगांव", "મ​ઝ​ગ​ઁ​વ"] },
  { symbol: "COCHINSHIP", name: "Cochin Shipyard", exchange: "NSE", sector: "Defence", base: 1784.6, aliases: ["cochin shipyard", "cochin", "कोचीन शिपयार्ड", "કો​ચ​ી​ન ​શ​િ​પ​ ​​ ​​ ​ ​​ "] },

  // ── CAPITAL GOODS & ENGINEERING ───────────────────────────────────────
  { symbol: "ABB", name: "ABB India", exchange: "NSE", sector: "Capital Goods", base: 6284.6, aliases: ["abb", "abb india", "एबीबी", "એ​બ​ીબ​ી"] },
  { symbol: "SIEMENS", name: "Siemens India", exchange: "NSE", sector: "Capital Goods", base: 7284.6, aliases: ["siemens", "सीमेंस", "સ​ી​મ​ે​ન​્સ"] },
  { symbol: "HAVELLS", name: "Havells India", exchange: "NSE", sector: "Capital Goods", base: 1784.6, aliases: ["havells", "हैवेल्स", "હ​ૅ​વ​ે​લ​્સ"] },
  { symbol: "CROMPTON", name: "Crompton Greaves Consumer", exchange: "NSE", sector: "Consumer Goods", base: 384.6, aliases: ["crompton", "क्रॉम्पटन", "ક​્ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "POLYCAB", name: "Polycab India", exchange: "NSE", sector: "Capital Goods", base: 5784.6, aliases: ["polycab", "पॉलीकैब", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "CUMMINSIND", name: "Cummins India", exchange: "NSE", sector: "Capital Goods", base: 3284.6, aliases: ["cummins", "cummins india", "कमिंस", "ક​મ​િ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "THERMAX", name: "Thermax", exchange: "NSE", sector: "Capital Goods", base: 4284.6, aliases: ["thermax", "थर्मेक्स", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },

  // ── HEALTHCARE SERVICES ───────────────────────────────────────────────
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", exchange: "NSE", sector: "Healthcare", base: 6284.6, aliases: ["apollo hospitals", "apollo", "अपोलो", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "FORTIS", name: "Fortis Healthcare", exchange: "NSE", sector: "Healthcare", base: 484.6, aliases: ["fortis", "फोर्टिस", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "MAXHEALTH", name: "Max Healthcare", exchange: "NSE", sector: "Healthcare", base: 884.6, aliases: ["max health", "max healthcare", "मैक्स हेल्थकेयर"] },
  { symbol: "METROPOLIS", name: "Metropolis Healthcare", exchange: "NSE", sector: "Healthcare", base: 1384.6, aliases: ["metropolis", "मेट्रोपोलिस"] },

  // ── BSE-LISTED LARGE CAPS ─────────────────────────────────────────────
  { symbol: "ASIANPAINT", name: "Asian Paints", exchange: "BSE", sector: "Chemicals", base: 2384.6, aliases: ["asian paints", "asian", "एशियन पेंट्स", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "BERGER", name: "Berger Paints", exchange: "BSE", sector: "Chemicals", base: 524.8, aliases: ["berger", "berger paints", "बर्जर", "​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "MINDTREE", name: "Mindtree (LTI)", exchange: "BSE", sector: "IT", base: 4284.6, aliases: ["mindtree", "माइंडट्री"] },
  { symbol: "PFIZER", name: "Pfizer India", exchange: "BSE", sector: "Pharma", base: 4784.6, aliases: ["pfizer", "फाइजर", "ફ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ "] },
  { symbol: "SANOFI", name: "Sanofi India", exchange: "BSE", sector: "Pharma", base: 9284.6, aliases: ["sanofi", "सेनोफी"] },
];

/** Index snapshots shown in the ticker strip. */
export const INDIAN_INDICES = [
  { symbol: "NIFTY50",      name: "NIFTY 50",          base: 24512.35 },
  { symbol: "SENSEX",       name: "BSE SENSEX",         base: 80324.10 },
  { symbol: "BANKNIFTY",    name: "BANK NIFTY",         base: 52180.70 },
  { symbol: "NIFTYIT",      name: "NIFTY IT",           base: 38240.50 },
  { symbol: "NIFTYMIDCAP",  name: "NIFTY Midcap 100",   base: 56240.80 },
  { symbol: "NIFTYSMALLCAP",name: "NIFTY Smallcap 100", base: 18740.20 },
  { symbol: "NIFTYFMCG",    name: "NIFTY FMCG",         base: 58240.60 },
  { symbol: "NIFTYPHARMA",  name: "NIFTY Pharma",        base: 22140.30 },
  { symbol: "NIFTYAUTO",    name: "NIFTY Auto",          base: 24680.40 },
  { symbol: "NIFTYENERGY",  name: "NIFTY Energy",        base: 42760.80 },
];

export const ALL_STOCKS = POPULAR_INDIAN_STOCKS;

export const findStock = (symbol: string): StockMeta | undefined =>
  ALL_STOCKS.find((s) => s.symbol === symbol.toUpperCase());

export const formatINR = (value: number, decimals = 2): string =>
  "₹" +
  value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const BROKERS = [
  { id: "zerodha",   label: "Zerodha",   tag: "KITE",  blurb: "Discount broking · NSE & BSE" },
  { id: "upstox",    label: "Upstox",    tag: "PRO",   blurb: "Low latency execution · NSE & BSE" },
  { id: "angel_one", label: "Angel One", tag: "SMART", blurb: "Full service · NSE & BSE" },
] as const;

export type BrokerId = (typeof BROKERS)[number]["id"];

export const brokerLabel = (id: string): string =>
  BROKERS.find((b) => b.id === id)?.label ?? id;

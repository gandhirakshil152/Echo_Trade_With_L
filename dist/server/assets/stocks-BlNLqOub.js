//#region src/lib/stocks.ts
/** NSE / BSE universe used across the terminal. All prices in INR. */
var POPULAR_INDIAN_STOCKS = [
	{
		symbol: "RELIANCE",
		name: "Reliance Industries",
		exchange: "NSE",
		sector: "Energy",
		base: 1428.5,
		aliases: ["reliance", "ril"]
	},
	{
		symbol: "TCS",
		name: "Tata Consultancy Services",
		exchange: "NSE",
		sector: "IT",
		base: 3186.2,
		aliases: ["tcs", "tata consultancy"]
	},
	{
		symbol: "HDFCBANK",
		name: "HDFC Bank",
		exchange: "NSE",
		sector: "Banking",
		base: 1712.9,
		aliases: ["hdfc", "hdfc bank"]
	},
	{
		symbol: "INFY",
		name: "Infosys",
		exchange: "NSE",
		sector: "IT",
		base: 1562.4,
		aliases: ["infosys", "infy"]
	},
	{
		symbol: "ICICIBANK",
		name: "ICICI Bank",
		exchange: "NSE",
		sector: "Banking",
		base: 1284.7,
		aliases: ["icici", "icici bank"]
	},
	{
		symbol: "SBIN",
		name: "State Bank of India",
		exchange: "NSE",
		sector: "Banking",
		base: 812.35,
		aliases: ["sbi", "state bank"]
	},
	{
		symbol: "BHARTIARTL",
		name: "Bharti Airtel",
		exchange: "NSE",
		sector: "Telecom",
		base: 1655.8,
		aliases: ["airtel", "bharti"]
	},
	{
		symbol: "ITC",
		name: "ITC Limited",
		exchange: "NSE",
		sector: "FMCG",
		base: 412.15,
		aliases: ["itc"]
	},
	{
		symbol: "LT",
		name: "Larsen & Toubro",
		exchange: "NSE",
		sector: "Infra",
		base: 3624.5,
		aliases: [
			"larsen",
			"l and t",
			"lt"
		]
	},
	{
		symbol: "TATAMOTORS",
		name: "Tata Motors",
		exchange: "NSE",
		sector: "Auto",
		base: 724.6,
		aliases: ["tata motors"]
	},
	{
		symbol: "MARUTI",
		name: "Maruti Suzuki",
		exchange: "NSE",
		sector: "Auto",
		base: 12480,
		aliases: ["maruti", "suzuki"]
	},
	{
		symbol: "AXISBANK",
		name: "Axis Bank",
		exchange: "NSE",
		sector: "Banking",
		base: 1108.2,
		aliases: ["axis"]
	},
	{
		symbol: "WIPRO",
		name: "Wipro",
		exchange: "NSE",
		sector: "IT",
		base: 262.9,
		aliases: ["wipro"]
	},
	{
		symbol: "HINDUNILVR",
		name: "Hindustan Unilever",
		exchange: "NSE",
		sector: "FMCG",
		base: 2384.7,
		aliases: ["hul", "unilever"]
	},
	{
		symbol: "SUNPHARMA",
		name: "Sun Pharma",
		exchange: "NSE",
		sector: "Pharma",
		base: 1712.4,
		aliases: ["sun pharma"]
	},
	{
		symbol: "ADANIENT",
		name: "Adani Enterprises",
		exchange: "NSE",
		sector: "Conglomerate",
		base: 2384.1,
		aliases: ["adani"]
	},
	{
		symbol: "TATASTEEL",
		name: "Tata Steel",
		exchange: "NSE",
		sector: "Metals",
		base: 142.35,
		aliases: ["tata steel"]
	},
	{
		symbol: "ZOMATO",
		name: "Eternal (Zomato)",
		exchange: "NSE",
		sector: "Consumer Tech",
		base: 268.4,
		aliases: ["zomato", "eternal"]
	},
	{
		symbol: "BAJFINANCE",
		name: "Bajaj Finance",
		exchange: "NSE",
		sector: "NBFC",
		base: 6890.5,
		aliases: ["bajaj finance", "bajaj"]
	},
	{
		symbol: "ONGC",
		name: "Oil & Natural Gas Corp",
		exchange: "BSE",
		sector: "Energy",
		base: 245.8,
		aliases: ["ongc"]
	},
	{
		symbol: "COALINDIA",
		name: "Coal India",
		exchange: "BSE",
		sector: "Mining",
		base: 398.6,
		aliases: ["coal india", "coal"]
	},
	{
		symbol: "POWERGRID",
		name: "Power Grid Corp",
		exchange: "BSE",
		sector: "Utilities",
		base: 312.4,
		aliases: ["power grid"]
	},
	{
		symbol: "NTPC",
		name: "NTPC Limited",
		exchange: "BSE",
		sector: "Utilities",
		base: 348.9,
		aliases: ["ntpc"]
	},
	{
		symbol: "IRCTC",
		name: "IRCTC",
		exchange: "BSE",
		sector: "Travel",
		base: 782.3,
		aliases: ["irctc", "railway"]
	},
	{
		symbol: "DMART",
		name: "Avenue Supermarts (DMart)",
		exchange: "BSE",
		sector: "Retail",
		base: 4120,
		aliases: ["dmart", "avenue"]
	},
	{
		symbol: "TITAN",
		name: "Titan Company",
		exchange: "NSE",
		sector: "Consumer",
		base: 3364.2,
		aliases: ["titan"]
	}
];
/** Index snapshots shown in the ticker strip. */
var INDIAN_INDICES = [
	{
		symbol: "NIFTY50",
		name: "NIFTY 50",
		base: 24512.35
	},
	{
		symbol: "SENSEX",
		name: "BSE SENSEX",
		base: 80324.1
	},
	{
		symbol: "BANKNIFTY",
		name: "BANK NIFTY",
		base: 52180.7
	},
	{
		symbol: "NIFTYIT",
		name: "NIFTY IT",
		base: 38240.5
	}
];
var ALL_STOCKS = POPULAR_INDIAN_STOCKS;
var findStock = (symbol) => ALL_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
var formatINR = (value, decimals = 2) => "₹" + value.toLocaleString("en-IN", {
	minimumFractionDigits: decimals,
	maximumFractionDigits: decimals
});
var BROKERS = [
	{
		id: "zerodha",
		label: "Zerodha",
		tag: "KITE",
		blurb: "Discount broking · NSE & BSE"
	},
	{
		id: "upstox",
		label: "Upstox",
		tag: "PRO",
		blurb: "Low latency execution · NSE & BSE"
	},
	{
		id: "angel_one",
		label: "Angel One",
		tag: "SMART",
		blurb: "Full service · NSE & BSE"
	}
];
var brokerLabel = (id) => BROKERS.find((b) => b.id === id)?.label ?? id;
//#endregion
export { brokerLabel as a, POPULAR_INDIAN_STOCKS as i, BROKERS as n, findStock as o, INDIAN_INDICES as r, formatINR as s, ALL_STOCKS as t };

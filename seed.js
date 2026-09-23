// Seed data — loaded into localStorage only the first time the app runs.
// Edit here to change the starting catalog, or just use the app UI after first load.

const SEED_ENTRIES = [
  {
    type:"looking", make:"Porsche", model:"992 GT3 / 991.2 GT3RS", year:"", mileage:"Low km",
    vin:"", location:"GCC / EU", priority:"High", process:"Sourcing", leads:"",
    amount:700000, currency:"USD", notes:"GCC/EU specs. Budget 700k and under.", image:"", log:[]
  },
  {
    type:"looking", make:"Mercedes-Benz", model:"SL63", year:"2022-2024", mileage:"",
    vin:"", location:"", priority:"Medium", process:"Sourcing", leads:"",
    amount:500000, currency:"USD", notes:"No red interior.", image:"", log:[]
  },
  {
    type:"looking", make:"Mercedes-Benz", model:"S-Class", year:"2026", mileage:"Under 10,000km",
    vin:"", location:"GCC", priority:"Medium", process:"Sourcing", leads:"",
    amount:500000, currency:"USD", notes:"Long wheel base. Sub 500k budget.", image:"", log:[]
  },
  {
    type:"looking", make:"BMW", model:"7 Series", year:"2026", mileage:"",
    vin:"", location:"GCC", priority:"High", process:"Sourcing", leads:"",
    amount:0, currency:"USD", notes:"White or black. Needed for export to Iran.", image:"", log:[]
  },
  {
    type:"looking", make:"Ferrari", model:"California", year:"2015", mileage:"",
    vin:"", location:"", priority:"Medium", process:"Sourcing", leads:"",
    amount:0, currency:"USD", notes:"Red exterior. DM for details.", image:"", log:[]
  },
  {
    type:"looking", make:"Mercedes-Benz", model:"S-Class", year:"2023-2024", mileage:"30,000km max",
    vin:"", location:"GCC", priority:"Medium", process:"Sourcing", leads:"",
    amount:320000, currency:"USD", notes:"", image:"", log:[]
  },
  {
    type:"looking", make:"Rolls-Royce", model:"Cullinan Black Badge", year:"2021+", mileage:"",
    vin:"", location:"GCC or Japan", priority:"High", process:"Sourcing", leads:"",
    amount:1000000, currency:"USD", notes:"Black exterior.", image:"", log:[]
  },
  {
    type:"looking", make:"Bentley", model:"GTC", year:"2025/2026", mileage:"Low mileage",
    vin:"", location:"GCC", priority:"Medium", process:"Sourcing", leads:"",
    amount:1100000, currency:"USD", notes:"White / light coloured exterior.", image:"", log:[]
  },
  {
    type:"looking", make:"Mercedes-Benz", model:"G63", year:"2025", mileage:"",
    vin:"", location:"GCC", priority:"Medium", process:"Sourcing", leads:"",
    amount:0, currency:"USD", notes:"Cream interior.", image:"", log:[]
  },
  {
    type:"looking", make:"Porsche", model:"GT3RS", year:"", mileage:"Low, clean",
    vin:"", location:"", priority:"Medium", process:"Sourcing", leads:"",
    amount:900000, currency:"USD", notes:"", image:"", log:[]
  },
  {
    type:"looking", make:"Ferrari", model:"SP3", year:"", mileage:"",
    vin:"", location:"", priority:"Urgent", process:"Sourcing", leads:"",
    amount:33000000, currency:"USD", notes:"Most urgent lead. Budget 32.5-33M.", image:"", log:[]
  },
  {
    type:"looking", make:"Ferrari", model:"F8 Tributo", year:"", mileage:"",
    vin:"", location:"GCC only", priority:"Medium", process:"Sourcing", leads:"",
    amount:1000000, currency:"USD", notes:"Off market only.", image:"", log:[]
  },
  {
    type:"looking", make:"Ferrari", model:"458 Spyder", year:"", mileage:"",
    vin:"", location:"GCC", priority:"Medium", process:"Sourcing", leads:"",
    amount:630000, currency:"USD", notes:"Budget 580k-630k.", image:"", log:[]
  },

  {
    type:"selling", make:"Ferrari", model:"SF90 XX Spider", year:"", mileage:"",
    vin:"", location:"Europe", priority:"Medium", process:"Available", leads:"",
    amount:1900000, currency:"EUR", notes:"", image:"", log:[]
  },
  {
    type:"selling", make:"Lamborghini", model:"Sian", year:"", mileage:"",
    vin:"", location:"UAE", priority:"Medium", process:"Available", leads:"",
    amount:11600000, currency:"EUR", notes:"1 of 63. Cheapest in the UAE.", image:"", log:[]
  },
  {
    type:"selling", make:"Ferrari", model:"488 Pista", year:"", mileage:"",
    vin:"", location:"UK (LHD)", priority:"Medium", process:"Available", leads:"",
    amount:0, currency:"GBP", notes:"Off market. LHD.", image:"", log:[]
  },
  {
    type:"selling", make:"Ferrari", model:"Enzo Ferrari", year:"2004", mileage:"16,000km",
    vin:"", location:"Netherlands", priority:"Medium", process:"Available", leads:"Alex",
    amount:7150000, currency:"EUR",
    notes:"Paint: Giallo Modena. Interior: Nero leather. One of 31 in Giallo Modena. Giallo stitching. 3 owners from new. Original paint, books and tools. Germany delivered new, German registered. All services at same dealership, last service 2025. EU VAT paid / private car.",
    image:"", log:[]
  },
  {
    type:"selling", make:"Mercedes-Benz", model:"CLK GTR Coupe", year:"", mileage:"",
    vin:"", location:"", priority:"Medium", process:"Available", leads:"",
    amount:32000000, currency:"USD", notes:"", image:"", log:[]
  },
  {
    type:"selling", make:"Mercedes-Benz", model:"CLK GTR Roadster", year:"", mileage:"",
    vin:"", location:"", priority:"Medium", process:"Available", leads:"",
    amount:40000000, currency:"USD", notes:"", image:"", log:[]
  }
];


export interface Region {
  name: string;
  state: string;
  center: {
    lat: number;
    lng: number;
  };
}

export const regions: Region[] = [
  // --- SOUTH AUSTRALIA ---
  { name: "Barossa Valley, SA", state: "South Australia", center: { lat: -34.53, lng: 138.95 } },
  { name: "McLaren Vale, SA", state: "South Australia", center: { lat: -35.22, lng: 138.54 } },
  { name: "Adelaide Hills, SA", state: "South Australia", center: { lat: -34.95, lng: 138.75 } },
  { name: "Clare Valley, SA", state: "South Australia", center: { lat: -33.83, lng: 138.61 } },
  { name: "Coonawarra, SA", state: "South Australia", center: { lat: -37.29, lng: 140.83 } },
  { name: "Eden Valley, SA", state: "South Australia", center: { lat: -34.65, lng: 139.08 } },
  { name: "Langhorne Creek, SA", state: "South Australia", center: { lat: -35.30, lng: 139.04 } },

  // --- VICTORIA ---
  { name: "Yarra Valley, VIC", state: "Victoria", center: { lat: -37.67, lng: 145.45 } },
  { name: "Mornington Peninsula, VIC", state: "Victoria", center: { lat: -38.38, lng: 145.05 } },
  { name: "Rutherglen, VIC", state: "Victoria", center: { lat: -36.05, lng: 146.46 } },
  { name: "Geelong, VIC", state: "Victoria", center: { lat: -38.15, lng: 144.36 } },
  { name: "King Valley, VIC", state: "Victoria", center: { lat: -36.85, lng: 146.37 } },
  { name: "Heathcote, VIC", state: "Victoria", center: { lat: -36.92, lng: 144.71 } },
  { name: "Macedon Ranges, VIC", state: "Victoria", center: { lat: -37.42, lng: 144.56 } },
  { name: "Pyrenees, VIC", state: "Victoria", center: { lat: -37.13, lng: 143.35 } },
  
  // --- WESTERN AUSTRALIA ---
  { name: "Margaret River, WA", state: "Western Australia", center: { lat: -33.95, lng: 115.07 } },
  { name: "Swan Valley, WA", state: "Western Australia", center: { lat: -31.80, lng: 116.00 } },
  { name: "Great Southern, WA", state: "Western Australia", center: { lat: -34.60, lng: 117.80 } },
  { name: "Geographe, WA", state: "Western Australia", center: { lat: -33.64, lng: 115.70 } },
  
  // --- NEW SOUTH WALES ---
  { name: "Hunter Valley, NSW", state: "New South Wales", center: { lat: -32.78, lng: 151.30 } },
  { name: "Orange, NSW", state: "New South Wales", center: { lat: -33.28, lng: 149.10 } },
  { name: "Mudgee, NSW", state: "New South Wales", center: { lat: -32.60, lng: 149.58 } },
  { name: "Canberra District, ACT", state: "New South Wales", center: { lat: -35.15, lng: 149.25 } },
  { name: "Riverina, NSW", state: "New South Wales", center: { lat: -34.28, lng: 146.05 } },
  { name: "Southern Highlands, NSW", state: "New South Wales", center: { lat: -34.47, lng: 150.42 } },
  
  // --- TASMANIA ---
  { name: "Tamar Valley, TAS", state: "Tasmania", center: { lat: -41.25, lng: 146.95 } },
  { name: "Coal River Valley, TAS", state: "Tasmania", center: { lat: -42.77, lng: 147.42 } },
  { name: "Derwent Valley, TAS", state: "Tasmania", center: { lat: -42.78, lng: 147.06 } },
  { name: "East Coast, TAS", state: "Tasmania", center: { lat: -41.90, lng: 148.23 } },

  // --- QUEENSLAND ---
  { name: "Granite Belt, QLD", state: "Queensland", center: { lat: -28.65, lng: 151.93 } },
];
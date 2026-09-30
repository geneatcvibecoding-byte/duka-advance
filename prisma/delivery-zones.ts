/**
 * Delivery pricing for every Tanzanian region, roughly by distance from
 * Dar es Salaam. Shared by the demo seed and the production seed.
 * The shop owner can adjust any of these from Admin → Delivery.
 */
export const DELIVERY_ZONES: Array<
  [region: string, fee: number, etaMinDays: number, etaMaxDays: number]
> = [
  ["Dar es Salaam", 3000, 1, 2],
  ["Pwani", 6000, 1, 3],
  ["Morogoro", 8000, 2, 3],
  ["Tanga", 8000, 2, 4],
  ["Dodoma", 10000, 2, 4],
  ["Arusha", 12000, 3, 5],
  ["Kilimanjaro", 12000, 3, 5],
  ["Manyara", 12000, 3, 5],
  ["Singida", 12000, 3, 5],
  ["Iringa", 12000, 3, 5],
  ["Njombe", 13000, 3, 6],
  ["Mbeya", 14000, 3, 6],
  ["Songwe", 15000, 4, 6],
  ["Mwanza", 14000, 3, 6],
  ["Mara", 15000, 4, 6],
  ["Simiyu", 15000, 4, 6],
  ["Shinyanga", 14000, 3, 6],
  ["Geita", 15000, 4, 6],
  ["Kagera", 16000, 4, 7],
  ["Tabora", 14000, 3, 6],
  ["Kigoma", 18000, 5, 8],
  ["Katavi", 18000, 5, 8],
  ["Rukwa", 18000, 5, 8],
  ["Ruvuma", 16000, 4, 7],
  ["Lindi", 13000, 3, 6],
  ["Mtwara", 14000, 3, 6],
  ["Mjini Magharibi (Unguja)", 12000, 3, 5],
  ["Kaskazini Unguja", 14000, 4, 6],
  ["Kusini Unguja", 14000, 4, 6],
  ["Kaskazini Pemba", 16000, 5, 8],
  ["Kusini Pemba", 16000, 5, 8],
];

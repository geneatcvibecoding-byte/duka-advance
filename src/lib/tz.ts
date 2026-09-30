/**
 * Tanzania-specific helpers: administrative regions, phone numbers, currency.
 */

export type Region = {
  name: string;
  districts: string[];
};

/** All 31 regions of Tanzania with their principal districts/councils. */
export const REGIONS: Region[] = [
  { name: "Dar es Salaam", districts: ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"] },
  { name: "Pwani", districts: ["Kibaha", "Bagamoyo", "Kisarawe", "Mkuranga", "Rufiji", "Mafia", "Chalinze"] },
  { name: "Morogoro", districts: ["Morogoro Mjini", "Kilosa", "Mvomero", "Ulanga", "Kilombero", "Gairo", "Ifakara"] },
  { name: "Tanga", districts: ["Tanga Jiji", "Muheza", "Korogwe", "Lushoto", "Handeni", "Pangani", "Kilindi", "Mkinga"] },
  { name: "Arusha", districts: ["Arusha Jiji", "Arumeru", "Karatu", "Monduli", "Longido", "Ngorongoro"] },
  { name: "Kilimanjaro", districts: ["Moshi Mjini", "Moshi Vijijini", "Hai", "Rombo", "Same", "Mwanga", "Siha"] },
  { name: "Manyara", districts: ["Babati", "Hanang", "Kiteto", "Mbulu", "Simanjiro"] },
  { name: "Dodoma", districts: ["Dodoma Jiji", "Bahi", "Chamwino", "Chemba", "Kondoa", "Kongwa", "Mpwapwa"] },
  { name: "Singida", districts: ["Singida Mjini", "Iramba", "Manyoni", "Mkalama", "Ikungi", "Itigi"] },
  { name: "Tabora", districts: ["Tabora Mjini", "Igunga", "Nzega", "Sikonge", "Urambo", "Uyui", "Kaliua"] },
  { name: "Kigoma", districts: ["Kigoma Ujiji", "Kasulu", "Kibondo", "Buhigwe", "Kakonko", "Uvinza"] },
  { name: "Mwanza", districts: ["Nyamagana", "Ilemela", "Sengerema", "Magu", "Misungwi", "Kwimba", "Ukerewe", "Buchosa"] },
  { name: "Mara", districts: ["Musoma Mjini", "Musoma Vijijini", "Bunda", "Butiama", "Rorya", "Serengeti", "Tarime"] },
  { name: "Shinyanga", districts: ["Shinyanga Mjini", "Kahama", "Kishapu", "Msalala", "Ushetu"] },
  { name: "Simiyu", districts: ["Bariadi", "Busega", "Itilima", "Maswa", "Meatu"] },
  { name: "Geita", districts: ["Geita Mjini", "Bukombe", "Chato", "Mbogwe", "Nyang'hwale"] },
  { name: "Kagera", districts: ["Bukoba Mjini", "Bukoba Vijijini", "Biharamulo", "Karagwe", "Kyerwa", "Missenyi", "Muleba", "Ngara"] },
  { name: "Katavi", districts: ["Mpanda Mjini", "Mlele", "Tanganyika", "Nsimbo"] },
  { name: "Rukwa", districts: ["Sumbawanga Mjini", "Kalambo", "Nkasi", "Sumbawanga Vijijini"] },
  { name: "Mbeya", districts: ["Mbeya Jiji", "Mbeya Vijijini", "Chunya", "Kyela", "Mbarali", "Rungwe", "Busokelo"] },
  { name: "Songwe", districts: ["Vwawa", "Ileje", "Mbozi", "Momba", "Songwe"] },
  { name: "Iringa", districts: ["Iringa Mjini", "Iringa Vijijini", "Kilolo", "Mufindi", "Mafinga"] },
  { name: "Njombe", districts: ["Njombe Mjini", "Ludewa", "Makete", "Makambako", "Wanging'ombe"] },
  { name: "Ruvuma", districts: ["Songea Mjini", "Songea Vijijini", "Mbinga", "Namtumbo", "Tunduru", "Nyasa", "Madaba"] },
  { name: "Lindi", districts: ["Lindi Mjini", "Kilwa", "Liwale", "Nachingwea", "Ruangwa", "Mtama"] },
  { name: "Mtwara", districts: ["Mtwara Mikindani", "Masasi", "Nanyumbu", "Newala", "Tandahimba", "Nanyamba"] },
  { name: "Mjini Magharibi (Unguja)", districts: ["Mjini", "Magharibi A", "Magharibi B"] },
  { name: "Kaskazini Unguja", districts: ["Kaskazini A", "Kaskazini B"] },
  { name: "Kusini Unguja", districts: ["Kati", "Kusini"] },
  { name: "Kaskazini Pemba", districts: ["Wete", "Micheweni"] },
  { name: "Kusini Pemba", districts: ["Chake Chake", "Mkoani"] },
];

export const REGION_NAMES = REGIONS.map((r) => r.name);

export function districtsFor(region: string): string[] {
  return REGIONS.find((r) => r.name === region)?.districts ?? [];
}

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------

/**
 * Normalise any Tanzanian mobile number to +255XXXXXXXXX.
 * Accepts 0712345678, 712345678, 255712345678, +255 712 345 678, etc.
 * Returns null when the number is not a valid TZ mobile number.
 */
export function normalizePhone(input: string): string | null {
  const digits = (input ?? "").replace(/\D/g, "");
  let local: string;

  if (digits.startsWith("255")) local = digits.slice(3);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;

  // TZ mobile: 9 digits, network prefix 6x or 7x.
  if (!/^[67]\d{8}$/.test(local)) return null;
  return `+255${local}`;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** +255712345678 -> 0712 345 678 (how Tanzanians actually read numbers). */
export function formatPhone(e164: string): string {
  const local = e164.replace(/^\+255/, "");
  if (local.length !== 9) return e164;
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/** Digits-only form wa.me expects: 255712345678 */
export function whatsappNumber(e164: string): string {
  return e164.replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Money — whole Tanzanian shillings, never fractional
// ---------------------------------------------------------------------------

export function formatTZS(amount: number): string {
  return `TSh ${Math.round(amount).toLocaleString("en-US")}`;
}

/** Compact form for dense tables: TSh 1.2M */
export function formatTZSCompact(amount: number): string {
  if (amount >= 1_000_000) return `TSh ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `TSh ${Math.round(amount / 1000)}K`;
  return formatTZS(amount);
}

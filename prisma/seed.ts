/**
 * Seed data for Duka.
 *
 * Run with:  npx prisma db seed
 *
 * Product artwork is generated as local SVG files under public/img/, so the
 * shop renders correctly with no internet connection and no external image
 * host. Replace them with real photographs through the admin panel.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DELIVERY_ZONES } from "./delivery-zones";
import { UNIVERSITY_SEEDS } from "./universities";
import { VIEWS, hasArt, renderProductArt } from "./product-art";

// Seeding runs DDL-adjacent bulk writes, so it uses the direct connection.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Placeholder artwork
// ---------------------------------------------------------------------------

const PUBLIC_IMG = join(process.cwd(), "public", "img");

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A calm gradient tile with the product name — looks deliberate, not broken. */
function placeholderSvg(label: string, hue: number): string {
  const lines = wrapText(label, 16).slice(0, 3);
  const startY = 400 - (lines.length - 1) * 26;
  const text = lines
    .map(
      (line, i) =>
        `<text x="400" y="${startY + i * 52}" text-anchor="middle" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="42" font-weight="600" fill="hsl(${hue} 45% 22%)">${escapeXml(line)}</text>`,
    )
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 70% 92%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 60% 82%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="640" cy="170" r="150" fill="hsl(${hue} 60% 96%)" opacity="0.55"/>
  <circle cx="170" cy="650" r="200" fill="hsl(${(hue + 40) % 360} 55% 70%)" opacity="0.25"/>
  ${text}
</svg>
`;
}

function writePlaceholder(dir: string, slug: string, label: string, hue: number) {
  const target = join(PUBLIC_IMG, dir);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, `${slug}.svg`), placeholderSvg(label, hue), "utf8");
}

/**
 * Writes the three drawn views for a product and returns their URLs in gallery
 * order. Products without a drawing fall back to the plain tile, so adding a
 * product to the catalogue never breaks the seed.
 */
function writeProductViews(slug: string, label: string, hue: number): string[] {
  if (!hasArt(slug)) {
    writePlaceholder("p", slug, label, hue);
    return [`/img/p/${slug}.svg`];
  }

  const target = join(PUBLIC_IMG, "p");
  mkdirSync(target, { recursive: true });

  return VIEWS.map((view, variant) => {
    const svg = renderProductArt(slug, variant)!;
    const name = variant === 0 ? `${slug}.svg` : `${slug}-${view}.svg`;
    writeFileSync(join(target, name), svg, "utf8");
    return `/img/p/${name}`;
  });
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

type SeedVariant = {
  optionEn: string;
  optionSw: string;
  value: string;
  priceDelta?: number;
  stock: number;
};

type SeedProduct = {
  slug: string;
  nameEn: string;
  nameSw: string;
  descEn: string;
  descSw: string;
  brand: string;
  price: number;
  compareAt?: number;
  stock: number;
  featured?: boolean;
  variants?: SeedVariant[];
};

type SeedCategory = {
  slug: string;
  nameEn: string;
  nameSw: string;
  descEn: string;
  descSw: string;
  hue: number;
  products: SeedProduct[];
};

const CATALOGUE: SeedCategory[] = [
  {
    slug: "electronics",
    nameEn: "Electronics",
    nameSw: "Elektroniki",
    descEn: "Televisions, audio, solar power and everyday electricals.",
    descSw: "Televisheni, sauti, umeme wa jua na vifaa vya kila siku.",
    hue: 215,
    products: [
      {
        slug: "solar-home-kit-30w",
        nameEn: "Solar Home Lighting Kit 30W",
        nameSw: "Kifaa cha Taa za Jua 30W",
        descEn:
          "A complete off-grid lighting kit: a 30W panel, a sealed battery, three LED bulbs with switches, and a USB port for charging phones. Installs in under an hour with the included wiring. Ideal for homes and shops in areas with unreliable grid power.",
        descSw:
          "Kifaa kamili cha taa bila umeme wa gridi: paneli ya 30W, betri iliyofungwa, balbu tatu za LED zenye swichi, na tundu la USB kuchaji simu. Huwekwa ndani ya saa moja kwa nyaya zilizomo. Kinafaa kwa nyumba na maduka maeneo yenye umeme usio wa uhakika.",
        brand: "SolarMax",
        price: 185000,
        compareAt: 225000,
        stock: 24,
        featured: true,
      },
      {
        slug: "smart-tv-55-inch",
        nameEn: 'Smart TV 55" 4K',
        nameSw: 'Televisheni Smart 55" 4K',
        descEn:
          "A 55-inch 4K smart television with built-in WiFi, two HDMI ports and a USB port for playing films from a flash disk. Wall bracket and remote included. Comes with a one-year local warranty.",
        descSw:
          "Televisheni smart ya inchi 55 ya 4K yenye WiFi ndani, milango miwili ya HDMI na tundu la USB kuangalia filamu kutoka kwenye flash. Ina bracket ya ukutani na rimoti. Ina dhamana ya mwaka mmoja hapa nchini.",
        brand: "Vista",
        price: 749000,
        stock: 8,
        featured: true,
      },
      {
        slug: "bluetooth-speaker-portable",
        nameEn: "Portable Bluetooth Speaker",
        nameSw: "Spika ya Bluetooth ya Kubeba",
        descEn:
          "Water-resistant Bluetooth speaker with twelve hours of playback on one charge. Loud enough for a small gathering, small enough for a backpack. Also plays from a memory card or FM radio.",
        descSw:
          "Spika ya Bluetooth isiyoingia maji yenye saa kumi na mbili za kucheza kwa chaji moja. Ina sauti ya kutosha kwa sherehe ndogo, na ni ndogo ya kutosha kubeba mkobani. Pia inacheza kutoka kadi ya kumbukumbu au redio ya FM.",
        brand: "BoomBox",
        price: 89000,
        compareAt: 110000,
        stock: 40,
        variants: [
          { optionEn: "Colour", optionSw: "Rangi", value: "Black", stock: 20 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Blue", stock: 12 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Red", stock: 8 },
        ],
      },
      {
        slug: "rechargeable-led-torch",
        nameEn: "Rechargeable LED Torch",
        nameSw: "Tochi ya LED ya Kuchaji",
        descEn:
          "A bright rechargeable torch that holds its charge for weeks. Three brightness settings plus a side lamp for close work. Charges from any phone charger.",
        descSw:
          "Tochi kali ya kuchaji inayoshika chaji kwa wiki kadhaa. Ina viwango vitatu vya mwanga pamoja na taa ya pembeni kwa kazi za karibu. Inachajiwa kwa chaja yoyote ya simu.",
        brand: "BrightOne",
        price: 22000,
        stock: 65,
      },
    ],
  },
  {
    slug: "phones-accessories",
    nameEn: "Phones & Accessories",
    nameSw: "Simu na Vifaa",
    descEn: "Smartphones, chargers, power banks and everything that goes with them.",
    descSw: "Simu janja, chaja, betri za akiba na kila kinachoambatana nazo.",
    hue: 265,
    products: [
      {
        slug: "smartphone-128gb",
        nameEn: "Smartphone 128GB / 6GB RAM",
        nameSw: "Simu Janja 128GB / 6GB RAM",
        descEn:
          "A 6.6-inch smartphone with 128GB of storage, 6GB of RAM and a 5000mAh battery that comfortably lasts a full day. Dual SIM, 50MP camera, and a fingerprint reader. Sold with a case and screen protector.",
        descSw:
          "Simu ya inchi 6.6 yenye hifadhi ya 128GB, RAM ya 6GB na betri ya 5000mAh inayodumu siku nzima. Ina laini mbili, kamera ya 50MP, na kisoma alama za vidole. Inauzwa na kifuniko na kioo cha kulinda skrini.",
        brand: "Nuru",
        price: 415000,
        compareAt: 465000,
        stock: 18,
        featured: true,
        variants: [
          { optionEn: "Colour", optionSw: "Rangi", value: "Midnight Black", stock: 8 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Ocean Blue", stock: 6 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Gold", stock: 4 },
        ],
      },
      {
        slug: "power-bank-20000mah",
        nameEn: "Power Bank 20,000mAh",
        nameSw: "Betri ya Akiba 20,000mAh",
        descEn:
          "Charges a typical phone four times over. Two USB outputs so you can charge a phone and a torch at the same time, with a small display showing exactly how much charge is left.",
        descSw:
          "Inachaji simu ya kawaida mara nne. Ina matundu mawili ya USB ili uchaji simu na tochi kwa wakati mmoja, na kioo kidogo kinachoonyesha chaji iliyobaki.",
        brand: "Nuru",
        price: 65000,
        stock: 52,
        featured: true,
      },
      {
        slug: "fast-charger-33w",
        nameEn: "33W Fast Charger with USB-C Cable",
        nameSw: "Chaja ya Haraka 33W na Waya wa USB-C",
        descEn:
          "Fills a modern phone battery to half in about twenty minutes. Built for Tanzanian mains voltage with surge protection, and the braided cable resists the fraying that kills cheap chargers.",
        descSw:
          "Inajaza betri ya simu ya kisasa nusu ndani ya dakika ishirini hivi. Imetengenezwa kwa voltage ya umeme wa Tanzania na kinga ya msukumo wa umeme, na waya wake uliosukwa hauchaniki kama chaja za bei rahisi.",
        brand: "Nuru",
        price: 28000,
        stock: 88,
      },
      {
        slug: "wireless-earbuds",
        nameEn: "Wireless Earbuds",
        nameSw: "Vipokea Sauti Visivyo na Waya",
        descEn:
          "Comfortable in-ear buds with a charging case that gives around twenty-four hours of total listening. Clear microphone for calls, and they pair again automatically once you open the case.",
        descSw:
          "Vipokea sauti vya masikioni vyenye kisanduku cha kuchaji kinachotoa takribani saa ishirini na nne za kusikiliza. Vina maikrofoni safi kwa simu, na vinaunganishwa tena vyenyewe ukifungua kisanduku.",
        brand: "BoomBox",
        price: 72000,
        compareAt: 95000,
        stock: 33,
      },
    ],
  },
  {
    slug: "fashion",
    nameEn: "Fashion",
    nameSw: "Mitindo",
    descEn: "Clothing and footwear, including traditional Tanzanian fabrics.",
    descSw: "Nguo na viatu, pamoja na vitambaa vya asili vya Kitanzania.",
    hue: 340,
    products: [
      {
        slug: "kitenge-two-piece-set",
        nameEn: "Kitenge Two-Piece Set",
        nameSw: "Seti ya Kitenge Vipande Viwili",
        descEn:
          "A tailored top and matching skirt in genuine wax-print kitenge. Fully lined, with a concealed zip. Every piece is cut and sewn in Dar es Salaam, so the print alignment is checked by hand.",
        descSw:
          "Blauzi iliyoshonwa vizuri na sketi inayoendana ya kitenge halisi cha nta. Ina lining kamili na zipu iliyofichwa. Kila kipande hukatwa na kushonwa Dar es Salaam, hivyo mpangilio wa michoro hukaguliwa kwa mkono.",
        brand: "Mwanzo",
        price: 95000,
        stock: 30,
        featured: true,
        variants: [
          { optionEn: "Size", optionSw: "Ukubwa", value: "S", stock: 6 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "M", stock: 10 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "L", stock: 9 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "XL", priceDelta: 5000, stock: 5 },
        ],
      },
      {
        slug: "leather-sandals-mens",
        nameEn: "Men's Leather Sandals",
        nameSw: "Ndara za Ngozi za Wanaume",
        descEn:
          "Hand-stitched sandals in full-grain leather with a hard-wearing rubber sole. They soften to the shape of your foot after a week and last for years.",
        descSw:
          "Ndara zilizoshonwa kwa mkono kwa ngozi halisi zenye sola ngumu ya mpira. Hulainika kufuata umbo la mguu wako baada ya wiki moja na hudumu miaka mingi.",
        brand: "Mwanzo",
        price: 55000,
        stock: 42,
        variants: [
          { optionEn: "Size", optionSw: "Ukubwa", value: "40", stock: 6 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "41", stock: 9 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "42", stock: 11 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "43", stock: 9 },
          { optionEn: "Size", optionSw: "Ukubwa", value: "44", stock: 7 },
        ],
      },
      {
        slug: "maasai-shuka-blanket",
        nameEn: "Maasai Shuka Blanket",
        nameSw: "Shuka la Kimasai",
        descEn:
          "A thick woven shuka in the classic checked pattern. Warm enough for cold nights upcountry, and it doubles as a throw, a wrap or a picnic blanket.",
        descSw:
          "Shuka nene lililofumwa kwa muundo wa kawaida wa vipande. Lina joto la kutosha kwa usiku wa baridi wa mikoani, na hutumika pia kama shuka la kujifunika au la pikniki.",
        brand: "Mwanzo",
        price: 35000,
        stock: 55,
        variants: [
          { optionEn: "Colour", optionSw: "Rangi", value: "Red / Black", stock: 25 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Blue / Black", stock: 18 },
          { optionEn: "Colour", optionSw: "Rangi", value: "Purple / Black", stock: 12 },
        ],
      },
      {
        slug: "cotton-kanga-pair",
        nameEn: "Cotton Kanga (Pair)",
        nameSw: "Kanga za Pamba (Jozi)",
        descEn:
          "A pair of pure cotton kanga with a printed Swahili proverb along the border. Sold as a pair, as tradition requires. Softens beautifully after the first wash.",
        descSw:
          "Jozi ya kanga za pamba halisi zenye methali ya Kiswahili iliyochapishwa pembeni. Zinauzwa jozi, kama mila inavyotaka. Hulainika vizuri baada ya kufuliwa mara ya kwanza.",
        brand: "Mwanzo",
        price: 28000,
        stock: 70,
      },
    ],
  },
  {
    slug: "home-kitchen",
    nameEn: "Home & Kitchen",
    nameSw: "Nyumbani na Jikoni",
    descEn: "Cookware, water, storage and the things that make a house work.",
    descSw: "Vyombo vya kupikia, maji, hifadhi na vitu vinavyofanya nyumba ifanye kazi.",
    hue: 25,
    products: [
      {
        slug: "nonstick-cookware-set-7pc",
        nameEn: "Non-stick Cookware Set (7 pieces)",
        nameSw: "Seti ya Vyombo vya Kupikia (Vipande 7)",
        descEn:
          "Three saucepans with lids, a frying pan and a serving spoon. The non-stick coating is free of PFOA, and the bases are thick enough to sit steady on a charcoal jiko as well as a gas ring.",
        descSw:
          "Masufuria matatu yenye mifuniko, kikaango na mwiko wa kupakulia. Rangi yake isiyoshika chakula haina PFOA, na chini yake ni nene ya kutosha kusimama imara juu ya jiko la mkaa na pia jiko la gesi.",
        brand: "HomePro",
        price: 165000,
        compareAt: 195000,
        stock: 22,
        featured: true,
      },
      {
        slug: "improved-charcoal-jiko",
        nameEn: "Improved Charcoal Jiko",
        nameSw: "Jiko Bora la Mkaa",
        descEn:
          "A ceramic-lined jiko that uses noticeably less charcoal than the plain metal kind and holds its heat far longer. Sized for a family pot.",
        descSw:
          "Jiko lenye udongo ndani linalotumia mkaa kidogo zaidi kuliko la bati la kawaida na linashika joto muda mrefu zaidi. Lina ukubwa unaofaa sufuria la familia.",
        brand: "HomePro",
        price: 32000,
        stock: 48,
      },
      {
        slug: "water-filter-20l",
        nameEn: "20L Ceramic Water Filter",
        nameSw: "Kichujio cha Maji cha Udongo 20L",
        descEn:
          "Gravity-fed ceramic filter that needs no electricity and no pressure. Removes bacteria and sediment, and the candles last around a year of ordinary family use.",
        descSw:
          "Kichujio cha udongo kinachotumia mvuto wa dunia, hakihitaji umeme wala shinikizo. Kinaondoa bakteria na tope, na mishumaa yake hudumu takribani mwaka mmoja wa matumizi ya kawaida ya familia.",
        brand: "AquaSafe",
        price: 78000,
        stock: 26,
        featured: true,
      },
      {
        slug: "thermos-flask-1900ml",
        nameEn: "Vacuum Flask 1.9L",
        nameSw: "Chupa ya Chai 1.9L",
        descEn:
          "Stainless steel vacuum flask that keeps chai hot from morning until evening. Wide mouth so it is easy to fill and easy to clean, with a screw stopper that does not leak.",
        descSw:
          "Chupa ya chuma cha pua inayohifadhi chai moto tangu asubuhi hadi jioni. Ina mdomo mpana ili kujaza na kusafisha kwa urahisi, na kizibo cha kuzungusha kisichovuja.",
        brand: "HomePro",
        price: 42000,
        stock: 37,
      },
    ],
  },
  {
    slug: "beauty-health",
    nameEn: "Beauty & Health",
    nameSw: "Urembo na Afya",
    descEn: "Skin, hair and simple home health equipment.",
    descSw: "Ngozi, nywele na vifaa rahisi vya afya ya nyumbani.",
    hue: 160,
    products: [
      {
        slug: "shea-butter-cream-500ml",
        nameEn: "Shea Butter Body Cream 500ml",
        nameSw: "Krimu ya Shea ya Mwili 500ml",
        descEn:
          "Unrefined shea butter blended into a light cream that absorbs without leaving a greasy film. No added bleaching agents — it moisturises and nothing else.",
        descSw:
          "Siagi ya shea isiyosafishwa iliyochanganywa kuwa krimu nyepesi inayoingia ngozini bila kuacha ulaini wa mafuta. Haina dawa za kubadilisha rangi — inalainisha ngozi tu.",
        brand: "Asili",
        price: 25000,
        stock: 60,
      },
      {
        slug: "coconut-hair-oil-250ml",
        nameEn: "Coconut Hair Oil 250ml",
        nameSw: "Mafuta ya Nazi ya Nywele 250ml",
        descEn:
          "Cold-pressed coconut oil from the coast, with nothing added. Works as a scalp treatment, a pre-wash conditioner, or a light daily finish.",
        descSw:
          "Mafuta ya nazi yaliyokamuliwa kwa baridi kutoka pwani, bila kuongezwa kitu chochote. Yanafaa kwa kichwa, kama kilainishi kabla ya kuosha, au kama mafuta mepesi ya kila siku.",
        brand: "Asili",
        price: 18000,
        stock: 75,
      },
      {
        slug: "blood-pressure-monitor",
        nameEn: "Digital Blood Pressure Monitor",
        nameSw: "Kipima Shinikizo la Damu",
        descEn:
          "An upper-arm monitor with a large display and a single button. Stores the last sixty readings so you can show your doctor a proper history rather than a number from this morning.",
        descSw:
          "Kipimo cha mkono wa juu chenye kioo kikubwa na kitufe kimoja. Kinahifadhi vipimo sitini vya mwisho ili umuoneshe daktari historia kamili badala ya namba ya asubuhi hii tu.",
        brand: "Afya",
        price: 135000,
        stock: 14,
      },
    ],
  },
  {
    slug: "groceries",
    nameEn: "Groceries",
    nameSw: "Vyakula",
    descEn: "Staples in family sizes, delivered to the door.",
    descSw: "Vyakula vya msingi kwa ukubwa wa familia, vinafikishwa mlangoni.",
    hue: 95,
    products: [
      {
        slug: "rice-kilombero-25kg",
        nameEn: "Kilombero Rice 25kg",
        nameSw: "Mchele wa Kilombero 25kg",
        descEn:
          "Aromatic long-grain rice from the Kilombero valley, cleaned and sold in a 25kg sack. Sorted twice, so there are no stones.",
        descSw:
          "Mchele wenye harufu nzuri wa punje ndefu kutoka bonde la Kilombero, umesafishwa na kuuzwa kwa gunia la kilo 25. Umechambuliwa mara mbili, hivyo hauna mawe.",
        brand: "Shamba",
        price: 98000,
        stock: 31,
        featured: true,
      },
      {
        slug: "sunflower-oil-5l",
        nameEn: "Sunflower Cooking Oil 5L",
        nameSw: "Mafuta ya Alizeti ya Kupikia 5L",
        descEn:
          "Locally pressed sunflower oil in a 5-litre jerrycan. Light in taste, and priced well below buying five one-litre bottles.",
        descSw:
          "Mafuta ya alizeti yaliyokamuliwa hapa nchini kwenye dumu la lita 5. Yana ladha nyepesi, na bei yake ni nafuu kuliko kununua chupa tano za lita moja.",
        brand: "Shamba",
        price: 38000,
        stock: 44,
      },
      {
        slug: "wheat-flour-10kg",
        nameEn: "Wheat Flour 10kg",
        nameSw: "Unga wa Ngano 10kg",
        descEn:
          "All-purpose wheat flour for chapati, mandazi and bread. Fine-milled and sealed in a 10kg bag.",
        descSw:
          "Unga wa ngano wa matumizi yote kwa chapati, mandazi na mikate. Umesagwa laini na kufungwa kwenye mfuko wa kilo 10.",
        brand: "Shamba",
        price: 32000,
        stock: 58,
      },
    ],
  },
];

// ---------------------------------------------------------------------------

async function main() {
  console.log("Clearing existing data…");
  await prisma.notification.deleteMany();
  await prisma.orderMessage.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.savedListing.deleteMany();
  await prisma.sellerFollow.deleteMany();
  await prisma.sellerRating.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.studentVerificationCode.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.shopSettings.deleteMany();
  await prisma.university.deleteMany();

  console.log("Shop settings…");
  await prisma.shopSettings.create({
    data: {
      id: "shop",
      nameEn: "Duka la Mtandaoni",
      nameSw: "Duka la Mtandaoni",
      taglineEn: "Genuine products, delivered across Tanzania",
      taglineSw: "Bidhaa halisi, zinafikishwa Tanzania nzima",
      phone: "+255712345678",
      whatsapp: "+255712345678",
      email: "hello@duka.co.tz",
      addressLine: "Mtaa wa Samora, Ilala, Dar es Salaam",
      mpesaName: "DUKA LA MTANDAONI LTD",
      mpesaLipaNamba: "5501234",
      tigoPesaNumber: "+255652345678",
      airtelMoneyNumber: "+255782345678",
      halopesaNumber: "+255622345678",
      bankName: "CRDB Bank",
      bankAccountName: "Duka la Mtandaoni Ltd",
      bankAccountNumber: "0150123456789",
      freeDeliveryOver: 300000,
    },
  });

  console.log("Delivery zones…");
  await prisma.deliveryZone.createMany({
    data: DELIVERY_ZONES.map(([region, fee, etaMinDays, etaMaxDays], position) => ({
      region,
      fee,
      etaMinDays,
      etaMaxDays,
      position,
    })),
  });

  console.log("Universities…");
  const universities = await Promise.all(
    UNIVERSITY_SEEDS.map((u) =>
      prisma.university.create({
        data: {
          slug: u.slug,
          nameEn: u.nameEn,
          nameSw: u.nameSw,
          emailDomain: u.emailDomain,
          region: u.region,
        },
      }),
    ),
  );
  const udsm = universities.find((u) => u.slug === "udsm");

  console.log("Users…");
  const adminPassword = await bcrypt.hash("Admin@2026", 10);
  const customerPassword = await bcrypt.hash("Customer@2026", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Shop Administrator",
      phone: "+255700000001",
      email: "admin@duka.co.tz",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const customers = await Promise.all(
    [
      { name: "Amina Hassan", phone: "+255712000001" },
      { name: "Juma Mwakalinga", phone: "+255713000002" },
      { name: "Neema Kimaro", phone: "+255714000003" },
    ].map((c) =>
      prisma.user.create({
        data: { ...c, passwordHash: customerPassword, role: "CUSTOMER" },
      }),
    ),
  );

  await prisma.address.create({
    data: {
      userId: customers[0].id,
      fullName: "Amina Hassan",
      phone: "+255712000001",
      region: "Dar es Salaam",
      district: "Kinondoni",
      street: "Mikocheni B, Wenge Road",
      landmark: "Opposite Shoppers Plaza",
      isDefault: true,
    },
  });

  // A verified student so the marketplace has someone to sell and buy. Amina
  // shares the demo customer's phone; verification itself is done from the
  // account page with the emailed code.
  await prisma.user.create({
    data: {
      name: "Amina Hassan",
      phone: "+255719000009",
      email: "amina@udsm.ac.tz",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      universityId: udsm?.id ?? null,
      studentNumber: "UDSM-2023-00427",
      studentVerifiedAt: new Date(),
    },
  });

  console.log("Catalogue…");
  let productCount = 0;

  for (const [categoryIndex, category] of CATALOGUE.entries()) {
    writePlaceholder("c", category.slug, category.nameEn, category.hue);

    const createdCategory = await prisma.category.create({
      data: {
        slug: category.slug,
        nameEn: category.nameEn,
        nameSw: category.nameSw,
        descEn: category.descEn,
        descSw: category.descSw,
        image: `/img/c/${category.slug}.svg`,
        position: categoryIndex,
      },
    });

    for (const product of category.products) {
      const imageUrls = writeProductViews(product.slug, product.nameEn, category.hue);

      await prisma.product.create({
        data: {
          slug: product.slug,
          nameEn: product.nameEn,
          nameSw: product.nameSw,
          descEn: product.descEn,
          descSw: product.descSw,
          brand: product.brand,
          sku: `DK-${String(++productCount).padStart(4, "0")}`,
          price: product.price,
          compareAt: product.compareAt ?? null,
          stock: product.stock,
          isFeatured: product.featured ?? false,
          categoryId: createdCategory.id,
          images: {
            create: imageUrls.map((url, position) => ({
              url,
              alt: product.nameEn,
              position,
            })),
          },
          variants: product.variants
            ? {
                create: product.variants.map((v, i) => ({
                  optionEn: v.optionEn,
                  optionSw: v.optionSw,
                  value: v.value,
                  priceDelta: v.priceDelta ?? 0,
                  stock: v.stock,
                  position: i,
                })),
              }
            : undefined,
        },
      });
    }
  }

  console.log("Reviews…");
  const reviewTargets = await prisma.product.findMany({
    where: { slug: { in: ["solar-home-kit-30w", "power-bank-20000mah", "kitenge-two-piece-set"] } },
  });

  const reviewCopy = [
    { rating: 5, comment: "Arrived in Mwanza in four days, exactly as described. Very happy." },
    { rating: 4, comment: "Good quality for the price. Delivery was a day later than promised." },
    { rating: 5, comment: "Bought a second one for my sister. Works perfectly." },
  ];

  for (const [i, product] of reviewTargets.entries()) {
    for (const [j, customer] of customers.entries()) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: customer.id,
          rating: reviewCopy[(i + j) % reviewCopy.length].rating,
          comment: reviewCopy[(i + j) % reviewCopy.length].comment,
          isApproved: true,
        },
      });
    }
  }

  console.log("Coupons…");
  await prisma.coupon.createMany({
    data: [
      { code: "KARIBU10", type: "PERCENT", value: 10, minSubtotal: 50000, maxUses: 500 },
      { code: "DAR5000", type: "FIXED", value: 5000, minSubtotal: 100000, maxUses: 200 },
    ],
  });

  console.log("\nSeed complete.");
  console.log(`  ${CATALOGUE.length} categories, ${productCount} products`);
  console.log(`  ${UNIVERSITY_SEEDS.length} universities`);
  console.log(`  Admin login:    0700 000 001  /  Admin@2026`);
  console.log(`  Customer login: 0712 000 001  /  Customer@2026`);
  console.log(`  Verified demo:  0719 000 009  /  Customer@2026`);
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

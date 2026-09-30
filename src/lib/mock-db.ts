/* eslint-disable @typescript-eslint/no-explicit-any */
import { UNIVERSITY_SEEDS } from "@/lib/universities";
import { DELIVERY_ZONES } from "../../prisma/delivery-zones";

// Helper for matching where clauses
function matchesCondition(val: any, cond: any): boolean {
  if (cond === undefined) return true;
  if (cond === null) return val === null;
  if (typeof cond === "object" && !Array.isArray(cond) && !(cond instanceof Date)) {
    for (const op of Object.keys(cond)) {
      const target = cond[op];
      if (op === "equals") {
        if (val !== target) return false;
      } else if (op === "not") {
        if (target === null) {
          if (val === null) return false;
        } else if (matchesCondition(val, target)) {
          return false;
        }
      } else if (op === "in") {
        if (!Array.isArray(target) || !target.includes(val)) return false;
      } else if (op === "notIn") {
        if (Array.isArray(target) && target.includes(val)) return false;
      } else if (op === "contains") {
        const strVal = String(val ?? "").toLowerCase();
        const strTarget = String(target ?? "").toLowerCase();
        if (!strVal.includes(strTarget)) return false;
      } else if (op === "startsWith") {
        if (!String(val ?? "").toLowerCase().startsWith(String(target ?? "").toLowerCase())) return false;
      } else if (op === "endsWith") {
        if (!String(val ?? "").toLowerCase().endsWith(String(target ?? "").toLowerCase())) return false;
      } else if (op === "gt") {
        const v = val instanceof Date ? val.getTime() : val;
        const t = target instanceof Date ? target.getTime() : target;
        if (!(v > t)) return false;
      } else if (op === "gte") {
        const v = val instanceof Date ? val.getTime() : val;
        const t = target instanceof Date ? target.getTime() : target;
        if (!(v >= t)) return false;
      } else if (op === "lt") {
        const v = val instanceof Date ? val.getTime() : val;
        const t = target instanceof Date ? target.getTime() : target;
        if (!(v < t)) return false;
      } else if (op === "lte") {
        const v = val instanceof Date ? val.getTime() : val;
        const t = target instanceof Date ? target.getTime() : target;
        if (!(v <= t)) return false;
      } else if (op === "some") {
        if (!Array.isArray(val) || val.length === 0) return false;
        if (Object.keys(target).length > 0) {
          if (!val.some(item => matchesWhere(item, target))) return false;
        }
      } else if (op === "mode") {
        // Handled in case-insensitive check
      } else {
        if (!val || !matchesWhere(val, { [op]: target })) return false;
      }
    }
    return true;
  }
  return val === cond;
}

function matchesWhere(item: any, where: any): boolean {
  if (!where || Object.keys(where).length === 0) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "AND") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (!list.every(sub => matchesWhere(item, sub))) return false;
    } else if (key === "OR") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (!list.some(sub => matchesWhere(item, sub))) return false;
    } else if (key === "NOT") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (list.some(sub => matchesWhere(item, sub))) return false;
    } else if (key.includes("_") && typeof cond === "object" && cond !== null) {
      // Compound unique index like userId_productId: { userId: '...', productId: '...' }
      if (!matchesWhere(item, cond)) return false;
    } else {
      const val = item[key];
      if (!matchesCondition(val, cond)) return false;
    }
  }
  return true;
}

function sortItems(items: any[], orderBy: any): any[] {
  if (!orderBy) return items;
  const orderList = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const order of orderList) {
      for (const [field, dir] of Object.entries(order)) {
        let valA = a[field];
        let valB = b[field];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (typeof dir === "object" && dir !== null && "_count" in (dir as any)) {
          valA = Array.isArray(a[field]) ? a[field].length : 0;
          valB = Array.isArray(b[field]) ? b[field].length : 0;
          const direction = (dir as any)._count;
          if (valA < valB) return direction === "asc" ? -1 : 1;
          if (valA > valB) return direction === "asc" ? 1 : -1;
          continue;
        }
        if (valA < valB) return dir === "asc" ? -1 : 1;
        if (valA > valB) return dir === "asc" ? 1 : -1;
      }
    }
    return 0;
  });
}

function projectItem(item: any, select: any, include: any): any {
  if (!item) return null;
  if (!select && !include) return { ...item };

  const result: any = {};
  if (select) {
    for (const [key, val] of Object.entries(select)) {
      if (!val) continue;
      if (key === "_count") {
        result._count = {};
        if (typeof val === "object" && val && "select" in (val as any)) {
          for (const subKey of Object.keys((val as any).select)) {
            const arr = item[subKey];
            result._count[subKey] = Array.isArray(arr) ? arr.length : 0;
          }
        } else {
          for (const k of Object.keys(item)) {
            if (Array.isArray(item[k])) result._count[k] = item[k].length;
          }
        }
        continue;
      }
      const raw = item[key];
      if (typeof val === "object" && val !== null) {
        if (Array.isArray(raw)) {
          let subArr = raw;
          if ((val as any).where) subArr = subArr.filter(i => matchesWhere(i, (val as any).where));
          if ((val as any).orderBy) subArr = sortItems(subArr, (val as any).orderBy);
          if ((val as any).take) subArr = subArr.slice(0, (val as any).take);
          if ((val as any).select) {
            result[key] = subArr.map(i => projectItem(i, (val as any).select, null));
          } else {
            result[key] = subArr.map(i => ({ ...i }));
          }
        } else if (raw && typeof raw === "object") {
          result[key] = projectItem(raw, (val as any).select, (val as any).include);
        } else {
          result[key] = raw;
        }
      } else {
        result[key] = raw;
      }
    }
  } else {
    Object.assign(result, item);
    for (const [key, val] of Object.entries(include)) {
      if (!val) continue;
      if (key === "_count") {
        result._count = {};
        if (typeof val === "object" && val && "select" in (val as any)) {
          for (const subKey of Object.keys((val as any).select)) {
            const arr = item[subKey];
            result._count[subKey] = Array.isArray(arr) ? arr.length : 0;
          }
        }
        continue;
      }
      const raw = item[key];
      if (typeof val === "object" && val !== null) {
        if (Array.isArray(raw)) {
          let subArr = raw;
          if ((val as any).where) subArr = subArr.filter(i => matchesWhere(i, (val as any).where));
          if ((val as any).orderBy) subArr = sortItems(subArr, (val as any).orderBy);
          if ((val as any).take) subArr = subArr.slice(0, (val as any).take);
          result[key] = subArr;
        } else if (raw) {
          result[key] = raw;
        }
      } else if (raw !== undefined) {
        result[key] = raw;
      }
    }
  }
  return result;
}

function aggregateItems(items: any[], args: any) {
  const result: any = {};
  if (args?._count) {
    result._count = items.length;
  }
  if (args?._sum) {
    result._sum = {};
    for (const field of Object.keys(args._sum)) {
      result._sum[field] = items.reduce((acc, it) => acc + (Number(it[field]) || 0), 0);
    }
  }
  if (args?._avg) {
    result._avg = {};
    for (const field of Object.keys(args._avg)) {
      const sum = items.reduce((acc, it) => acc + (Number(it[field]) || 0), 0);
      result._avg[field] = items.length > 0 ? sum / items.length : null;
    }
  }
  return result;
}

function createModelHandler(collectionName: string, getCollection: (name: string) => any[]) {
  return {
    async findMany(args: any = {}) {
      let items = getCollection(collectionName);
      if (args.where) items = items.filter(it => matchesWhere(it, args.where));
      if (args.orderBy) items = sortItems(items, args.orderBy);
      const skip = args.skip || 0;
      const take = args.take !== undefined ? args.take : items.length;
      items = items.slice(skip, skip + take);
      return items.map(it => projectItem(it, args.select, args.include));
    },
    async findFirst(args: any = {}) {
      let items = getCollection(collectionName);
      if (args.where) items = items.filter(it => matchesWhere(it, args.where));
      if (args.orderBy) items = sortItems(items, args.orderBy);
      const first = items[0] ?? null;
      return projectItem(first, args.select, args.include);
    },
    async findUnique(args: any = {}) {
      const items = getCollection(collectionName);
      const found = items.find(it => matchesWhere(it, args.where)) ?? null;
      return projectItem(found, args.select, args.include);
    },
    async count(args: any = {}) {
      let items = getCollection(collectionName);
      if (args.where) items = items.filter(it => matchesWhere(it, args.where));
      return items.length;
    },
    async aggregate(args: any = {}) {
      let items = getCollection(collectionName);
      if (args.where) items = items.filter(it => matchesWhere(it, args.where));
      return aggregateItems(items, args);
    },
    async create(args: any = {}) {
      const items = getCollection(collectionName);
      const data = { ...args.data };
      if (!data.id) {
        data.id = `${collectionName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }
      if (!data.createdAt) data.createdAt = new Date();
      if (!data.updatedAt) data.updatedAt = new Date();

      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === "object" && "create" in (val as any)) {
          const nested = (val as any).create;
          if (Array.isArray(nested)) {
            data[key] = nested.map(n => ({
              id: `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date(),
              ...n,
            }));
          } else if (typeof nested === "object") {
            data[key] = {
              id: `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date(),
              ...nested,
            };
          }
        }
      }
      items.unshift(data);
      return projectItem(data, args.select, args.include);
    },
    async createMany(args: any = {}) {
      const items = getCollection(collectionName);
      const list = Array.isArray(args.data) ? args.data : [args.data];
      for (const entry of list) {
        items.push({
          id: `${collectionName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...entry,
        });
      }
      return { count: list.length };
    },
    async update(args: any = {}) {
      const items = getCollection(collectionName);
      const item = items.find(it => matchesWhere(it, args.where));
      if (!item) return null;
      const data = args.data ?? {};
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
          if ("increment" in (val as any)) {
            item[key] = (Number(item[key]) || 0) + Number((val as any).increment);
          } else if ("decrement" in (val as any)) {
            item[key] = (Number(item[key]) || 0) - Number((val as any).decrement);
          } else if ("set" in (val as any)) {
            item[key] = (val as any).set;
          } else {
            item[key] = val;
          }
        } else {
          item[key] = val;
        }
      }
      item.updatedAt = new Date();
      return projectItem(item, args.select, args.include);
    },
    async updateMany(args: any = {}) {
      const items = getCollection(collectionName);
      const matching = items.filter(it => matchesWhere(it, args.where));
      for (const item of matching) {
        const data = args.data ?? {};
        for (const [key, val] of Object.entries(data)) {
          if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
            if ("increment" in (val as any)) {
              item[key] = (Number(item[key]) || 0) + Number((val as any).increment);
            } else if ("decrement" in (val as any)) {
              item[key] = (Number(item[key]) || 0) - Number((val as any).decrement);
            } else {
              item[key] = val;
            }
          } else {
            item[key] = val;
          }
        }
        item.updatedAt = new Date();
      }
      return { count: matching.length };
    },
    async delete(args: any = {}) {
      const items = getCollection(collectionName);
      const index = items.findIndex(it => matchesWhere(it, args.where));
      if (index === -1) return null;
      const [deleted] = items.splice(index, 1);
      return deleted;
    },
    async deleteMany(args: any = {}) {
      const items = getCollection(collectionName);
      const before = items.length;
      const keep = items.filter(it => !matchesWhere(it, args.where));
      items.length = 0;
      items.push(...keep);
      return { count: before - items.length };
    },
    async upsert(args: any = {}) {
      const items = getCollection(collectionName);
      const existing = items.find(it => matchesWhere(it, args.where));
      if (existing) {
        return this.update({ where: args.where, data: args.update, select: args.select, include: args.include });
      } else {
        return this.create({ data: { ...args.where, ...args.create }, select: args.select, include: args.include });
      }
    },
  };
}

export function createMockPrisma() {
  const collections = new Map<string, any[]>();

  function getCollection(name: string): any[] {
    const key = name.toLowerCase();
    if (!collections.has(key)) {
      collections.set(key, []);
    }
    return collections.get(key)!;
  }

  // Seed data
  const shopSettings = {
    id: "shop",
    nameEn: "Duka la Mtandaoni",
    nameSw: "Duka la Mtandaoni",
    taglineEn: "Genuine products, delivered across Tanzania",
    taglineSw: "Bidhaa halisi, zinafikishwa Tanzania nzima",
    phone: "+255775627647",
    whatsapp: "+255775627647",
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
    marketplaceFeePercent: 6,
    updatedAt: new Date(),
  };
  collections.set("shopsettings", [shopSettings]);

  const deliveryZones = DELIVERY_ZONES.map(([region, fee, etaMinDays, etaMaxDays], index) => ({
    id: `zone-${index}`,
    region,
    fee,
    etaMinDays,
    etaMaxDays,
    position: index,
    isActive: true,
  }));
  collections.set("deliveryzone", deliveryZones);

  const universities = UNIVERSITY_SEEDS.map((u) => ({
    id: u.slug,
    slug: u.slug,
    nameEn: u.nameEn,
    nameSw: u.nameSw,
    emailDomain: u.emailDomain,
    region: u.region,
    isActive: true,
    createdAt: new Date(),
  }));
  collections.set("university", universities);

  const categories = [
    {
      id: "cat-groceries",
      slug: "groceries",
      nameEn: "Groceries",
      nameSw: "Vyakula na Mahitaji",
      descEn: "Campus provisions, snacks, pantry essentials, cereals, and fresh hostel staples.",
      descSw: "Vyakula vya hostel, vitafunwa, nafaka, mafuta na mahitaji ya kila siku chuoni.",
      image: "/img/c/groceries.svg",
      position: 0,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 4 },
    },
    {
      id: "cat-beauty",
      slug: "beauty",
      nameEn: "Beauty",
      nameSw: "Urembo",
      descEn: "Skin care, organic creams, hair oils, fragrances, and personal glow essentials.",
      descSw: "Bidhaa za ngozi, krimu za asili, mafuta ya nywele, manukato na urembo.",
      image: "/img/c/beauty.svg",
      position: 1,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 4 },
    },
    {
      id: "cat-health-gym",
      slug: "health-gym",
      nameEn: "Health & Gym",
      nameSw: "Afya na Mazoezi",
      descEn: "Gym bottles, resistance bands, workout accessories, wellness and fitness gear.",
      descSw: "Vifaa vya mazoezi, chupa za maji za gym, mikanda ya mazoezi na vifaa vya afya.",
      image: "/img/c/health-gym.svg",
      position: 2,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 3 },
    },
    {
      id: "cat-fashion",
      slug: "fashion",
      nameEn: "Fashion",
      nameSw: "Mitindo",
      descEn: "Clothing and footwear, including traditional Tanzanian fabrics.",
      descSw: "Nguo na viatu, pamoja na vitambaa vya asili vya Kitanzania.",
      image: "/img/c/fashion.svg",
      position: 3,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 4 },
    },
    {
      id: "cat-home-kitchen",
      slug: "home-kitchen",
      nameEn: "Home & Kitchen",
      nameSw: "Nyumbani na Jikoni",
      descEn: "Cookware, water, storage and the things that make a house work.",
      descSw: "Vyombo vya kupikia, maji, hifadhi na vitu vinavyofanya nyumba ifanye kazi.",
      image: "/img/c/home-kitchen.svg",
      position: 4,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 4 },
    },
    {
      id: "cat-electronics",
      slug: "electronics",
      nameEn: "Electronics",
      nameSw: "Elektroniki",
      descEn: "Audio, solar power, study gadgets, chargers and everyday electricals.",
      descSw: "Sauti, umeme wa jua, betri za akiba, chaja na vifaa vya umeme.",
      image: "/img/c/electronics.svg",
      position: 5,
      isActive: true,
      createdAt: new Date(),
      _count: { products: 5 },
    },
  ];
  collections.set("category", categories);

  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c]));

  // Users
  // bcrypt hash for "Admin@2026" and "Customer@2026"
  const passwordHash = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyL1d6sWqCvh6j4r2jP5kO1kF5Xw4X8O";
  const users = [
    {
      id: "admin-1",
      name: "Shop Administrator",
      phone: "+255700000001",
      email: "admin@duka.co.tz",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0 },
      orders: [],
    },
    {
      id: "customer-1",
      name: "Amina Hassan",
      phone: "+255712000001",
      email: "amina@duka.co.tz",
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0 },
      orders: [],
    },
    {
      id: "student-1",
      name: "Juma Mwakalinga",
      phone: "+255719000009",
      email: "juma@udsm.ac.tz",
      passwordHash,
      role: "CUSTOMER",
      universityId: "udsm",
      studentNumber: "UDSM-2023-00427",
      studentVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0, listings: 3, followers: 12 },
      orders: [],
    },
    {
      id: "student-2",
      name: "Baraka Mwamba",
      phone: "+255719000010",
      email: "baraka@must.ac.tz",
      passwordHash,
      role: "CUSTOMER",
      universityId: "must",
      studentNumber: "MUST-2022-01992",
      studentVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0, listings: 2, followers: 8 },
      orders: [],
    },
    {
      id: "student-3",
      name: "Neema Kimaro",
      phone: "+255719000011",
      email: "neema@udom.ac.tz",
      passwordHash,
      role: "CUSTOMER",
      universityId: "udom",
      studentNumber: "UDOM-2023-08831",
      studentVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0, listings: 2, followers: 15 },
      orders: [],
    },
    {
      id: "student-4",
      name: "Sarah Mollel",
      phone: "+255719000012",
      email: "sarah@arusha.ac.tz",
      passwordHash,
      role: "CUSTOMER",
      universityId: "arusha",
      studentNumber: "UAR-2024-00155",
      studentVerifiedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { orders: 0, listings: 1, followers: 6 },
      orders: [],
    },
  ];
  collections.set("user", users);

  const addresses = [
    {
      id: "addr-1",
      userId: "customer-1",
      fullName: "Amina Hassan",
      phone: "+255712000001",
      region: "Dar es Salaam",
      district: "Kinondoni",
      street: "Mikocheni B, Wenge Road",
      landmark: "Opposite Shoppers Plaza",
      isDefault: true,
      createdAt: new Date(),
    },
  ];
  collections.set("address", addresses);

  // Products
  const rawProducts = [
    {
      slug: "solar-home-kit-30w",
      nameEn: "Solar Home Lighting Kit 30W",
      nameSw: "Kifaa cha Taa za Jua 30W",
      descEn: "A complete off-grid lighting kit: a 30W panel, a sealed battery, three LED bulbs with switches, and a USB port for charging phones.",
      descSw: "Kifaa kamili cha taa bila umeme wa gridi: paneli ya 30W, betri iliyofungwa, balbu tatu za LED zenye swichi.",
      brand: "SolarMax",
      price: 185000,
      compareAt: 225000,
      stock: 24,
      isFeatured: true,
      categorySlug: "electronics",
    },
    {
      slug: "smart-tv-55-inch",
      nameEn: 'Smart TV 55" 4K',
      nameSw: 'Televisheni Smart 55" 4K',
      descEn: "A 55-inch 4K smart television with built-in WiFi, two HDMI ports and a USB port for playing films.",
      descSw: "Televisheni smart ya inchi 55 ya 4K yenye WiFi ndani, milango miwili ya HDMI na tundu la USB.",
      brand: "Vista",
      price: 749000,
      stock: 8,
      isFeatured: true,
      categorySlug: "electronics",
    },
    {
      slug: "bluetooth-speaker-portable",
      nameEn: "Portable Bluetooth Speaker",
      nameSw: "Spika ya Bluetooth ya Kubeba",
      descEn: "Water-resistant Bluetooth speaker with twelve hours of playback on one charge. Loud enough for a small gathering.",
      descSw: "Spika ya Bluetooth isiyoingia maji yenye saa kumi na mbili za kucheza kwa chaji moja.",
      brand: "BoomBox",
      price: 89000,
      compareAt: 110000,
      stock: 40,
      isFeatured: false,
      categorySlug: "electronics",
    },
    {
      slug: "rechargeable-led-torch",
      nameEn: "Rechargeable LED Torch",
      nameSw: "Tochi ya LED ya Kuchaji",
      descEn: "A bright rechargeable torch that holds its charge for weeks. Three brightness settings plus side lamp.",
      descSw: "Tochi kali ya kuchaji inayoshika chaji kwa wiki kadhaa. Ina viwango vitatu vya mwanga.",
      brand: "BrightOne",
      price: 22000,
      stock: 65,
      isFeatured: false,
      categorySlug: "electronics",
    },
    {
      slug: "smartphone-128gb",
      nameEn: "Smartphone 128GB / 6GB RAM",
      nameSw: "Simu Janja 128GB / 6GB RAM",
      descEn: "A 6.6-inch smartphone with 128GB of storage, 6GB of RAM and a 5000mAh battery. Dual SIM, 50MP camera.",
      descSw: "Simu ya inchi 6.6 yenye hifadhi ya 128GB, RAM ya 6GB na betri ya 5000mAh inayodumu siku nzima.",
      brand: "Nuru",
      price: 415000,
      compareAt: 465000,
      stock: 18,
      isFeatured: true,
      categorySlug: "phones-accessories",
    },
    {
      slug: "power-bank-20000mah",
      nameEn: "Power Bank 20,000mAh",
      nameSw: "Betri ya Akiba 20,000mAh",
      descEn: "Charges a typical phone four times over. Two USB outputs so you can charge a phone and a torch at once.",
      descSw: "Inachaji simu ya kawaida mara nne. Ina matundu mawili ya USB ili uchaji vifaa viwili kwa wakati mmoja.",
      brand: "Nuru",
      price: 65000,
      stock: 52,
      isFeatured: true,
      categorySlug: "phones-accessories",
    },
    {
      slug: "fast-charger-33w",
      nameEn: "33W Fast Charger with USB-C Cable",
      nameSw: "Chaja ya Haraka 33W na Waya wa USB-C",
      descEn: "Fills a modern phone battery to half in about twenty minutes. Built for Tanzanian mains voltage.",
      descSw: "Inajaza betri ya simu ya kisasa nusu ndani ya dakika ishirini hivi.",
      brand: "Nuru",
      price: 28000,
      stock: 88,
      isFeatured: false,
      categorySlug: "phones-accessories",
    },
    {
      slug: "wireless-earbuds",
      nameEn: "Wireless Earbuds",
      nameSw: "Vipokea Sauti Visivyo na Waya",
      descEn: "Comfortable in-ear buds with a charging case that gives around twenty-four hours of total listening.",
      descSw: "Vipokea sauti vya masikioni vyenye kisanduku cha kuchaji kinachotoa takribani saa ishirini na nne.",
      brand: "BoomBox",
      price: 72000,
      compareAt: 95000,
      stock: 33,
      isFeatured: false,
      categorySlug: "phones-accessories",
    },
    {
      slug: "kitenge-two-piece-set",
      nameEn: "Kitenge Two-Piece Set",
      nameSw: "Seti ya Kitenge Vipande Viwili",
      descEn: "A tailored top and matching skirt in genuine wax-print kitenge. Fully lined, with a concealed zip.",
      descSw: "Blauzi iliyoshonwa vizuri na sketi inayoendana ya kitenge halisi cha nta.",
      brand: "Mwanzo",
      price: 95000,
      stock: 30,
      isFeatured: true,
      categorySlug: "fashion",
    },
    {
      slug: "leather-sandals-mens",
      nameEn: "Men's Leather Sandals",
      nameSw: "Ndara za Ngozi za Wanaume",
      descEn: "Hand-stitched sandals in full-grain leather with a hard-wearing rubber sole.",
      descSw: "Ndara zilizoshonwa kwa mkono kwa ngozi halisi zenye sola ngumu ya mpira.",
      brand: "Mwanzo",
      price: 55000,
      stock: 42,
      isFeatured: false,
      categorySlug: "fashion",
    },
    {
      slug: "maasai-shuka-blanket",
      nameEn: "Maasai Shuka Blanket",
      nameSw: "Shuka la Kimasai",
      descEn: "A thick woven shuka in the classic checked pattern. Warm enough for cold nights upcountry.",
      descSw: "Shuka nene lililofumwa kwa muundo wa kawaida wa vipande.",
      brand: "Mwanzo",
      price: 35000,
      stock: 55,
      isFeatured: false,
      categorySlug: "fashion",
    },
    {
      slug: "cotton-kanga-pair",
      nameEn: "Cotton Kanga (Pair)",
      nameSw: "Kanga za Pamba (Jozi)",
      descEn: "A pair of pure cotton kanga with a printed Swahili proverb along the border. Sold as a pair.",
      descSw: "Jozi ya kanga za pamba halisi zenye methali ya Kiswahili iliyochapishwa pembeni.",
      brand: "Mwanzo",
      price: 28000,
      stock: 70,
      isFeatured: false,
      categorySlug: "fashion",
    },
    {
      slug: "nonstick-cookware-set-7pc",
      nameEn: "Non-stick Cookware Set (7 pieces)",
      nameSw: "Seti ya Vyombo vya Kupikia (Vipande 7)",
      descEn: "Three saucepans with lids, a frying pan and a serving spoon. The non-stick coating is free of PFOA.",
      descSw: "Masufuria matatu yenye mifuniko, kikaango na mwiko wa kupakulia.",
      brand: "HomePro",
      price: 165000,
      compareAt: 195000,
      stock: 22,
      isFeatured: true,
      categorySlug: "home-kitchen",
    },
    {
      slug: "improved-charcoal-jiko",
      nameEn: "Improved Charcoal Jiko",
      nameSw: "Jiko Bora la Mkaa",
      descEn: "A ceramic-lined jiko that uses noticeably less charcoal than plain metal.",
      descSw: "Jiko lenye udongo ndani linalotumia mkaa kidogo zaidi kuliko la bati.",
      brand: "HomePro",
      price: 32000,
      stock: 48,
      isFeatured: false,
      categorySlug: "home-kitchen",
    },
    {
      slug: "water-filter-20l",
      nameEn: "20L Ceramic Water Filter",
      nameSw: "Kichujio cha Maji cha Udongo 20L",
      descEn: "Gravity-fed ceramic filter that needs no electricity and no pressure. Removes bacteria and sediment.",
      descSw: "Kichujio cha udongo kinachotumia mvuto wa dunia, hakihitaji umeme wala shinikizo.",
      brand: "AquaSafe",
      price: 78000,
      stock: 26,
      isFeatured: true,
      categorySlug: "home-kitchen",
    },
    {
      slug: "thermos-flask-1900ml",
      nameEn: "Vacuum Flask 1.9L",
      nameSw: "Chupa ya Chai 1.9L",
      descEn: "Stainless steel vacuum flask that keeps chai hot from morning until evening.",
      descSw: "Chupa ya chuma cha pua inayohifadhi chai moto tangu asubuhi hadi jioni.",
      brand: "HomePro",
      price: 42000,
      stock: 37,
      isFeatured: false,
      categorySlug: "home-kitchen",
    },
    {
      slug: "shea-butter-cream-500ml",
      nameEn: "Shea Butter Body Cream 500ml",
      nameSw: "Krimu ya Shea ya Mwili 500ml",
      descEn: "Unrefined shea butter blended into a light cream that absorbs without greasy film.",
      descSw: "Siagi ya shea isiyosafishwa iliyochanganywa kuwa krimu nyepesi inayoingia ngozini.",
      brand: "Asili",
      price: 25000,
      stock: 60,
      isFeatured: false,
      categorySlug: "beauty-health",
    },
    {
      slug: "coconut-hair-oil-250ml",
      nameEn: "Coconut Hair Oil 250ml",
      nameSw: "Mafuta ya Nazi ya Nywele 250ml",
      descEn: "Cold-pressed coconut oil from the coast, with nothing added.",
      descSw: "Mafuta ya nazi yaliyokamuliwa kwa baridi kutoka pwani, bila kuongezwa kitu chochote.",
      brand: "Asili",
      price: 18000,
      stock: 75,
      isFeatured: false,
      categorySlug: "beauty-health",
    },
    {
      slug: "blood-pressure-monitor",
      nameEn: "Digital Blood Pressure Monitor",
      nameSw: "Kipima Shinikizo la Damu",
      descEn: "An upper-arm monitor with a large display and a single button. Stores last sixty readings.",
      descSw: "Kipimo cha mkono wa juu chenye kioo kikubwa na kitufe kimoja.",
      brand: "Afya",
      price: 135000,
      stock: 14,
      isFeatured: false,
      categorySlug: "beauty-health",
    },
    {
      slug: "rice-kilombero-25kg",
      nameEn: "Kilombero Rice 25kg",
      nameSw: "Mchele wa Kilombero 25kg",
      descEn: "Aromatic long-grain rice from the Kilombero valley, cleaned and sold in a 25kg sack.",
      descSw: "Mchele wenye harufu nzuri wa punje ndefu kutoka bonde la Kilombero, umesafishwa.",
      brand: "Shamba",
      price: 98000,
      stock: 31,
      isFeatured: true,
      categorySlug: "groceries",
    },
    {
      slug: "sunflower-oil-5l",
      nameEn: "Sunflower Cooking Oil 5L",
      nameSw: "Mafuta ya Alizeti ya Kupikia 5L",
      descEn: "Locally pressed sunflower oil in a 5-litre jerrycan. Light in taste.",
      descSw: "Mafuta ya alizeti yaliyokamuliwa hapa nchini kwenye dumu la lita 5.",
      brand: "Shamba",
      price: 38000,
      stock: 44,
      isFeatured: false,
      categorySlug: "groceries",
    },
    {
      slug: "wheat-flour-10kg",
      nameEn: "Wheat Flour 10kg",
      nameSw: "Unga wa Ngano 10kg",
      descEn: "All-purpose wheat flour for chapati, mandazi and bread. Fine-milled in a 10kg bag.",
      descSw: "Unga wa ngano wa matumizi yote kwa chapati, mandazi na mikate.",
      brand: "Shamba",
      price: 32000,
      stock: 58,
      isFeatured: false,
      categorySlug: "groceries",
    },
  ];

  let pCount = 0;
  const products = rawProducts.map(p => {
    const cat = categoryMap[p.categorySlug] || categories[0];
    const id = `prod-${++pCount}`;
    const imgUrl = `/img/p/${p.slug}.svg`;
    const images = [
      { id: `pimg-${id}-0`, productId: id, url: imgUrl, alt: p.nameEn, position: 0 },
      { id: `pimg-${id}-1`, productId: id, url: `/img/p/${p.slug}-angled.svg`, alt: p.nameEn, position: 1 },
      { id: `pimg-${id}-2`, productId: id, url: `/img/p/${p.slug}-detail.svg`, alt: p.nameEn, position: 2 },
    ];
    return {
      id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameSw: p.nameSw,
      descEn: p.descEn,
      descSw: p.descSw,
      brand: p.brand,
      sku: `DK-${String(pCount).padStart(4, "0")}`,
      price: p.price,
      compareAt: p.compareAt ?? null,
      stock: p.stock,
      lowStockAt: 5,
      weightGrams: 500,
      isActive: true,
      isFeatured: p.isFeatured ?? false,
      categoryId: cat.id,
      category: cat,
      images,
      variants: [],
      reviews: [
        {
          id: `rev-${id}-1`,
          productId: id,
          userId: "customer-1",
          rating: 5,
          comment: "Bidhaa nzuri sana, imefika kwa wakati. Very satisfied!",
          isApproved: true,
          createdAt: new Date(),
          user: { name: "Amina Hassan" },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  collections.set("product", products);

  // Listings for marketplace
  const student1 = users[2]; // Juma (UDSM)
  const student2 = users[3]; // Baraka (MUST)
  const student3 = users[4]; // Neema (UDOM)
  const student4 = users[5]; // Sarah (Arusha)

  const udsmUni = universities[0];
  const mustUni = universities[1];
  const udomUni = universities[2];
  const arushaUni = universities[4];

  const listings = [
    {
      id: "list-1",
      slug: "casio-fx-991es-plus-scientific-calculator",
      titleEn: "Casio FX-991ES Plus Scientific Calculator",
      titleSw: "Kikokotoo cha Sayansi Casio FX-991ES Plus",
      descEn: "Good condition, used for first year Engineering math. Comes with sliding protective case and new battery.",
      descSw: "Hali nzuri, kilitumika kwa hisabati ya uhandisi mwaka wa kwanza. Kina kifuniko cha kinga.",
      price: 40000,
      condition: "LIKE_NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 142,
      sellerId: student1.id,
      seller: student1,
      universityId: udsmUni.id,
      university: udsmUni,
      categoryId: categories[1].id,
      category: categories[1],
      images: [{ id: "limg-1", url: "/img/p/fast-charger-33w.svg", alt: "Casio Calculator", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-2",
      slug: "principles-of-microeconomics-8th-edition",
      titleEn: "Principles of Microeconomics 8th Edition",
      titleSw: "Kitabu cha Microeconomics Toleo la 8",
      descEn: "Standard textbook for Economics & Business students. Very clean, no highlighting inside, all pages crisp.",
      descSw: "Kitabu cha msingi kwa wanafunzi wa biashara na uchumi. Kisafi sana, hakina mistari ndani.",
      price: 30000,
      condition: "GOOD",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 98,
      sellerId: student1.id,
      seller: student1,
      universityId: udsmUni.id,
      university: udsmUni,
      categoryId: categories[0].id,
      category: categories[0],
      images: [{ id: "limg-2", url: "/img/p/bluetooth-speaker-portable.svg", alt: "Microeconomics Textbook", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-3",
      slug: "rechargeable-led-hostel-study-lamp",
      titleEn: "Rechargeable LED Hostel Study Lamp with Power Bank",
      titleSw: "Taa ya Kusomea ya LED Bwenini Yenye Power Bank",
      descEn: "Long battery life, USB charging. Great for night studies in campus hostels during load shedding.",
      descSw: "Betri inakaa muda mrefu, inachajiwa na USB. Nzuri sana kwa masomo ya usiku bwenini.",
      price: 22000,
      condition: "LIKE_NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 165,
      sellerId: student1.id,
      seller: student1,
      universityId: udsmUni.id,
      university: udsmUni,
      categoryId: categories[0].id,
      category: categories[0],
      images: [{ id: "limg-3", url: "/img/p/rechargeable-led-torch.svg", alt: "Hostel Study Lamp", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-4",
      slug: "rotring-engineering-drawing-board-kit",
      titleEn: "Engineering Drawing Board & T-Square Kit",
      titleSw: "Ubao wa Ramani za Uhandisi na T-Square",
      descEn: "A3 precision drawing board with parallel motion ruler and set squares. Essential for Civil & Mechanical engineering.",
      descSw: "Ubao wa ramani wa A3 na rula ya sambamba. Muhimu kwa wanafunzi wa uhandisi ujenzi na mitambo.",
      price: 55000,
      condition: "LIKE_NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 84,
      sellerId: student2.id,
      seller: student2,
      universityId: mustUni.id,
      university: mustUni,
      categoryId: categories[3].id,
      category: categories[3],
      images: [{ id: "limg-4", url: "/img/p/solar-home-kit-30w.svg", alt: "Engineering Drawing Set", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-5",
      slug: "hp-core-i5-8gb-256gb-student-laptop",
      titleEn: 'HP 15.6" Core i5 (8GB RAM / 256GB SSD)',
      titleSw: 'Kompyuta Mpakato HP 15.6" Core i5',
      descEn: "Reliable student laptop for programming and assignments. Fast SSD, battery holds 4+ hours, original charger.",
      descSw: "Kompyuta nzuri ya mwanafunzi kwa programu na kazi za chuo. SSD ya haraka, betri inashika saa 4+.",
      price: 490000,
      condition: "GOOD",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 230,
      sellerId: student2.id,
      seller: student2,
      universityId: mustUni.id,
      university: mustUni,
      categoryId: categories[1].id,
      category: categories[1],
      images: [{ id: "limg-5", url: "/img/p/smart-tv-55-inch.svg", alt: "HP Student Laptop", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-6",
      slug: "medical-physiology-guyton-hall-13th",
      titleEn: "Guyton & Hall Medical Physiology 13th Edition",
      titleSw: "Kitabu cha Fisiolojia ya Tiba Guyton & Hall",
      descEn: "Original international edition for MD & Pharmacy students. Hardcover, pristine pages, with clinical flashcards.",
      descSw: "Toleo halisi la kimataifa kwa wanafunzi wa udaktari na famasia. Jalada gumu, kurasa safi kabisa.",
      price: 75000,
      condition: "LIKE_NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 112,
      sellerId: student3.id,
      seller: student3,
      universityId: udomUni.id,
      university: udomUni,
      categoryId: categories[0].id,
      category: categories[0],
      images: [{ id: "limg-6", url: "/img/p/kitenge-two-piece-set.svg", alt: "Medical Physiology Textbook", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-7",
      slug: "anker-20000mah-fast-charge-power-bank",
      titleEn: "Anker PowerCore 20,000mAh Dual USB-C",
      titleSw: "Betri ya Akiba Anker 20,000mAh",
      descEn: "Heavy duty battery pack for campus lectures and library sessions. Charges smartphone 4 times over.",
      descSw: "Betri imara ya akiba kwa vipindi vya chuo na maktaba. Inachaji simu mara 4.",
      price: 55000,
      condition: "LIKE_NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 135,
      sellerId: student3.id,
      seller: student3,
      universityId: udomUni.id,
      university: udomUni,
      categoryId: categories[1].id,
      category: categories[1],
      images: [{ id: "limg-7", url: "/img/p/power-bank-20000mah.svg", alt: "Anker Power Bank", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "list-8",
      slug: "hostel-safe-electric-kettle-and-induction-cooker",
      titleEn: "Hostel-Safe 1.8L Stainless Steel Electric Kettle",
      titleSw: "Birika la Umeme la Bwenini 1.8L",
      descEn: "Low power draw designed for college hostel circuits. Auto shut-off protection, boiling in 3 minutes.",
      descSw: "Birika la umeme lisilozidisha umeme wa bwenini. Linajizima lenyewe, maji huchemka kwa dakika 3.",
      price: 28000,
      condition: "NEW",
      status: "ACTIVE",
      isFeatured: true,
      featuredUntil: new Date(Date.now() + 86400000 * 30),
      viewCount: 178,
      sellerId: student4.id,
      seller: student4,
      universityId: arushaUni.id,
      university: arushaUni,
      categoryId: categories[3].id,
      category: categories[3],
      images: [{ id: "limg-8", url: "/img/p/thermos-flask-1900ml.svg", alt: "Hostel Kettle", position: 0 }],
      orderItems: [],
      savedBy: [],
      offers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  collections.set("listing", listings);

  const coupons = [
    {
      id: "cpn-1",
      code: "KARIBU10",
      type: "PERCENT",
      value: 10,
      minSubtotal: 50000,
      maxUses: 500,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "cpn-2",
      code: "DAR5000",
      type: "FIXED",
      value: 5000,
      minSubtotal: 100000,
      maxUses: 200,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
    },
  ];
  collections.set("coupon", coupons);

  // Return proxy for any model
  const client: any = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "$transaction") {
          return async (arg: any) => {
            if (typeof arg === "function") {
              return arg(client);
            }
            if (Array.isArray(arg)) {
              return Promise.all(arg);
            }
            return arg;
          };
        }
        if (prop === "$connect" || prop === "$disconnect") {
          return async () => {};
        }
        return createModelHandler(prop, getCollection);
      },
    },
  );

  return client;
}

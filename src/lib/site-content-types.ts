export type SiteContentConfig = {
  announcement: {
    enabled: boolean;
    textEn: string;
    textSw: string;
    link: string;
    badgeEn: string;
    badgeSw: string;
  };
  hero: {
    headlineEn: string;
    headlineSw: string;
    subtitleEn: string;
    subtitleSw: string;
    badgeEn: string;
    badgeSw: string;
    primaryCtaEn: string;
    primaryCtaSw: string;
    primaryCtaLink: string;
    secondaryCtaEn: string;
    secondaryCtaSw: string;
    secondaryCtaLink: string;
    bgStyle: "obsidian-glass" | "minimal-slate" | "warm-editorial";
  };
  superDeals: {
    enabled: boolean;
    titleEn: string;
    titleSw: string;
    subtitleEn: string;
    subtitleSw: string;
    badgeEn: string;
    badgeSw: string;
    ctaEn: string;
    ctaSw: string;
    ctaLink: string;
  };
  features: Array<{
    id: string;
    icon: "wallet" | "truck" | "shield" | "headphones";
    titleEn: string;
    titleSw: string;
    bodyEn: string;
    bodySw: string;
  }>;
  campusMarketplace: {
    enabled: boolean;
    headlineEn: string;
    headlineSw: string;
    bodyEn: string;
    bodySw: string;
    ctaEn: string;
    ctaSw: string;
    badgeEn: string;
    badgeSw: string;
  };
  aliexpressBadges: {
    showChoiceBadge: boolean;
    showSuperDeals: boolean;
    showRatings: boolean;
    showQuickView: boolean;
  };
};

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  announcement: {
    enabled: true,
    textEn: "Super Deals Live · Fast Delivery Across Tanzania · Free Shipping over 100,000 TSh",
    textSw: "Punguzo Kubwa Limeanza · Usafirishaji wa Haraka Tanzania Nzima · Bure zaidi ya TSh 100,000",
    link: "/shop?deals=1",
    badgeEn: "SUPER DEAL",
    badgeSw: "BEI NAFUU",
  },
  hero: {
    headlineEn: "Everyday Essentials & Campus Tech, Delivered With Trust",
    headlineSw: "Vifaa vya Kila Siku na Teknolojia ya Chuo, Vinaletwa kwa Uhakika",
    subtitleEn: "Shop verified electronics, lifestyle gear, and student essentials with secure escrow protection and rapid countrywide delivery.",
    subtitleSw: "Nunua vifaa vya kielektroniki vilivyohakikiwa, bidhaa za maisha, na mahitaji ya chuo kwa usalama na usafirishaji wa haraka.",
    badgeEn: "Verified Campus & Retail Marketplace",
    badgeSw: "Soko Lililohakikiwa la Chuo na Maduka",
    primaryCtaEn: "Explore Super Deals",
    primaryCtaSw: "Tazama Punguzo",
    primaryCtaLink: "/shop?deals=1",
    secondaryCtaEn: "Browse Campus Market",
    secondaryCtaSw: "Soko la Wanafunzi",
    secondaryCtaLink: "/marketplace",
    bgStyle: "obsidian-glass",
  },
  superDeals: {
    enabled: true,
    titleEn: "Campus SuperDeals",
    titleSw: "Punguzo Kubwa la Chuoni",
    subtitleEn: "Hand-picked electronics, power banks, audio, and hostel essentials with up to 40% discount.",
    subtitleSw: "Vifaa vya kielektroniki, betri za akiba, sauti, na vifaa vya hosteli kwa punguzo hadi 40%.",
    badgeEn: "CHOICE DEALS",
    badgeSw: "OFILI BORA",
    ctaEn: "Shop All Deals",
    ctaSw: "Nunua Punguzo Zote",
    ctaLink: "/shop?deals=1",
  },
  features: [
    {
      id: "escrow",
      icon: "shield",
      titleEn: "Escrow Protection",
      titleSw: "Ulinzi wa Escrow",
      bodyEn: "Your payment is safeguarded until you physically inspect and approve your order.",
      bodySw: "Malipo yako yanahifadhiwa salama mpaka uthibitisha umepokea mzigo.",
    },
    {
      id: "delivery",
      icon: "truck",
      titleEn: "Fast Nationwide Delivery",
      titleSw: "Usafirishaji Haraka Nchi Nzima",
      bodyEn: "Rapid delivery across 31 regions in Tanzania with verified courier tracking.",
      bodySw: "Usafirishaji wa haraka katika mikoa 31 Tanzania yenye namba ya ufuatiliaji.",
    },
    {
      id: "pricing",
      icon: "wallet",
      titleEn: "Transparent Student Prices",
      titleSw: "Bei Nafuu na Wazi",
      bodyEn: "Direct manufacturer and verified peer-to-peer campus pricing with zero hidden fees.",
      bodySw: "Bei za moja kwa moja bila gharama zilizofichwa kwa wanafunzi na wananchi.",
    },
    {
      id: "support",
      icon: "headphones",
      titleEn: "Local WhatsApp Support",
      titleSw: "Msaada wa WhatsApp",
      bodyEn: "Instant customer service in Swahili and English available 7 days a week.",
      bodySw: "Huduma kwa wateja ya papo hapo kwa Kiswahili na Kiingereza siku zote za wiki.",
    },
  ],
  campusMarketplace: {
    enabled: true,
    headlineEn: "Verified Student Campus Hub",
    headlineSw: "Soko Lililohakikiwa la Wanafunzi wa Vyuo",
    bodyEn: "Buy and sell laptops, textbooks, and hostel essentials peer-to-peer with student ID verification and campus safe-trade zones.",
    bodySw: "Nunua na uza kompyuta mpakato, vitabu, na vifaa vya hosteli kwa ulinzi wa kitambulisho cha chuo na maeneo salama.",
    ctaEn: "Enter Student Marketplace",
    ctaSw: "Ingia Sokoni",
    badgeEn: "100% Student Verified",
    badgeSw: "Wanafunzi Halisi 100%",
  },
  aliexpressBadges: {
    showChoiceBadge: true,
    showSuperDeals: true,
    showRatings: true,
    showQuickView: true,
  },
};

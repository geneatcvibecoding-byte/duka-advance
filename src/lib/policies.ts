import type { Locale } from "@/lib/i18n";

/**
 * Default policy copy. These are sensible starting points written for a
 * Tanzanian retailer — the client should have them reviewed before launch and
 * can edit them here (or move them into the database in phase 2).
 */

type Section = { heading: string; body: string[] };
type Policy = { title: string; intro: string; sections: Section[] };

const returns: Record<Locale, Policy> = {
  en: {
    title: "Returns policy",
    intro:
      "We want you to be happy with what you ordered. If something is wrong, tell us within 7 days of delivery and we will put it right.",
    sections: [
      {
        heading: "What can be returned",
        body: [
          "Items that arrived damaged, faulty, or different from what you ordered.",
          "Unopened items in their original packaging, returned within 7 days.",
        ],
      },
      {
        heading: "What cannot be returned",
        body: [
          "Food, drinks, and other perishable goods.",
          "Cosmetics, underwear, and personal care items once opened, for hygiene reasons.",
          "Items damaged by misuse after delivery.",
        ],
      },
      {
        heading: "How to return something",
        body: [
          "Call or WhatsApp us with your order number and a photograph of the problem.",
          "We will arrange collection, or ask you to send it to our shop.",
          "Where the fault is ours, we pay the return transport.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Once we receive and check the item, we refund within 5 working days.",
          "Refunds go back by the same method you paid with. Cash-on-delivery orders are refunded by mobile money to the number on the order.",
        ],
      },
    ],
  },
  sw: {
    title: "Sera ya kurudisha bidhaa",
    intro:
      "Tunataka uridhike na ulichoagiza. Kama kuna tatizo, tuambie ndani ya siku 7 tangu upokee na tutarekebisha.",
    sections: [
      {
        heading: "Bidhaa zinazoweza kurudishwa",
        body: [
          "Bidhaa zilizofika zikiwa zimeharibika, zina hitilafu, au si ulizoagiza.",
          "Bidhaa ambazo hazijafunguliwa, zikiwa kwenye kifungashio chake cha awali, ndani ya siku 7.",
        ],
      },
      {
        heading: "Bidhaa zisizoweza kurudishwa",
        body: [
          "Vyakula, vinywaji, na bidhaa zingine zinazoharibika haraka.",
          "Vipodozi, nguo za ndani, na bidhaa za usafi binafsi zikishafunguliwa, kwa sababu za usafi.",
          "Bidhaa zilizoharibiwa na matumizi mabaya baada ya kupokelewa.",
        ],
      },
      {
        heading: "Jinsi ya kurudisha",
        body: [
          "Tupigie simu au WhatsApp ukiwa na namba ya oda na picha ya tatizo.",
          "Tutapanga kuja kuichukua, au tutakuomba uilete dukani kwetu.",
          "Pale kosa likiwa letu, tunalipia usafiri wa kurudisha.",
        ],
      },
      {
        heading: "Marejesho ya fedha",
        body: [
          "Tukishapokea na kukagua bidhaa, tunarejesha fedha ndani ya siku 5 za kazi.",
          "Fedha zinarudishwa kwa njia uliyolipia. Oda za kulipa unapopokea zinarejeshwa kwa simu kwenye namba iliyotumika kuagiza.",
        ],
      },
    ],
  },
};

const terms: Record<Locale, Policy> = {
  en: {
    title: "Terms of service",
    intro:
      "These terms cover your use of this shop. By placing an order you accept them.",
    sections: [
      {
        heading: "Orders",
        body: [
          "An order is a request to buy. It is confirmed once our team calls you and accepts it.",
          "We may decline an order if the item is out of stock or the delivery address is outside the areas we serve.",
        ],
      },
      {
        heading: "Prices",
        body: [
          "All prices are in Tanzanian shillings and include any applicable tax.",
          "Delivery is charged separately and is shown before you place the order.",
          "We may change prices at any time, but never after an order is confirmed.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "You may pay the rider on delivery, transfer by mobile money or bank, arrange payment over WhatsApp, or pay at our shop.",
          "For transfers, we pack your order once we have confirmed the payment against our statement.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "Delivery times are estimates in working days and depend on the region.",
          "Someone must be available on the phone number given on the order.",
        ],
      },
    ],
  },
  sw: {
    title: "Masharti ya huduma",
    intro:
      "Masharti haya yanahusu matumizi ya duka hili. Kwa kuweka oda, unayakubali.",
    sections: [
      {
        heading: "Oda",
        body: [
          "Oda ni ombi la kununua. Inathibitishwa pale timu yetu inapokupigia na kuikubali.",
          "Tunaweza kukataa oda kama bidhaa haipo au anwani ya kufikisha iko nje ya maeneo tunayohudumia.",
        ],
      },
      {
        heading: "Bei",
        body: [
          "Bei zote ziko kwa shilingi za Kitanzania na zinajumuisha kodi inayohusika.",
          "Gharama ya usafirishaji inatozwa tofauti na inaonyeshwa kabla hujaweka oda.",
          "Tunaweza kubadilisha bei wakati wowote, lakini kamwe baada ya oda kuthibitishwa.",
        ],
      },
      {
        heading: "Malipo",
        body: [
          "Unaweza kumlipa dereva unapopokea, kutuma kwa simu au benki, kupanga malipo kwa WhatsApp, au kulipa dukani kwetu.",
          "Kwa malipo ya kutuma, tunafunga oda yako baada ya kuthibitisha malipo kwenye taarifa zetu.",
        ],
      },
      {
        heading: "Usafirishaji",
        body: [
          "Muda wa kufikisha ni makadirio ya siku za kazi na hutegemea mkoa.",
          "Ni lazima mtu apatikane kwenye namba ya simu iliyotolewa kwenye oda.",
        ],
      },
    ],
  },
};

const privacy: Record<Locale, Policy> = {
  en: {
    title: "Privacy policy",
    intro:
      "We collect only what we need to get your order to you, and we do not sell it to anyone.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Your name, phone number, delivery address, and optionally your email.",
          "Your order history, so you and our team can look it up later.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To confirm, pack, and deliver your orders.",
          "To contact you about a specific order — never for marketing you did not ask for.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Our delivery riders and courier partners, who receive only the name, phone number, and address needed to deliver.",
          "Nobody else. We do not sell or rent customer data.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can see and correct your details from your account page at any time.",
          "Ask us and we will delete your account, except for order records we must keep for tax purposes.",
        ],
      },
    ],
  },
  sw: {
    title: "Sera ya faragha",
    intro:
      "Tunakusanya tu kile tunachohitaji ili kukufikishia oda yako, na hatuiuzi kwa mtu yeyote.",
    sections: [
      {
        heading: "Tunachokusanya",
        body: [
          "Jina lako, namba ya simu, anwani ya kufikisha, na barua pepe kama utapenda.",
          "Historia ya oda zako, ili wewe na timu yetu muweze kuiangalia baadaye.",
        ],
      },
      {
        heading: "Jinsi tunavyotumia",
        body: [
          "Kuthibitisha, kufunga, na kufikisha oda zako.",
          "Kuwasiliana nawe kuhusu oda maalum — kamwe si kwa matangazo usiyoyaomba.",
        ],
      },
      {
        heading: "Tunashiriki na nani",
        body: [
          "Madereva wetu na washirika wa usafirishaji, wanaopokea jina, namba ya simu, na anwani tu inayohitajika kufikisha.",
          "Hakuna mwingine. Hatuuzi wala kukodisha taarifa za wateja.",
        ],
      },
      {
        heading: "Haki zako",
        body: [
          "Unaweza kuona na kurekebisha taarifa zako kwenye ukurasa wa akaunti yako wakati wowote.",
          "Tuambie nasi tutafuta akaunti yako, isipokuwa kumbukumbu za oda tunazopaswa kuhifadhi kwa ajili ya kodi.",
        ],
      },
    ],
  },
};

export const POLICIES = { returns, terms, privacy };
export type PolicyKey = keyof typeof POLICIES;

export function getPolicy(key: PolicyKey, locale: Locale): Policy {
  return POLICIES[key][locale];
}

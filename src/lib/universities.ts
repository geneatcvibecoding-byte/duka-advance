/**
 * Tanzanian universities, with the email domain students actually use.
 *
 * Stored in the database too (see prisma/universities.ts) so an admin can add a
 * campus without a deploy. This file is the seed source and the fallback for
 * matching an address when no row exists yet.
 *
 * The domain is the whole verification mechanism, so two campuses sharing a
 * domain is a data error: verifying one would verify the other. That is why
 * `emailDomain` is unique in the schema.
 */

export type UniversitySeed = {
  slug: string;
  nameEn: string;
  nameSw: string;
  emailDomain: string;
  region: string;
};

export const UNIVERSITY_SEEDS: readonly UniversitySeed[] = [
  {
    slug: "udsm",
    nameEn: "University of Dar es Salaam",
    nameSw: "Chuo Kikuu cha Dar es Salaam",
    emailDomain: "udsm.ac.tz",
    region: "Ilala",
  },
  {
    slug: "must",
    nameEn: "Mbeya University of Science and Technology",
    nameSw: "Chuo Kikuu cha Sayansi na Teknolojia cha Mbeya",
    emailDomain: "must.ac.tz",
    region: "Mbeya",
  },
  {
    slug: "udom",
    nameEn: "University of Dodoma",
    nameSw: "Chuo Kikuu cha Dodoma",
    emailDomain: "udom.ac.tz",
    region: "Dodoma",
  },
  {
    slug: "out",
    nameEn: "Open University of Tanzania",
    nameSw: "Chuo Kikuu Huria cha Tanzania",
    emailDomain: "out.ac.tz",
    region: "Dodoma",
  },
  {
    slug: "arusha",
    nameEn: "University of Arusha",
    nameSw: "Chuo Kikuu cha Arusha",
    emailDomain: "uarush.ac.tz",
    region: "Arusha",
  },
  {
    slug: "zou",
    nameEn: "Zanzibar University",
    nameSw: "Chuo Kikuu cha Zanzibar",
    emailDomain: "zu.ac.tz",
    region: "Zanzibar",
  },
  {
    slug: "nm-a", // formerly NM-AIST, renamed 2023
    nameEn: "Nelson Mandela African Institution of Science and Technology",
    nameSw: "Taasisi ya Sayansi na Teknolojia ya Afrika ya Nelson Mandela",
    emailDomain: "nmail.ac.tz",
    region: "Arusha",
  },
  {
    slug: "katolyo",
    nameEn: "St. Augustine University of Tanzania",
    nameSw: "Chuo Kikuu cha St. Augustine cha Tanzania",
    emailDomain: "saut.ac.tz",
    region: "Arusha",
  },
  {
    slug: "tum",
    nameEn: "Tumaini University Makumira",
    nameSw: "Chuo Kikuu cha Tumaini Makumira",
    emailDomain: "tum.ac.tz",
    region: "Kilimanjaro",
  },
  {
    slug: "hub",
    nameEn: "Hubert Kairuki Memorial University",
    nameSw: "Chuo Kikuu cha Hubert Kairuki",
    emailDomain: "hkmu.ac.tz",
    region: "Dodoma",
  },
];

/**
 * Pull the domain out of an address, lowercased.
 *
 * Rejects anything that is not a plain address: a string with no "@", a second
 * "@", leading/trailing dots in the domain, or a missing dot in the domain all
 * return null rather than being silently repaired.
 */
export function extractEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) return null;

  const at = trimmed.indexOf("@");
  if (at < 1) return null;
  if (at !== trimmed.lastIndexOf("@")) return null; // more than one @

  const domain = trimmed.slice(at + 1);
  if (!domain || domain.length > 253) return null;
  if (domain.startsWith(".") || domain.endsWith(".")) return null;
  if (domain.includes("..")) return null;
  if (!domain.includes(".")) return null;
  if (!/^[a-z0-9.-]+$/.test(domain)) return null;

  return domain;
}

/** Match an address against a known campus, by domain. */
export function universityForDomain(
  email: string,
  seeds: readonly UniversitySeed[] = UNIVERSITY_SEEDS,
): UniversitySeed | null {
  const domain = extractEmailDomain(email);
  if (!domain) return null;
  return seeds.find((u) => u.emailDomain === domain) ?? null;
}

/** Student email addresses are commonly on a sub-domain; match the parent. */
export function isStudentEmailDomain(domain: string, known: string[]): boolean {
  return known.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );
}

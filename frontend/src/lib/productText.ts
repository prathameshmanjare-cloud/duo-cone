// German product names and descriptions, generated from the English catalog
// data. Names follow a handful of patterns ("<Brand> Metal Face Seal DO Type
// Group 386-1089 Seal Nr 383-0962") and descriptions one template, so both
// translate deterministically; anything unrecognised stays in English.
import type { Lang } from "./i18n";
import { clean } from "./seo";

const NAME_RULES: [RegExp, string][] = [
  [/\bAftermarket Mechanical Face Seal\b/g, "Aftermarket-Laufwerksdichtung"],
  [/\b(?:Mechanical|Metal) Face Seal\b/g, "Laufwerksdichtung"],
  [/\b(DF|DO) Type\b/g, "Typ $1"],
  [/\bType\b/g, "Typ"],
  [/\bGroup\s*/g, "Gruppe "],
  [/\bSeal Nr\b/g, "Dichtung Nr."],
];

export function deProductName(name: string) {
  return clean(NAME_RULES.reduce((s, [re, to]) => s.replace(re, to), name));
}

export const productName = (name: string, lang: Lang) => (lang === "de" ? deProductName(name) : clean(name));

const de = (n: string) => n.replace(/,/g, "."); // 5,000 -> 5.000

// the description template, sentence by sentence
const DESCRIPTION_RULES: [RegExp, (...m: string[]) => string][] = [
  [/High OEM Quality for replacement (.+?)(?=<\/p>|$)/, (_, ref) => `Hochwertiger Ersatz in OEM-Qualität für ${ref}`],
  [/<strong>Lifetime:<\/strong> Up to ([\d,]+) - ([\d,]+) hours for extended durability\./,
    (_, a, b) => `<strong>Lebensdauer:</strong> Bis zu ${de(a)}–${de(b)} Betriebsstunden für hohe Haltbarkeit.`],
  [/<strong>Hardness:<\/strong> Exceptional hardness rating of (\d+)-(\d+) HRC, ensuring high wear resistance\./,
    (_, a, b) => `<strong>Härte:</strong> Hohe Härte von ${a}–${b} HRC für hohe Verschleißfestigkeit.`],
  [/<strong>Seal Material:<\/strong> Constructed from premium materials such as <strong>NI-HARD<\/strong> \(ASTM (A\d+)\) or in <strong>SAE (\d+)<\/strong> \(high-carbon, chromium alloy steel\) for enhanced performance\./,
    (_, astm, sae) => `<strong>Dichtring-Werkstoff:</strong> Hochwertige Werkstoffe wie <strong>NI-HARD</strong> (ASTM ${astm}) oder <strong>SAE ${sae}</strong> (kohlenstoffreicher Chromstahl) für hohe Leistung.`],
  [/<strong>Manufacturing Process:<\/strong> Available in both casting and forged options, tailored to your specific needs\. Contact us\./,
    () => "<strong>Fertigung:</strong> Als Guss- oder Schmiedeausführung erhältlich, abgestimmt auf Ihren Bedarf. Sprechen Sie uns an."],
  [/<strong>Inner and Outer Diameter: <\/strong>The dimensions correspond exactly to the specified OEM reference number\./,
    () => "<strong>Innen- und Außendurchmesser: </strong>Die Abmessungen entsprechen exakt der angegebenen OEM-Referenznummer."],
  [/<strong>O-Ring Material:<\/strong> Choose from NBR, FKM, Silicone, or HNBR for optimal compatibility with various media\. Contact us\./,
    () => "<strong>O-Ring-Werkstoff:</strong> Wahlweise NBR, FKM, Silikon oder HNBR, passend zum jeweiligen Medium. Sprechen Sie uns an."],
  [/<strong>Rubber Ring Hardness:<\/strong> Designed with a hardness of (\d+)-(\d+)(&deg;|°) for reliable sealing performance\./,
    (_, a, b) => `<strong>Härte des Gummirings:</strong> ${a}–${b}° für zuverlässige Abdichtung.`],
  [/<strong>Warranty:<\/strong> Enjoy peace of mind with an (\d+)-month warranty following shipment\./,
    (_, n) => `<strong>Gewährleistung:</strong> ${n} Monate ab Versand.`],
  [/<strong>Availability:<\/strong> Warehouse in Germany\. All parts available from Germany\./,
    () => "<strong>Verfügbarkeit:</strong> Lager in Deutschland. Alle Teile ab Deutschland lieferbar."],
];

/** German version of a template description, or null if any sentence is not
 *  part of the known template (then the English text is shown). */
export function deDescriptionHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  let out = html;
  for (const [re, to] of DESCRIPTION_RULES) out = out.replace(re, (...m) => to(...(m as string[])));
  // every paragraph and list item must have been translated
  const leftovers = (out.match(/<(p|li)>([\s\S]*?)<\/\1>/g) ?? []).filter(
    (block) => !/(Hochwertiger Ersatz|<strong>(Lebensdauer|Härte|Dichtring-Werkstoff|Fertigung|Innen- und|O-Ring-Werkstoff|Gewährleistung|Verfügbarkeit))/.test(block)
  );
  return leftovers.length ? null : out;
}

export function deShortDescription(text: string | null | undefined): string | null {
  const m = text?.match(/^High OEM Quality for replacement (.+)$/);
  return m ? `Hochwertiger Ersatz in OEM-Qualität für ${m[1]}` : null;
}

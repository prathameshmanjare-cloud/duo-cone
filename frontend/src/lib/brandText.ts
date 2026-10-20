// German brand page texts (approved draft, docs/DE-Texte-Entwurf.md), built
// from live catalog numbers so they stay correct when the catalog changes.
import type { SegmentSlug } from "./catalog";

export type BrandStats = { total: number; df: number; do: number; samples: string[] };

const TITLE_MAX = 60;
const num = (n: number) => n.toLocaleString("de-DE");

function typeLabel(s: BrandStats) {
  const t = [s.df > 0 && "DF", s.do > 0 && "DO"].filter(Boolean);
  return t.length ? ` – Typ ${t.join(" & ")}` : "";
}

function typesPhrase(s: BrandStats) {
  const parts = [s.df > 0 && `${num(s.df)} vom Typ DF`, s.do > 0 && `${num(s.do)} vom Typ DO`].filter(Boolean) as string[];
  const other = s.total - s.df - s.do;
  if (parts.length && other > 0) parts.push(`${num(other)} weitere Ausführungen`);
  if (!parts.length) return "";
  return " – davon " + (parts.length > 1 ? parts.slice(0, -1).join(", ") + " und " + parts.at(-1) : parts[0]);
}

export function deBrandSeo(brand: string, segment: SegmentSlug, s: BrandStats) {
  if (segment === "aftermarket") {
    const title = `Laufwerksdichtungen für ${brand}${typeLabel(s)} | Duo Cone`;
    return {
      title: title.length <= TITLE_MAX ? title : `Laufwerksdichtungen für ${brand} | Duo Cone`,
      description: `${num(s.total)} Laufwerksdichtungen (Gleitringdichtungen) passend für ${brand}-Maschinen. Suche nach OEM-Teilenummer, Versand in 24 h ab Deutschland.`,
      h1: `Laufwerksdichtungen passend für ${brand}`,
    };
  }
  const title = `${brand} Laufwerksdichtungen${typeLabel(s)} | Duo Cone`;
  return {
    title: title.length <= TITLE_MAX ? title : `${brand} Laufwerksdichtungen | Duo Cone`,
    description: `${num(s.total)} Laufwerksdichtungen nach ${brand}-Referenz (Gleitringdichtungen, Duo-Cone-Dichtungen). Suche nach Teilenummer, Versand in 24 h ab Deutschland.`,
    h1: `${brand} Laufwerksdichtungen`,
  };
}

export function deBrandText(brand: string, segment: SegmentSlug, s: BrandStats): string[] {
  const samples = s.samples.slice(0, 3).join(", ");
  const intro =
    segment === "aftermarket"
      ? `Hier finden Sie ${num(s.total)} Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) passend für ${brand}-Maschinen${typesPhrase(s)}. Jede Dichtung ist einer ${brand}-Teilenummer zugeordnet: Suchen Sie einfach nach Ihrer OEM-Nummer${samples ? `, zum Beispiel ${samples}` : ""}.`
      : `Hier finden Sie ${num(s.total)} Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) nach ${brand}-Referenz${typesPhrase(s)}. Die Abmessungen entsprechen der jeweiligen ${brand}-Teilenummer: Suchen Sie nach Ihrer Referenz${samples ? `, zum Beispiel ${samples}` : ""}.`;
  return [
    intro,
    "Die Dichtringe bestehen aus NI-HARD (ASTM A532) oder SAE 52100 mit einer Härte von 58–62 HRC, die O-Ringe sind in NBR, FKM, Silikon oder HNBR erhältlich. Innen- und Außendurchmesser entsprechen exakt der OEM-Referenz. Typische Einbauorte sind Laufrollen, Leiträder, Endantriebe und Achsen.",
    "Lagerware versenden wir innerhalb von 24 Stunden aus Deutschland, mit 24 Monaten Gewährleistung ab Versand. Für Artikel mit „Preis auf Anfrage“ erhalten Sie Preis und Lieferzeit innerhalb von 24 Stunden.",
    `${brand} ist eine Marke des jeweiligen Inhabers. DUO-CONE steht in keiner Verbindung zu ${brand}; Marken und Teilenummern dienen nur der Zuordnung.`,
  ];
}

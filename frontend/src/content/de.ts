// German page titles, meta descriptions and main headings, from the approved
// draft docs/DE-Texte-Entwurf.md (titles <= 60, descriptions <= 155 chars).
export const DE_SEO = {
  "home": {
    "title": "Laufwerksdichtungen DF & DO – Gleitringdichtungen | Duo Cone",
    "description": "Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) Typ DF und DO für Bau-, Bergbau- und Landmaschinen. Versand in 24 h ab Deutschland.",
    "h1": "DF- & DO-Laufwerksdichtungen"
  },
  "shop": {
    "title": "Laufwerksdichtungen kaufen – Typ DF & DO | Duo Cone",
    "description": "Laufwerksdichtungen (Gleitringdichtungen, Duo-Cone-Dichtungen) Typ DF und DO: Replacement und Aftermarket für Caterpillar, Komatsu, Goetze, SKF u. v. m.",
    "h1": "Laufwerksdichtungen"
  },
  "replacement": {
    "title": "Replacement Laufwerksdichtungen | Duo Cone",
    "description": "Laufwerksdichtungen nach den Spezifikationen führender Dichtungshersteller: Goetze, Trelleborg, SKF, Eagle Burgmann, GNL, Nuova Sjat. Versand in 24 h.",
    "h1": "Replacement-Laufwerksdichtungen"
  },
  "aftermarket": {
    "title": "Aftermarket Laufwerksdichtungen für OEM-Maschinen | Duo Cone",
    "description": "Aftermarket-Laufwerksdichtungen passend für Caterpillar, Komatsu, Liebherr, John Deere, Hitachi und weitere Bau-, Bergbau- und Landmaschinen.",
    "h1": "Aftermarket-Laufwerksdichtungen"
  },
  "about": {
    "title": "Über uns – Spezialist für Laufwerksdichtungen | Duo Cone",
    "description": "DUO-CONE ist ein deutscher Spezialist und Distributor für Laufwerksdichtungen schwerer Maschinen – Lager und Versand ab Deutschland, Angebote innerhalb von 24 Stunden.",
    "h1": "Präzision & Verfügbarkeit. Direkt aus Deutschland."
  },
  "technology": {
    "title": "Technologie – So entstehen Laufwerksdichtungen | Duo Cone",
    "description": "So entstehen DUO-CONE-Laufwerksdichtungen: Schleuderguss, CNC-Bearbeitung, optisches Läppen, Elastomer-Formung, Schleifen, Wärmebehandlung.",
    "h1": "Entwickelt bis auf Mikrometer-Ebene."
  },
  "industries": {
    "title": "Branchen – Laufwerksdichtungen für Schwerlast | Duo Cone",
    "description": "Wo DUO-CONE-Laufwerksdichtungen leckagefrei abdichten: Bergbau, Bau, Forst, Verteidigung, Zement, Tunnelvortrieb, Landtechnik, Recycling und mehr.",
    "h1": "Entwickelt für jede Umgebung."
  },
  "contact": {
    "title": "Kontakt – Laufwerksdichtungen aus Deutschland | Duo Cone",
    "description": "Kontakt zu DUO-CONE, Spezialist für Laufwerksdichtungen in Deutschland. Anfrage per Formular, Telefon, WhatsApp oder E-Mail – Antwort in einem Werktag.",
    "h1": "Kontakt"
  },
  "faq": {
    "title": "FAQ – Laufwerksdichtungen (Gleitringdichtungen) | Duo Cone",
    "description": "Antworten zu Laufwerksdichtungen Typ DF und DO: Bestellung, Suche nach OEM-Teilenummer, Lieferung aus Deutschland, Gewährleistung und Rückgabe.",
    "h1": "Häufig gestellte Fragen"
  },
  "rfq": {
    "title": "Angebot anfordern | Duo Cone",
    "description": "Fordern Sie ein Angebot für Laufwerksdichtungen an: Teilenummern eingeben, Preis und Lieferzeit erhalten Sie innerhalb von 24 Stunden.",
    "h1": "Angebot anfordern"
  }
} as const;

export type DePage = keyof typeof DE_SEO;

import { StaticPage } from "./StaticPage";

export const About = () => (
  <StaticPage
    title="About DuoCon"
    intro="German manufacturer for mechanical face seals — a reasonable, reliable player in the field of industrial sealing."
    sections={[
      { heading: "Our story", body: "DuoCon manufactures Duo Cone mechanical face seals (DF and DO type) for heavy machinery across mining, construction, agriculture, forestry, recycling and defense." },
      { heading: "Why DuoCon", body: "Wide range of sizes, short delivery time, reasonable pricing and a top service level — with an Express Offer promise of RFQ within 24 hours and shipping within 72 hours." },
      { heading: "Quality", body: "Every seal is made from top-quality, wear- and corrosion-resistant materials and backed by a 24-month warranty." },
    ]}
  />
);

export const Technology = () => (
  <StaticPage
    title="Technology"
    intro="Advanced materials and manufacturing for demanding sealing environments."
    sections={[
      { heading: "Materials", body: "Seal rings in NI-HARD (ASTM A532) or SAE 52100 high-carbon chromium alloy steel, hardened to 58–62 HRC for wear resistance." },
      { heading: "Manufacturing", body: "Available in both casting and forged processes, tailored to load and application requirements." },
      { heading: "Elastomers", body: "O-rings in NBR, FKM, Silicone or HNBR for compatibility with hydraulic fluid, fuel, or extreme temperature environments." },
    ]}
  />
);

export const Industries = () => (
  <StaticPage
    title="Industries We Serve"
    intro="We drive progress across key sectors with sealing solutions engineered for the harshest environments."
    sections={[
      { heading: "Mining", body: "High-pressure face seals for excavators and haul equipment operating in abrasive conditions." },
      { heading: "Construction", body: "Reliable seals for hydraulic systems in excavators, loaders and construction machinery." },
      { heading: "Agriculture & Forestry", body: "Wear-resistant seals for tractors, harvesters and forestry equipment." },
      { heading: "Recycling & Defense", body: "Custom sealing solutions for recycling machinery and defense-grade equipment." },
    ]}
  />
);

export const Shipping = () => (
  <StaticPage
    title="Shipping"
    sections={[
      { heading: "Delivery timelines", body: "Orders ship within 72 hours from our German warehouse." },
      { heading: "Shipping charges", body: "Calculated at checkout based on destination and weight." },
      { heading: "Serviceable locations", body: "We ship across the EU and worldwide on request." },
      { heading: "Tracking", body: "A tracking link is emailed as soon as your order ships." },
    ]}
  />
);

export const Returns = () => (
  <StaticPage
    title="Returns & Refunds"
    sections={[
      { heading: "Return policy", body: "Unused seals in original packaging may be returned within 14 days of delivery." },
      { heading: "Damaged products", body: "Report damaged items within 48 hours of delivery with photos for a replacement or refund." },
      { heading: "Cancellation", body: "Orders can be cancelled before shipment; contact support as soon as possible." },
    ]}
  />
);

export const Privacy = () => (
  <StaticPage
    title="Privacy Policy"
    sections={[
      { heading: "Data we collect", body: "Contact details, order and RFQ information, and site usage analytics." },
      { heading: "How we use it", body: "To process orders and RFQs, provide support, and improve our service." },
      { heading: "Your rights", body: "You may request access, correction, or deletion of your data at any time by contacting privacy@duo-cone.com." },
    ]}
  />
);

export const Terms = () => (
  <StaticPage
    title="Terms & Conditions"
    sections={[
      { heading: "Orders", body: "Placing an order constitutes an offer to purchase, accepted upon our confirmation." },
      { heading: "Pricing", body: "Prices are shown excl. VAT and shipping unless stated otherwise." },
      { heading: "Warranty", body: "All seals carry a 24-month warranty from date of shipment against manufacturing defects." },
    ]}
  />
);

export const CookiePolicy = () => (
  <StaticPage
    title="Cookie Policy"
    sections={[
      { heading: "Essential cookies", body: "Used for cart, session and security — required for the site to function." },
      { heading: "Analytics cookies", body: "Help us understand site usage; you may opt out at any time." },
    ]}
  />
);

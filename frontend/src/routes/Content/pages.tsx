import { StaticPage } from "./StaticPage";

export { About } from "./About";
export { Technology } from "./Technology";
export { Industries } from "./Industries";

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
      { heading: "Essential cookies", body: "Used for cart, session and security, required for the site to function." },
      { heading: "Analytics cookies", body: "Help us understand site usage; you may opt out at any time." },
    ]}
  />
);

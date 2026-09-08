/** Single source of truth for public-facing DuoCone contact details.
 *  Update here and every CTA / footer / About block stays in sync. */

export const COMPANY = {
  legalName: "DUO-CONE GmbH",
  phoneDisplay: "+49 155 10386300",
  phoneHref: "tel:+4915510386300",
  email: "sale@duo-cone.com",
  street: "Wohlandstraße 20",
  postcodeCity: "51766 Engelskirchen",
  country: "Germany",
  hours: "Mon – Fri: 08:00 – 18:00 CET",
  certification: "DIN EN ISO 9001:2015",
} as const;

export const COMPANY_ADDRESS = `${COMPANY.street}, ${COMPANY.postcodeCity}, ${COMPANY.country}`;

export const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  COMPANY_ADDRESS
)}&output=embed`;

export const MAP_LINK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  COMPANY_ADDRESS
)}`;

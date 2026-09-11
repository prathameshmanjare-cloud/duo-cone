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

export const LegalNotice = () => (
  <StaticPage
    title="Legal Notice"
    sections={[
      {
        heading: "Provider",
        body: "Kumar Chugh, Wohlandstraße 20, 51766 Engelskirchen, Germany. Tel.: +49 155 10386300. E-mail: sale@duo-cone.com.",
      },
      {
        heading: "Registration details",
        body: "VAT ID: DE62529307843. Tax Number: 212/5035/5426. LUCID Number: DE4303987898555.",
      },
      {
        heading: "Bank details",
        body: "Bank: C24. Account Holder: Kumar Chugh. IBAN: DE93 5002 4024 2937 8701 01.",
      },
      {
        heading: "Online dispute resolution",
        body: "In accordance with Art. 14 (1) ODR Regulation: https://ec.europa.eu/consumers/odr. We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.",
      },
    ]}
  />
);

export const Privacy = () => (
  <StaticPage
    title="Data Protection Declaration"
    sections={[
      {
        heading: "1) Information on the collection of personal data and contact details of the controller",
        body: "We are pleased that you are visiting our website and thank you for your interest. On the following pages, we inform you about the handling of your personal data when using our website. Personal data is all data with which you can be personally identified. The controller in charge of data processing on this website, within the meaning of the General Data Protection Regulation (GDPR), is Kumar Chugh, Wohlandstraße 20, 51766 Engelskirchen, Phone: +49 155 10386300, e-mail: sale@duo-cone.com. The controller in charge of the processing of personal data is the natural or legal person who alone or jointly with others determines the purposes and means of the processing of personal data.",
      },
      {
        heading: "2) Data collection when you visit our website",
        body: "When using our website for information only, i.e. if you do not register or otherwise provide us with information, we only collect data that your browser transmits to our server (so-called \"server log files\"). When you visit our website, we collect the following data that is technically necessary for us to display the website to you: the visited page, date and time of access, amount of data sent in bytes, source/reference from which you came to the page, browser used, operating system used, and IP address used (if applicable, in anonymized form). Data processing is carried out in accordance with Art. 6 (1) point f GDPR on the basis of our legitimate interest in improving the stability and functionality of our website. The data will not be passed on or used in any other way. However, we reserve the right to check the server log files subsequently, if there are any concrete indications of illegal use. This website uses SSL or TLS encryption for security reasons and to protect the transmission of personal data and other confidential content (e.g. orders or inquiries to the controller). You can recognize an encrypted connection by the character string https:// and the lock symbol in your browser line.",
      },
      {
        heading: "3) Hosting & content delivery network",
        body: "For the hosting of our website and the presentation of the page content, we use a provider that provides its services itself or through selected subcontractors exclusively on servers within the European Union. All data collected on our website is processed on these servers. We have concluded an order processing contract with the provider, which ensures the protection of the data of our website visitors and prohibits unauthorised disclosure to third parties.",
      },
      {
        heading: "4) Cookies",
        body: "In order to make your visit to our website more attractive and to enable the use of certain functions, we use cookies, i.e. small text files that are stored on your end device. In some cases, these cookies are automatically deleted again after the browser is closed (\"session cookies\"), in other cases these cookies remain on your end device for longer and allow page settings to be saved (\"persistent cookies\"). If personal data is also processed by individual cookies set by us, the processing is carried out either in accordance with Art. 6 (1) point b GDPR for the performance of the contract, in accordance with Art. 6 (1) point a GDPR in the case of consent given, or in accordance with Art. 6 (1) point f GDPR to safeguard our legitimate interests in the best possible functionality of the website. You can set your browser so that you are informed about the setting of cookies and decide individually about their acceptance, or exclude the acceptance of cookies for certain cases or in general. Please note that the functionality of our website may be limited if cookies are not accepted.",
      },
      {
        heading: "5) Contacting us",
        body: "WhatsApp Business: we offer visitors the opportunity to contact us via the WhatsApp news service of WhatsApp Ireland Limited, 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Ireland, using the \"Business Version\" of WhatsApp. If you contact us via WhatsApp in connection with a specific business transaction, we store and use the mobile number and — if provided — your name in accordance with Art. 6 (1) lit. b GDPR to process your request. For general enquiries via WhatsApp, we rely on Art. 6 (1) lit. f GDPR based on our legitimate interest in responding efficiently. Your data is used only to answer your request and is not passed on to third parties, though data may be transferred to Meta Platforms Inc. in the USA, which participates in the EU-US Data Privacy Framework. See WhatsApp's privacy policy: https://www.whatsapp.com/legal/?eea=1#privacy-policy. When you contact us by other means (e.g. contact form or e-mail), the data submitted is stored and used exclusively to respond to your request, on the basis of Art. 6 (1) point f GDPR (and Art. 6 (1) point b GDPR where your contact aims at concluding a contract). Your data is deleted once your enquiry has been finally processed, unless legal retention obligations apply.",
      },
      {
        heading: "6) Data processing when opening a customer account and for contract processing",
        body: "Pursuant to Art. 6 (1) point b GDPR, personal data is collected and processed to the extent required when you open a customer account. Deletion of your account is possible at any time by contacting the address above; your data is then deleted once all related contracts have been fully processed, provided no legal retention periods or legitimate interest in continued storage stand in the way.",
      },
      {
        heading: "7) Processing of data for the purpose of order handling",
        body: "Insofar as necessary for delivery and payment, the personal data we collect is passed on to the commissioned transport company and credit institution in accordance with Art. 6 (1) lit. b GDPR. Where we owe you updates for goods with digital elements, we process your contact data to inform you as required under Art. 6 (1) lit. c GDPR. We also work with service providers who support us in executing concluded contracts; certain personal data is transferred to them only to the extent necessary.",
      },
      {
        heading: "8) Web analysis services",
        body: "Google Analytics 4: this website uses Google Analytics 4, a service of Google Ireland Limited, Gordon House, 4 Barrow St, Dublin, D04 E5W5, Ireland, to analyze website usage via cookies. Collected data, including an IP address shortened/anonymized within the EU/EEA, may be transmitted to Google LLC servers in the USA for further processing, under the EU-US Data Privacy Framework. Google Analytics 4 (including \"Google Signals\" cross-device tracking and \"User IDs\") is only used with your express consent under Art. 6 (1) lit. a GDPR, which you can revoke at any time via the cookie consent tool on this website. Further information: https://policies.google.com/privacy?hl=en and https://policies.google.com/technologies/partner-sites.",
      },
      {
        heading: "9) Rights of the data subject",
        body: "Applicable data protection law grants you the right of access (Art. 15 GDPR), rectification (Art. 16 GDPR), erasure / \"right to be forgotten\" (Art. 17 GDPR), restriction of processing (Art. 18 GDPR), to be informed (Art. 19 GDPR), data portability (Art. 20 GDPR), to withdraw consent (Art. 7 (3) GDPR), and to lodge a complaint (Art. 77 GDPR). Where we process your data on the basis of a legitimate interest, you have the right to object at any time on grounds relating to your particular situation; we will then stop processing the data concerned unless we can demonstrate compelling legitimate grounds, or the processing serves to assert, exercise, or defend legal claims. You may object at any time to processing for direct-marketing purposes.",
      },
      {
        heading: "10) Duration of storage of personal data",
        body: "The duration of storage is based on the applicable legal basis, the purpose of processing, and any statutory retention period (e.g. commercial and tax retention periods). Data processed on the basis of consent is stored until you revoke it. Data subject to legal retention periods is deleted once those periods expire and the data is no longer necessary for the contract. Data processed on the basis of legitimate interest is stored until you exercise your right to object, unless we have compelling grounds for continued processing.",
      },
    ]}
  />
);

export const Terms = () => (
  <StaticPage
    title="Terms & Conditions"
    intro="Version: 09/2025 – DUO-CONE"
    sections={[
      {
        heading: "I. Scope",
        body: "These General Terms and Conditions (GTC) apply to all sales and deliveries by DUO-CONE (\"Supplier\"). The Supplier's GTC apply exclusively; any deviating or additional terms of the customer only apply if expressly confirmed in writing by DUO-CONE, and conflicting terms shall not become part of the contract. These GTC apply only to business customers, legal entities under public law, or public special funds within the meaning of § 310 (1) BGB, and also apply to future business transactions with the contracting party.",
      },
      {
        heading: "II. Conclusion of contract, contractual content",
        body: "Offers by DUO-CONE are non-binding. The scope, content, and characteristics of the contracted products are determined exclusively by DUO-CONE's contractual documents. The order confirmation from DUO-CONE is decisive; for immediate execution, the invoice or delivery note serves as confirmation, and any objections must be made promptly in writing. After contract conclusion, DUO-CONE reserves the right to make changes to the products, including minor deviations in color, design, dimensions, weight, or quantity.",
      },
      {
        heading: "III. Prices and payment terms",
        body: "Prices are ex-works from DUO-CONE's premises, plus shipping costs and statutory VAT. For orders over €250 within Germany and Austria, DUO-CONE covers shipping; deliveries to other countries are made to the German border. Payments are due within 20 days of the invoice date, with a 2% discount for payment within 10 days. Late payments place the customer automatically in default and statutory regulations apply; interest may be charged for deferred payments. Offsetting is only permitted with undisputed or legally established counterclaims.",
      },
      {
        heading: "IV. Delivery time, delivery obstacles, delay",
        body: "Delivery dates are binding only if expressly confirmed as such, and compliance requires timely fulfillment of the customer's cooperation duties. Delivery time is measured from dispatch from DUO-CONE's premises. Delays due to force majeure or unforeseeable events (e.g. strikes, raw material shortages) release DUO-CONE from liability, and DUO-CONE is liable for delays only as permitted by law, subject to Section VIII. The customer's right to withdraw arises only in the case of fixed-date contracts or demonstrable loss of performance interest. Partial deliveries are permitted.",
      },
      {
        heading: "V. Delivery, transfer of risk, customer duties",
        body: "Except for Euro pallets, packaging is not returned; disposal is the customer's responsibility. Risk passes to the customer upon delivery to the carrier or upon leaving DUO-CONE's premises. If the customer culpably fails to fulfill their obligations, DUO-CONE may claim damages, including any additional costs incurred.",
      },
      {
        heading: "VI. Retention of title",
        body: "DUO-CONE retains ownership of the goods until full payment is received. The customer may resell the goods in the ordinary course of business but assigns all resulting claims to DUO-CONE. Processing or transformation of the goods is carried out on behalf of DUO-CONE, and in the case of mixing or combining goods with other items, DUO-CONE acquires co-ownership proportional to the invoice value. The customer must handle the reserved goods with care and insure them adequately. DUO-CONE may release collateral if its value exceeds the secured claims by more than 10%.",
      },
      {
        heading: "VII. Product description, warranty",
        body: "Product descriptions define the characteristics of the goods; claims do not exist for minor deviations. Customers must inspect goods promptly and notify DUO-CONE of defects according to § 377 HGB. DUO-CONE may choose to remedy defects by repair or replacement; if remedy is impossible, the customer may reduce the purchase price or withdraw from the contract. Statutory provisions apply unless otherwise stated in these GTC, and claims for damages due to defects are subject to Section VIII.",
      },
      {
        heading: "VIII. Liability",
        body: "DUO-CONE is liable according to statutory provisions. Unlimited liability exists in cases of intent, gross negligence, fraudulent concealment of defects, injury to life, body, or health, and where a product guarantee is given. For simple negligence, liability is limited to foreseeable, typical damages from essential contractual obligations. Liability under the Product Liability Act remains unaffected, and liability limitations also apply to employees, representatives, and agents.",
      },
      {
        heading: "IX. Liability for ancillary obligations",
        body: "Liability for damages arising from pre-contractual advice, instructions, or other ancillary duties is governed by the provisions of Section VIII above.",
      },
      {
        heading: "X. Customer withdrawal",
        body: "The customer must declare within a reasonable period whether they wish to withdraw or insist on delivery.",
      },
      {
        heading: "XI. Statute of limitations",
        body: "The standard limitation period for claims is 1 year from delivery; for buildings or building materials, 5 years from delivery (§ 438 (1) No. 2 BGB). Statutory special provisions and product liability remain unaffected.",
      },
      {
        heading: "XII. Assignment of claims",
        body: "Claims of the customer against DUO-CONE may only be assigned with prior written consent.",
      },
      {
        heading: "XIII. Final provisions",
        body: "Place of performance is DUO-CONE's premises. For merchants, legal entities under public law, or special funds, jurisdiction is DUO-CONE's premises or, at DUO-CONE's choice, the customer's premises. German law applies exclusively, excluding the UN Sales Convention (CISG). Should any provision be invalid, the remaining provisions remain valid.",
      },
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

/**
 * GWD's real contact details, in one place.
 *
 * These were previously hardcoded per page, and several were placeholders that
 * had reached production: the Contact page advertised a support address on a
 * domain GWD does not own, a phone number of the literal form
 * "+91 040-XXXX-XXXX", and a postcode written as "500 XXX". A visitor who tried
 * any of them reached nothing.
 *
 * One module so a change lands everywhere at once, and so a placeholder cannot
 * survive in a corner nobody re-reads.
 */

export const GWD_PHONE_DISPLAY = '+91 79813 74451';
/** E.164, digits only — for `tel:` and the WhatsApp deep link. */
export const GWD_PHONE_E164 = '917981374451';
export const GWD_EMAIL = 'rahman@gwdglobal.in';

export const GWD_COMPANY = 'GWD Global Pvt Ltd';
export const GWD_WEBSITE = 'https://www.gwdglobal.in';

export const GWD_ADDRESS_NAME = 'GWD Global Studio';
export const GWD_ADDRESS_CITY = 'Hyderabad, Telangana, India';

/**
 * Google Maps place link.
 *
 * Deliberately the stable `search?api=1` form rather than the long URL copied
 * out of a browser session — that one carries `vet`, `lqi`, `ftid` and other
 * session/tracking parameters which are not guaranteed to resolve for anyone
 * else and are ugly to keep in source.
 */
export const GWD_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=GWD+Global+Studio+Hyderabad';

export const GWD_HOURS = 'Monday – Saturday, 9:00 AM – 6:00 PM IST';

/** Pre-filled so the first message already says why they are writing. */
export const WHATSAPP_ONBOARD_URL = `https://wa.me/${GWD_PHONE_E164}?text=${encodeURIComponent(
  "Hi GWD Sports — I'd like to register my academy on the platform.",
)}`;

export const MAILTO_ONBOARD = `mailto:${GWD_EMAIL}?subject=${encodeURIComponent(
  'Onboarding my academy to GWD Sports',
)}`;

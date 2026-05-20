import {
  hasCookieConsent,
  readCookieConsent,
} from "@/helpers/cookie-consent.helper";

export function isFunctionalConsentGranted(): boolean {
  return hasCookieConsent(readCookieConsent(), "functional");
}

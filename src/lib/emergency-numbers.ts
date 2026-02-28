// Country code (ISO 3166-1 alpha-2) → primary emergency number
const EMERGENCY_NUMBERS: Record<string, string> = {
  // North America
  US: '911', CA: '911', MX: '911',
  // Europe (112 is standard)
  GB: '999', IE: '999',
  AT: '112', BE: '112', BG: '112', HR: '112', CY: '112',
  CZ: '112', DK: '112', EE: '112', FI: '112', FR: '112',
  DE: '112', GR: '112', HU: '112', IS: '112', IT: '112',
  LV: '112', LT: '112', LU: '112', MT: '112', NL: '112',
  NO: '112', PL: '112', PT: '112', RO: '112', SK: '112',
  SI: '112', ES: '112', SE: '112', CH: '112', TR: '112',
  // Asia
  IN: '112', CN: '110', JP: '110', KR: '119',
  TH: '191', MY: '999', SG: '999', PH: '911',
  ID: '112', VN: '113', PK: '15',
  // Oceania
  AU: '000', NZ: '111',
  // South America
  BR: '190', AR: '911', CL: '131', CO: '123', PE: '105',
  // Africa
  ZA: '10111', NG: '112', KE: '999', EG: '122',
  // Middle East
  AE: '999', SA: '911', IL: '100',
  // Russia & CIS
  RU: '112', UA: '112',
};

const DEFAULT_EMERGENCY_NUMBER = '112';

export function getEmergencyNumber(countryCode: string): string {
  return EMERGENCY_NUMBERS[countryCode.toUpperCase()] ?? DEFAULT_EMERGENCY_NUMBER;
}

export { DEFAULT_EMERGENCY_NUMBER };

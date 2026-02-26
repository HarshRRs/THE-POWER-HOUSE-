import type { ConsulateConfig } from '../../types/consulate.types.js';

export const INDIAN_EMBASSY_PARIS: ConsulateConfig = {
  id: 'indian-embassy-paris',
  name: 'Indian Embassy Paris',
  country: 'India',
  city: 'Paris',
  type: 'embassy',
  baseUrl: 'https://appointment.eoiparis.com',
  checkInterval: 60,
  categories: [
    {
      id: 3,
      name: 'Passport',
      procedures: [
        'PASSPORT_RENEWAL',
        'PASSPORT_REISSUE',
        'PASSPORT_NEW',
        'PASSPORT_TATKAL',
      ],
    },
    {
      id: 1,
      name: 'OCI',
      procedures: [
        'OCI_REGISTRATION',
        'OCI_RENEWAL',
        'OCI_MISC',
      ],
    },
    {
      id: 2,
      name: 'Visa',
      procedures: [
        'VISA_CONSULAR',
      ],
    },
    {
      id: 27,
      name: 'Birth Registration',
      procedures: [
        'BIRTH_REGISTRATION',
      ],
    },
  ],
};

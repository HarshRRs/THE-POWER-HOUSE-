import type { VfsConfig } from '../../types/vfs.types.js';
import { Procedure } from '@prisma/client';

/**
 * VFS Italy configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Kolkata, Bangalore, Hyderabad, Ahmedabad, Pune, Chandigarh, Jaipur, Kochi, Goa
 */
export const VFS_ITALY_INDIA: VfsConfig = {
  id: 'vfs-italy-india',
  name: 'VFS Italy (India)',
  countryCode: 'ITA',
  destinationCountry: 'Italy',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/ita',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/ita/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'ahm', name: 'Ahmedabad', city: 'Ahmedabad', code: 'INAHME' },
    { id: 'pun', name: 'Pune', city: 'Pune', code: 'INPUNE' },
    { id: 'chd', name: 'Chandigarh', city: 'Chandigarh', code: 'INCHAN' },
    { id: 'jai', name: 'Jaipur', city: 'Jaipur', code: 'INJAIP' },
    { id: 'koc', name: 'Kochi', city: 'Kochi', code: 'INKOCH' },
    { id: 'goa', name: 'Goa', city: 'Panaji', code: 'INGOA' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (C)',
      code: 'tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_ITALY],
    },
    {
      id: 'business',
      name: 'Business Visa',
      code: 'business',
      procedures: [Procedure.SCHENGEN_BUSINESS_ITALY],
    },
    {
      id: 'student',
      name: 'Student Visa (D)',
      code: 'study',
      procedures: [Procedure.STUDENT_VISA_ITALY],
    },
    {
      id: 'work',
      name: 'Work Visa',
      code: 'work',
      procedures: [Procedure.WORK_VISA_ITALY],
    },
    {
      id: 'seasonal_work',
      name: 'Seasonal Work Visa (D)',
      code: 'seasonal_work',
      procedures: [Procedure.SEASONAL_WORK_VISA_ITALY],
    },
  ],
};

/**
 * VFS Germany configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Kolkata, Bangalore, Hyderabad
 */
export const VFS_GERMANY_INDIA: VfsConfig = {
  id: 'vfs-germany-india',
  name: 'VFS Germany (India)',
  countryCode: 'DEU',
  destinationCountry: 'Germany',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/deu',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/deu/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_GERMANY],
    },
    {
      id: 'business',
      name: 'Business Visa',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_GERMANY],
    },
    {
      id: 'student',
      name: 'Student Visa (National)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_GERMANY],
    },
    {
      id: 'work',
      name: 'Employment Visa',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_GERMANY],
    },
    {
      id: 'opportunity_card',
      name: 'Opportunity Card (Chancenkarte)',
      code: 'chancenkarte',
      procedures: [Procedure.OPPORTUNITY_CARD_GERMANY],
    },
  ],
};

/**
 * VFS France configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Kolkata, Bangalore, Hyderabad, Pune, Chandigarh
 */
export const VFS_FRANCE_INDIA: VfsConfig = {
  id: 'vfs-france-india',
  name: 'VFS France (India)',
  countryCode: 'FRA',
  destinationCountry: 'France',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/fra',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/fra/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'pun', name: 'Pune', city: 'Pune', code: 'INPUNE' },
    { id: 'chd', name: 'Chandigarh', city: 'Chandigarh', code: 'INCHAN' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Short Stay (Tourism)',
      code: 'court_sejour_tourisme',
      procedures: [Procedure.SCHENGEN_TOURIST_FRANCE],
    },
    {
      id: 'business',
      name: 'Short Stay (Business)',
      code: 'court_sejour_affaires',
      procedures: [Procedure.SCHENGEN_BUSINESS_FRANCE],
    },
    {
      id: 'student',
      name: 'Long Stay (Student)',
      code: 'long_sejour_etudiant',
      procedures: [Procedure.STUDENT_VISA_FRANCE],
    },
    {
      id: 'work',
      name: 'Long Stay (Work)',
      code: 'long_sejour_travail',
      procedures: [Procedure.WORK_VISA_FRANCE],
    },
  ],
};

/**
 * VFS Switzerland configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Bangalore, Hyderabad, Ahmedabad, Kolkata, Kochi
 */
export const VFS_SWITZERLAND_INDIA: VfsConfig = {
  id: 'vfs-switzerland-india',
  name: 'VFS Switzerland (India)',
  countryCode: 'CHE',
  destinationCountry: 'Switzerland',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/che',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/che/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'ahm', name: 'Ahmedabad', city: 'Ahmedabad', code: 'INAHME' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
    { id: 'koc', name: 'Kochi', city: 'Kochi', code: 'INKOCH' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_SWITZERLAND],
    },
    {
      id: 'business',
      name: 'Business Visa (Schengen)',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_SWITZERLAND],
    },
    {
      id: 'student',
      name: 'Student Visa (National)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_SWITZERLAND],
    },
    {
      id: 'work',
      name: 'Work Visa (National)',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_SWITZERLAND],
    },
  ],
};

/**
 * VFS Austria configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Pune, Bangalore, Chennai, Hyderabad
 */
export const VFS_AUSTRIA_INDIA: VfsConfig = {
  id: 'vfs-austria-india',
  name: 'VFS Austria (India)',
  countryCode: 'AUT',
  destinationCountry: 'Austria',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/aut',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/aut/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'pun', name: 'Pune', city: 'Pune', code: 'INPUNE' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_AUSTRIA],
    },
    {
      id: 'business',
      name: 'Business Visa (Schengen)',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_AUSTRIA],
    },
    {
      id: 'student',
      name: 'Student Visa (National D)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_AUSTRIA],
    },
    {
      id: 'work',
      name: 'Work Visa (Red-White-Red Card)',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_AUSTRIA],
    },
  ],
};

/**
 * VFS Belgium configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Pune, Bangalore, Chennai, Hyderabad, Kolkata
 */
export const VFS_BELGIUM_INDIA: VfsConfig = {
  id: 'vfs-belgium-india',
  name: 'VFS Belgium (India)',
  countryCode: 'BEL',
  destinationCountry: 'Belgium',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/bel',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/bel/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'pun', name: 'Pune', city: 'Pune', code: 'INPUNE' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_BELGIUM],
    },
    {
      id: 'business',
      name: 'Business Visa (Schengen)',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_BELGIUM],
    },
    {
      id: 'student',
      name: 'Student Visa (National D)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_BELGIUM],
    },
    {
      id: 'work',
      name: 'Work Visa (Single Permit)',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_BELGIUM],
    },
  ],
};

/**
 * VFS Netherlands configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Bangalore, Hyderabad, Kolkata, Ahmedabad, Pune
 */
export const VFS_NETHERLANDS_INDIA: VfsConfig = {
  id: 'vfs-netherlands-india',
  name: 'VFS Netherlands (India)',
  countryCode: 'NLD',
  destinationCountry: 'Netherlands',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/nld',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/nld/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
    { id: 'ahm', name: 'Ahmedabad', city: 'Ahmedabad', code: 'INAHME' },
    { id: 'pun', name: 'Pune', city: 'Pune', code: 'INPUNE' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_NETHERLANDS],
    },
    {
      id: 'business',
      name: 'Business Visa (Schengen)',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_NETHERLANDS],
    },
    {
      id: 'student',
      name: 'Student Visa (MVV)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_NETHERLANDS],
    },
    {
      id: 'work',
      name: 'Work Visa (Kennismigrant)',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_NETHERLANDS],
    },
  ],
};

/**
 * VFS Portugal configuration for Indian applicants
 * Centers: New Delhi, Mumbai, Chennai, Bangalore, Hyderabad, Kolkata
 */
export const VFS_PORTUGAL_INDIA: VfsConfig = {
  id: 'vfs-portugal-india',
  name: 'VFS Portugal (India)',
  countryCode: 'PRT',
  destinationCountry: 'Portugal',
  sourceCountry: 'India',
  sourceCountryCode: 'IND',
  baseUrl: 'https://visa.vfsglobal.com/ind/en/prt',
  appointmentUrl: 'https://visa.vfsglobal.com/ind/en/prt/book-an-appointment',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  centers: [
    { id: 'del', name: 'New Delhi', city: 'New Delhi', code: 'INDELI' },
    { id: 'mum', name: 'Mumbai', city: 'Mumbai', code: 'INMUMB' },
    { id: 'chn', name: 'Chennai', city: 'Chennai', code: 'INCHEN' },
    { id: 'blr', name: 'Bangalore', city: 'Bangalore', code: 'INBANG' },
    { id: 'hyd', name: 'Hyderabad', city: 'Hyderabad', code: 'INHYDE' },
    { id: 'kol', name: 'Kolkata', city: 'Kolkata', code: 'INKOLK' },
  ],
  visaCategories: [
    {
      id: 'tourist',
      name: 'Tourist Visa (Schengen)',
      code: 'schengen_tourism',
      procedures: [Procedure.SCHENGEN_TOURIST_PORTUGAL],
    },
    {
      id: 'business',
      name: 'Business Visa (Schengen)',
      code: 'schengen_business',
      procedures: [Procedure.SCHENGEN_BUSINESS_PORTUGAL],
    },
    {
      id: 'student',
      name: 'Student Visa (National D)',
      code: 'national_study',
      procedures: [Procedure.STUDENT_VISA_PORTUGAL],
    },
    {
      id: 'work',
      name: 'Work Visa / Golden Visa',
      code: 'national_work',
      procedures: [Procedure.WORK_VISA_PORTUGAL],
    },
    {
      id: 'job_seeker',
      name: 'Job Seeker Visa (D)',
      code: 'job_seeker',
      procedures: [Procedure.JOB_SEEKER_VISA_PORTUGAL],
    },
  ],
};

// Registry of all VFS configurations
export const VFS_CONFIGS: Record<string, VfsConfig> = {
  'vfs-italy-india': VFS_ITALY_INDIA,
  'vfs-germany-india': VFS_GERMANY_INDIA,
  'vfs-france-india': VFS_FRANCE_INDIA,
  'vfs-switzerland-india': VFS_SWITZERLAND_INDIA,
  'vfs-austria-india': VFS_AUSTRIA_INDIA,
  'vfs-belgium-india': VFS_BELGIUM_INDIA,
  'vfs-netherlands-india': VFS_NETHERLANDS_INDIA,
  'vfs-portugal-india': VFS_PORTUGAL_INDIA,
};

// Helper functions
export function getVfsConfig(id: string): VfsConfig | undefined {
  return VFS_CONFIGS[id];
}

export function getAllVfsConfigs(): VfsConfig[] {
  return Object.values(VFS_CONFIGS);
}

export function getVfsConfigByCountry(countryCode: string): VfsConfig | undefined {
  return Object.values(VFS_CONFIGS).find(c => c.countryCode === countryCode);
}

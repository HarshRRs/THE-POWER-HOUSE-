'use client';

interface CountryCodePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COUNTRIES = [
  { code: '+33', name: 'France', flag: 'FR' },
  { code: '+91', name: 'India', flag: 'IN' },
  { code: '+44', name: 'UK', flag: 'GB' },
  { code: '+1', name: 'USA/Canada', flag: 'US' },
  { code: '+49', name: 'Germany', flag: 'DE' },
  { code: '+39', name: 'Italy', flag: 'IT' },
  { code: '+34', name: 'Spain', flag: 'ES' },
  { code: '+351', name: 'Portugal', flag: 'PT' },
  { code: '+32', name: 'Belgium', flag: 'BE' },
  { code: '+31', name: 'Netherlands', flag: 'NL' },
  { code: '+41', name: 'Switzerland', flag: 'CH' },
  { code: '+212', name: 'Morocco', flag: 'MA' },
  { code: '+213', name: 'Algeria', flag: 'DZ' },
  { code: '+216', name: 'Tunisia', flag: 'TN' },
  { code: '+221', name: 'Senegal', flag: 'SN' },
  { code: '+225', name: 'Ivory Coast', flag: 'CI' },
  { code: '+237', name: 'Cameroon', flag: 'CM' },
  { code: '+234', name: 'Nigeria', flag: 'NG' },
  { code: '+92', name: 'Pakistan', flag: 'PK' },
  { code: '+880', name: 'Bangladesh', flag: 'BD' },
  { code: '+86', name: 'China', flag: 'CN' },
  { code: '+81', name: 'Japan', flag: 'JP' },
  { code: '+90', name: 'Turkey', flag: 'TR' },
  { code: '+55', name: 'Brazil', flag: 'BR' },
  { code: '+20', name: 'Egypt', flag: 'EG' },
];

export default function CountryCodePicker({ value, onChange }: CountryCodePickerProps) {
  // Split value into country code and number
  const match = value.match(/^(\+\d+)(.*)$/);
  const countryCode = match?.[1] || '+33';
  const phoneNumber = match?.[2] || '';

  const handleCodeChange = (newCode: string) => {
    onChange(newCode + phoneNumber);
  };

  const handleNumberChange = (newNumber: string) => {
    onChange(countryCode + newNumber.replace(/\D/g, ''));
  };

  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        className="w-28 px-2 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.flag}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder="612345678"
        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      />
    </div>
  );
}

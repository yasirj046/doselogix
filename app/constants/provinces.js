const PROVINCES = [
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Sindh', value: 'Sindh' },
  { label: 'Khyber Pakhtunkhwa', value: 'Khyber Pakhtunkhwa' },
  { label: 'Balochistan', value: 'Balochistan' },
  { label: 'Islamabad Capital Territory', value: 'Islamabad Capital Territory' },
  { label: 'Gilgit-Baltistan', value: 'Gilgit-Baltistan' },
  { label: 'Azad Jammu and Kashmir', value: 'Azad Jammu and Kashmir' }
];

const PROVINCE_ENUM = PROVINCES.map(province => province.value);

module.exports = {
  PROVINCES,
  PROVINCE_ENUM
};
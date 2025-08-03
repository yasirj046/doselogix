const PROVINCES = {
  PUNJAB: { code: '01', name: 'Punjab' },
  SINDH: { code: '02', name: 'Sindh' },
  KPK: { code: '03', name: 'Khyber Pakhtunkhwa' },
  BALOCHISTAN: { code: '04', name: 'Balochistan' },
  ICT: { code: '05', name: 'Islamabad Capital Territory' },
  GILGIT_BALTISTAN: { code: '06', name: 'Gilgit-Baltistan' },
  AJK: { code: '07', name: 'Azad Jammu and Kashmir' }
};

const PROVINCE_ENUM = Object.values(PROVINCES).map(province => province.name);

module.exports = {
  PROVINCES,
  PROVINCE_ENUM
};
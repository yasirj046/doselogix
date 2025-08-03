const CITIES = {
  // Punjab Cities
  'Punjab': {
    'Lahore': { code: '11', name: 'Lahore' },
    'Faisalabad': { code: '13', name: 'Faisalabad' },
    'Rawalpindi': { code: '14', name: 'Rawalpindi' },
    'Gujranwala': { code: '15', name: 'Gujranwala' },
    'Multan': { code: '16', name: 'Multan' },
    'Sialkot': { code: '17', name: 'Sialkot' },
    'Bahawalpur': { code: '18', name: 'Bahawalpur' },
    'Sargodha': { code: '19', name: 'Sargodha' },
    'Sheikhupura': { code: '20', name: 'Sheikhupura' }
  },
  
  // Sindh Cities
  'Sindh': {
    'Karachi': { code: '21', name: 'Karachi' },
    'Hyderabad': { code: '22', name: 'Hyderabad' },
    'Sukkur': { code: '23', name: 'Sukkur' },
    'Larkana': { code: '24', name: 'Larkana' },
    'Nawabshah': { code: '25', name: 'Nawabshah' },
    'Mirpurkhas': { code: '26', name: 'Mirpurkhas' },
    'Jacobabad': { code: '27', name: 'Jacobabad' },
    'Shikarpur': { code: '28', name: 'Shikarpur' },
    'Khairpur': { code: '29', name: 'Khairpur' },
    'Dadu': { code: '30', name: 'Dadu' }
  },
  
  // Khyber Pakhtunkhwa Cities
  'Khyber Pakhtunkhwa': {
    'Peshawar': { code: '31', name: 'Peshawar' },
    'Mardan': { code: '32', name: 'Mardan' },
    'Mingora': { code: '33', name: 'Mingora' },
    'Kohat': { code: '34', name: 'Kohat' },
    'Dera Ismail Khan': { code: '35', name: 'Dera Ismail Khan' },
    'Bannu': { code: '36', name: 'Bannu' },
    'Abbottabad': { code: '37', name: 'Abbottabad' },
    'Swat': { code: '38', name: 'Swat' },
    'Chitral': { code: '39', name: 'Chitral' },
    'Karak': { code: '40', name: 'Karak' }
  },
  
  // Balochistan Cities
  'Balochistan': {
    'Quetta': { code: '41', name: 'Quetta' },
    'Gwadar': { code: '42', name: 'Gwadar' },
    'Turbat': { code: '43', name: 'Turbat' },
    'Khuzdar': { code: '44', name: 'Khuzdar' },
    'Chaman': { code: '45', name: 'Chaman' },
    'Hub': { code: '46', name: 'Hub' },
    'Sibi': { code: '47', name: 'Sibi' },
    'Zhob': { code: '48', name: 'Zhob' },
    'Kalat': { code: '49', name: 'Kalat' },
    'Mastung': { code: '50', name: 'Mastung' }
  },
  
  // Islamabad Capital Territory
  'Islamabad Capital Territory': {
    'Islamabad': { code: '51', name: 'Islamabad' }
  },
  
  // Gilgit-Baltistan Cities
  'Gilgit-Baltistan': {
    'Gilgit': { code: '61', name: 'Gilgit' },
    'Skardu': { code: '62', name: 'Skardu' },
    'Hunza': { code: '63', name: 'Hunza' },
    'Ghanche': { code: '64', name: 'Ghanche' },
    'Shigar': { code: '65', name: 'Shigar' },
    'Nagar': { code: '66', name: 'Nagar' },
    'Ghizer': { code: '67', name: 'Ghizer' }
  },
  
  // Azad Jammu and Kashmir Cities
  'Azad Jammu and Kashmir': {
    'Muzaffarabad': { code: '71', name: 'Muzaffarabad' },
    'Mirpur': { code: '72', name: 'Mirpur' },
    'Rawalakot': { code: '73', name: 'Rawalakot' },
    'Kotli': { code: '74', name: 'Kotli' },
    'Bhimber': { code: '75', name: 'Bhimber' },
    'Bagh': { code: '76', name: 'Bagh' },
    'Neelum': { code: '77', name: 'Neelum' }
  }
};

// Generate city enums for each province
const getCitiesByProvince = (provinceName) => {
  return CITIES[provinceName] ? Object.values(CITIES[provinceName]).map(city => city.name) : [];
};

// Get all cities as a flat array
const ALL_CITIES = Object.values(CITIES).reduce((acc, provinceCities) => {
  return acc.concat(Object.values(provinceCities).map(city => city.name));
}, []);

module.exports = {
  CITIES,
  getCitiesByProvince,
  ALL_CITIES
};

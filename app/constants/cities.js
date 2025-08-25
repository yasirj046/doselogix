const CITIES = [
  // Punjab Cities
  { label: 'Lahore', value: 'Lahore', province: 'Punjab' },
  { label: 'Faisalabad', value: 'Faisalabad', province: 'Punjab' },
  { label: 'Rawalpindi', value: 'Rawalpindi', province: 'Punjab' },
  { label: 'Gujranwala', value: 'Gujranwala', province: 'Punjab' },
  { label: 'Multan', value: 'Multan', province: 'Punjab' },
  { label: 'Sialkot', value: 'Sialkot', province: 'Punjab' },
  { label: 'Bahawalpur', value: 'Bahawalpur', province: 'Punjab' },
  { label: 'Sargodha', value: 'Sargodha', province: 'Punjab' },
  { label: 'Sheikhupura', value: 'Sheikhupura', province: 'Punjab' },
  
  // Sindh Cities
  { label: 'Karachi', value: 'Karachi', province: 'Sindh' },
  { label: 'Hyderabad', value: 'Hyderabad', province: 'Sindh' },
  { label: 'Sukkur', value: 'Sukkur', province: 'Sindh' },
  { label: 'Larkana', value: 'Larkana', province: 'Sindh' },
  { label: 'Nawabshah', value: 'Nawabshah', province: 'Sindh' },
  { label: 'Mirpurkhas', value: 'Mirpurkhas', province: 'Sindh' },
  { label: 'Jacobabad', value: 'Jacobabad', province: 'Sindh' },
  { label: 'Shikarpur', value: 'Shikarpur', province: 'Sindh' },
  { label: 'Khairpur', value: 'Khairpur', province: 'Sindh' },
  { label: 'Dadu', value: 'Dadu', province: 'Sindh' },
  
  // Khyber Pakhtunkhwa Cities
  { label: 'Peshawar', value: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { label: 'Mardan', value: 'Mardan', province: 'Khyber Pakhtunkhwa' },
  { label: 'Mingora', value: 'Mingora', province: 'Khyber Pakhtunkhwa' },
  { label: 'Kohat', value: 'Kohat', province: 'Khyber Pakhtunkhwa' },
  { label: 'Dera Ismail Khan', value: 'Dera Ismail Khan', province: 'Khyber Pakhtunkhwa' },
  { label: 'Bannu', value: 'Bannu', province: 'Khyber Pakhtunkhwa' },
  { label: 'Abbottabad', value: 'Abbottabad', province: 'Khyber Pakhtunkhwa' },
  { label: 'Swat', value: 'Swat', province: 'Khyber Pakhtunkhwa' },
  { label: 'Chitral', value: 'Chitral', province: 'Khyber Pakhtunkhwa' },
  { label: 'Karak', value: 'Karak', province: 'Khyber Pakhtunkhwa' },
  
  // Balochistan Cities
  { label: 'Quetta', value: 'Quetta', province: 'Balochistan' },
  { label: 'Gwadar', value: 'Gwadar', province: 'Balochistan' },
  { label: 'Turbat', value: 'Turbat', province: 'Balochistan' },
  { label: 'Khuzdar', value: 'Khuzdar', province: 'Balochistan' },
  { label: 'Chaman', value: 'Chaman', province: 'Balochistan' },
  { label: 'Hub', value: 'Hub', province: 'Balochistan' },
  { label: 'Sibi', value: 'Sibi', province: 'Balochistan' },
  { label: 'Zhob', value: 'Zhob', province: 'Balochistan' },
  { label: 'Kalat', value: 'Kalat', province: 'Balochistan' },
  { label: 'Mastung', value: 'Mastung', province: 'Balochistan' },
  
  // Islamabad Capital Territory
  { label: 'Islamabad', value: 'Islamabad', province: 'Islamabad Capital Territory' },
  
  // Gilgit-Baltistan Cities
  { label: 'Gilgit', value: 'Gilgit', province: 'Gilgit-Baltistan' },
  { label: 'Skardu', value: 'Skardu', province: 'Gilgit-Baltistan' },
  { label: 'Hunza', value: 'Hunza', province: 'Gilgit-Baltistan' },
  { label: 'Ghanche', value: 'Ghanche', province: 'Gilgit-Baltistan' },
  { label: 'Shigar', value: 'Shigar', province: 'Gilgit-Baltistan' },
  { label: 'Nagar', value: 'Nagar', province: 'Gilgit-Baltistan' },
  { label: 'Ghizer', value: 'Ghizer', province: 'Gilgit-Baltistan' },
  
  // Azad Jammu and Kashmir Cities
  { label: 'Muzaffarabad', value: 'Muzaffarabad', province: 'Azad Jammu and Kashmir' },
  { label: 'Mirpur', value: 'Mirpur', province: 'Azad Jammu and Kashmir' },
  { label: 'Rawalakot', value: 'Rawalakot', province: 'Azad Jammu and Kashmir' },
  { label: 'Kotli', value: 'Kotli', province: 'Azad Jammu and Kashmir' },
  { label: 'Bhimber', value: 'Bhimber', province: 'Azad Jammu and Kashmir' },
  { label: 'Bagh', value: 'Bagh', province: 'Azad Jammu and Kashmir' },
  { label: 'Neelum', value: 'Neelum', province: 'Azad Jammu and Kashmir' }
];

// Generate city enums for each province
const getCitiesByProvince = (provinceName) => {
  return CITIES.filter(city => city.province === provinceName).map(city => city.value);
};

// Get all cities as a flat array
const ALL_CITIES = CITIES.map(city => city.value);

module.exports = {
  CITIES,
  getCitiesByProvince,
  ALL_CITIES
};

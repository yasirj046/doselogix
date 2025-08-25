const CUSTOMER_CATEGORIES = [
  { label: 'Retailer', value: 'Retailer' },
  { label: 'Hospital', value: 'Hospital' },
  { label: 'Pharmacy', value: 'Pharmacy' },
  { label: 'Wholesaler', value: 'Wholesaler' }
];

const CUSTOMER_CATEGORY_ENUM = CUSTOMER_CATEGORIES.map(category => category.value);

module.exports = {
  CUSTOMER_CATEGORIES,
  CUSTOMER_CATEGORY_ENUM
};

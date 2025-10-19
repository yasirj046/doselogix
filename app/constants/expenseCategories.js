const EXPENSE_CATEGORIES = [
  { label: 'Supplies', value: 'Supplies' },
  { label: 'Utilities', value: 'Utilities' },
  { label: 'Fuel', value: 'Fuel' },
  { label: 'Food', value: 'Food' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'Maintenance', value: 'Maintenance' },
  { label: 'Communication', value: 'Communication' },
  { label: 'Rent', value: 'Rent' },
  { label: 'Miscellaneous', value: 'Miscellaneous' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Water', value: 'Water' },
  { label: 'Internet', value: 'Internet' },
];

const EXPENSE_CATEGORY_ENUM = EXPENSE_CATEGORIES.map(category => category.value);

module.exports = {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_ENUM
};
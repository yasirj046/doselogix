const DESIGNATIONS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALESMAN: 'Salesman',
  WORKER: 'Worker',
  DRIVER: 'Driver',
  DELIVERY_BOY: 'Delivery Boy',
  SUPERVISOR: 'Supervisor',
  TECHNICIAN: 'Technician',
  SECURITY_GUARD: 'Security Guard',
  CLEANER: 'Cleaner',
  HELPER: 'Helper'
};

const DESIGNATION_ENUM = Object.values(DESIGNATIONS);

module.exports = {
  DESIGNATIONS,
  DESIGNATION_ENUM
};

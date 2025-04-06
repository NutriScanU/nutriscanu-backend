// utils/capitalize.js ✅ versión ES Module compatible
const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default capitalize;

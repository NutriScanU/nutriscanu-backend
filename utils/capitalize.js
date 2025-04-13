// utils/capitalize.js ✅ versión ES Module compatible
export default function capitalize(str = '') {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

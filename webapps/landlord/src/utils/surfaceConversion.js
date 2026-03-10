/**
 * Surface Area Conversion Utilities
 *
 * The database stores surface area in SQUARE METERS (sq m).
 * The UI should display and accept input in both SQUARE FEET (sq ft) and SQUARE METERS (sq m).
 *
 * Conversion factor: 1 sq m = 10.7639 sq ft
 */

export const SQFT_PER_SQM = 10.7639;
export const SQM_PER_SQFT = 1 / SQFT_PER_SQM;

/**
 * Convert square feet to square meters
 * @param {number} sqft - Surface area in square feet
 * @returns {number} Surface area in square meters
 */
export function sqftToSqm(sqft) {
  const value = Number(sqft);
  if (!Number.isFinite(value)) return 0;
  return value * SQM_PER_SQFT;
}

/**
 * Convert square meters to square feet
 * @param {number} sqm - Surface area in square meters
 * @returns {number} Surface area in square feet
 */
export function sqmToSqft(sqm) {
  const value = Number(sqm);
  if (!Number.isFinite(value)) return 0;
  return value * SQFT_PER_SQM;
}

/**
 * Format surface area for display
 * @param {number} sqm - Surface area in square meters (from database)
 * @param {object} options - Display options
 * @param {boolean} options.showBothUnits - Whether to show both sq ft and sq m
 * @param {number} options.decimals - Number of decimal places
 * @returns {string} Formatted surface area string
 */
export function formatSurface(sqm, options = {}) {
  const { showBothUnits = true, decimals = 2 } = options;

  const sqmValue = Number(sqm);
  if (!Number.isFinite(sqmValue) || sqmValue === 0) {
    return '-';
  }

  const sqft = sqmToSqft(sqmValue);

  if (showBothUnits) {
    return `${sqft.toFixed(decimals)} sq ft (${sqmValue.toFixed(decimals)} sq m)`;
  }

  return `${sqft.toFixed(decimals)} sq ft`;
}

/**
 * Get the surface area of a property in square meters
 * For parent properties with children, returns the sum of children's surface areas
 * @param {object} property - The property object
 * @param {array} allProperties - Array of all properties
 * @returns {number} Surface area in square meters
 */
export function getPropertySurfaceSqm(property, allProperties = []) {
  if (!property) {
    return 0;
  }

  const getParentPropertyIdValue = (parentPropertyId) => {
    if (!parentPropertyId) return null;
    if (typeof parentPropertyId === 'object') {
      return parentPropertyId._id || null;
    }
    return parentPropertyId;
  };

  const children = (allProperties || []).filter(
    (item) =>
      String(getParentPropertyIdValue(item?.parentPropertyId) || '') ===
      String(property._id || '')
  );

  const childrenSurface = children.reduce(
    (sum, child) => sum + (Number(child?.surface) || 0),
    0
  );

  if (childrenSurface > 0) {
    return childrenSurface;
  }

  return Number(property?.surface) || 0;
}

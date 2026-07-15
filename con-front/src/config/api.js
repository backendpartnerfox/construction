// API Configuration for Vendor Management
// File: src/config/api.js

export const API_BASE_URL = 'http://localhost:9000/api';

export const VENDOR_ENDPOINTS = {
  // Vendor Types
  VENDOR_TYPES: `${API_BASE_URL}/vendor_type`,
  VENDOR_TYPE_BY_ID: (id) => `${API_BASE_URL}/vendor_type/${id}`,
  
  // Vendors
  VENDORS: `${API_BASE_URL}/vendors`,
  VENDOR_BY_ID: (id) => `${API_BASE_URL}/vendors/${id}`,
  VENDORS_BY_TYPE: (typeId) => `${API_BASE_URL}/vendors/type/${typeId}`,
  
  // Vendor Pricing
  VENDOR_PRICING: `${API_BASE_URL}/vendor_pricing`,
  VENDOR_PRICING_BY_ID: (id) => `${API_BASE_URL}/vendor_pricing/${id}`,
  VENDOR_PRICING_BY_VENDOR: (vendorId) => `${API_BASE_URL}/vendor_pricing/vendor/${vendorId}`,
  VENDOR_PRICING_BY_ITEM: (itemId) => `${API_BASE_URL}/vendor_pricing/item/${itemId}`,
  BEST_PRICE: (itemId, choiceId) => `${API_BASE_URL}/vendor_pricing/best-price/${itemId}/${choiceId}`,
  COMPARE_PRICES: (itemId, choiceId) => `${API_BASE_URL}/vendor_pricing/compare/${itemId}/${choiceId}`,
  BULK_UPDATE: (vendorId) => `${API_BASE_URL}/vendor_pricing/bulk-update/${vendorId}`,
  
  // Items (for dropdown population)
  ITEMS: `${API_BASE_URL}/items`,
  ITEM_CHOICES_BY_ITEM: (itemId) => `${API_BASE_URL}/item_choices/${itemId}`
};

export default VENDOR_ENDPOINTS;

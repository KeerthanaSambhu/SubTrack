import {
  Clapperboard,
  Music2,
  Briefcase,
  Cloud,
  GraduationCap,
  HeartPulse,
  Newspaper,
  Shapes,
} from 'lucide-react';

/*
 * Categories — each one owns a fixed colour so a category always looks
 * the same in every list and chart. The seven hues were validated for
 * colour-blind separation and contrast against the dark card surface.
 * "Other" is intentionally neutral grey.
 *
 * Keep these keys in sync with server/src/utils/constants.js.
 */
export const CATEGORIES = [
  { value: 'entertainment', label: 'Entertainment', color: '#8f7fdc', icon: Clapperboard },
  { value: 'productivity', label: 'Productivity & Software', color: '#84a12f', icon: Briefcase },
  { value: 'cloud', label: 'Cloud & Storage', color: '#4c8bd0', icon: Cloud },
  { value: 'music', label: 'Music & Audio', color: '#d06e4c', icon: Music2 },
  { value: 'health', label: 'Health & Fitness', color: '#0fa08c', icon: HeartPulse },
  { value: 'education', label: 'Education', color: '#b0891c', icon: GraduationCap },
  { value: 'news', label: 'News & Reading', color: '#c45f8e', icon: Newspaper },
  { value: 'other', label: 'Other', color: '#6f6d77', icon: Shapes },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));
export const getCategory = (value) => CATEGORY_MAP[value] || CATEGORY_MAP.other;

export const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly', perYear: 52, short: 'wk', noun: 'week' },
  { value: 'monthly', label: 'Monthly', perYear: 12, short: 'mo', noun: 'month' },
  { value: 'quarterly', label: 'Quarterly', perYear: 4, short: 'qtr', noun: 'quarter' },
  { value: 'yearly', label: 'Yearly', perYear: 1, short: 'yr', noun: 'year' },
];

const CYCLE_MAP = Object.fromEntries(BILLING_CYCLES.map((c) => [c.value, c]));
export const getCycle = (value) => CYCLE_MAP[value] || CYCLE_MAP.monthly;

export const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { value: 'AED', label: 'UAE Dirham', symbol: 'AED' },
];

export const DUE_SOON_DAYS = 3;

/**
 * Automated Verification Script for FreshLine Insights Feature
 * Run with: node --experimental-strip-types src/features/insights/verify.js
 */

import {
  calculateMonthlyAnalytics,
  filterRecordsByMonth,
  roundWasteRate,
  parseRecordDate,
} from './services/analytics.service.ts';

import {
  mapDbRowToWasteRecord,
} from './services/mapper.ts';

let passedCount = 0;
let failedCount = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passedCount += 1;
  } else {
    console.error(`  [FAIL] ${description}`);
    failedCount += 1;
  }
}

console.log('====================================================');
console.log('FreshLine Insights Verification (Mock Stage)');
console.log('====================================================');

// ----------------------------------------------------
// Check 1: analytics.service.ts calculations
// ----------------------------------------------------
console.log('\n1. Checking analytics calculations:');

const recordsSample = [
  // 10 Consumed records under "Dairy" (proves Consumed NEVER affects most wasted category)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `c-${i}`,
    userId: 'u-1',
    foodItemId: `f-c-${i}`,
    foodName: `Dairy Item ${i}`,
    category: 'Dairy',
    outcome: 'Consumed',
    quantity: 1,
    unit: 'carton',
    recordedAt: '2026-11-15T10:00:00',
  })),
  // 2 Wasted records in "Produce"
  { id: 'w-1', userId: 'u-1', foodItemId: 'f-1', foodName: 'Bananas', category: 'Produce', outcome: 'Wasted', quantity: 3, unit: 'pcs', recordedAt: '2026-11-15T10:00:00' },
  { id: 'w-2', userId: 'u-1', foodItemId: 'f-2', foodName: 'Lettuce', category: 'Produce', outcome: 'Wasted', quantity: 1, unit: 'head', recordedAt: '2026-11-15T10:00:00' },
  // 1 Wasted record in "Bakery"
  { id: 'w-3', userId: 'u-1', foodItemId: 'f-3', foodName: 'Bread', category: 'Bakery', outcome: 'Wasted', quantity: 1, unit: 'loaf', recordedAt: '2026-11-15T10:00:00' },
];

const result = calculateMonthlyAnalytics(recordsSample);

assert(result.consumedCount === 10, 'consumedCount === 10');
assert(result.wastedCount === 3, 'wastedCount === 3');
assert(result.totalCount === 13, 'totalCount === 13');
assert(
  Math.abs(result.wasteRate - (3 / 13) * 100) < 0.000001,
  `wasteRate raw evaluates to 23.076923... (actual: ${result.wasteRate})`
);
assert(
  roundWasteRate(result.wasteRate) === 23.1,
  'roundWasteRate(wasteRate) gives 23.1%'
);
assert(
  result.mostWastedCategory === 'Produce',
  'mostWastedCategory is Produce (2 Wasted Produce vs 1 Wasted Bakery; 10 Consumed Dairy did not affect it)'
);

// 0 records edge case
const zeroResult = calculateMonthlyAnalytics([]);
assert(zeroResult.totalCount === 0, 'Zero records totalCount === 0');
assert(zeroResult.wasteRate === 0, 'Zero records wasteRate === 0');
assert(!Number.isNaN(zeroResult.wasteRate), 'Zero records wasteRate is NEVER NaN');
assert(roundWasteRate(zeroResult.wasteRate) === 0, 'Zero records rounded wasteRate === 0');
assert(zeroResult.mostWastedCategory === null, 'Zero records mostWastedCategory === null');

// ----------------------------------------------------
// Check 2: Local time month filter
// ----------------------------------------------------
console.log('\n2. Checking month filter on recordedAt using LOCAL time:');

const targetMonth = new Date(2026, 10, 15); // November 2026 in local time

// Construct local time boundaries
const novStart = new Date(2026, 10, 1, 0, 1, 0); // Nov 1 00:01 local
const novEnd = new Date(2026, 10, 30, 23, 59, 0); // Nov 30 23:59 local
const octEnd = new Date(2026, 9, 31, 23, 59, 59); // Oct 31 23:59 local
const decStart = new Date(2026, 11, 1, 0, 1, 0); // Dec 1 00:01 local

const boundaryRecords = [
  { id: 'rec-nov-start', recordedAt: novStart.toISOString(), outcome: 'Consumed', category: 'Dairy' },
  { id: 'rec-nov-end', recordedAt: novEnd.toISOString(), outcome: 'Consumed', category: 'Dairy' },
  { id: 'rec-oct-end', recordedAt: octEnd.toISOString(), outcome: 'Consumed', category: 'Dairy' },
  { id: 'rec-dec-start', recordedAt: decStart.toISOString(), outcome: 'Consumed', category: 'Dairy' },
  { id: 'rec-date-only', recordedAt: '2026-11-01', outcome: 'Consumed', category: 'Dairy' },
];

const filtered = filterRecordsByMonth(boundaryRecords, targetMonth);
const filteredIds = filtered.map((r) => r.id);

assert(filteredIds.includes('rec-nov-start'), 'Start of month (Nov 1 00:01 local) is included in November');
assert(filteredIds.includes('rec-nov-end'), 'End of month (Nov 30 23:59 local) is included in November');
assert(!filteredIds.includes('rec-oct-end'), 'Oct 31 23:59 local is EXCLUDED from November');
assert(!filteredIds.includes('rec-dec-start'), 'Dec 1 00:01 local is EXCLUDED from November');
assert(filteredIds.includes('rec-date-only'), 'Date-only (2026-11-01) is parsed at local midnight and included');

// ----------------------------------------------------
// Check 3: waste.service.ts mapping and contract
// ----------------------------------------------------
console.log('\n3. Checking database column mapping (snake_case -> camelCase):');

const mockDbRow = {
  id: 'uuid-001',
  user_id: 'user-auth-002',
  food_item_id: 'food-003',
  food_name: 'Greek Yogurt',
  category: 'Dairy',
  outcome: 'Consumed',
  quantity: '4',
  unit: 'tubs',
  recorded_at: '2026-11-15T09:00:00Z',
};

const mappedRecord = mapDbRowToWasteRecord(mockDbRow);

assert(mappedRecord.id === 'uuid-001', 'id is preserved');
assert(mappedRecord.userId === 'user-auth-002', 'user_id -> userId');
assert(mappedRecord.foodItemId === 'food-003', 'food_item_id -> foodItemId');
assert(mappedRecord.foodName === 'Greek Yogurt', 'food_name -> foodName');
assert(mappedRecord.category === 'Dairy', 'category is preserved');
assert(mappedRecord.outcome === 'Consumed', 'outcome is preserved');
assert(mappedRecord.quantity === 4 && typeof mappedRecord.quantity === 'number', 'quantity is numeric');
assert(mappedRecord.unit === 'tubs', 'unit is preserved');
assert(mappedRecord.recordedAt === '2026-11-15T09:00:00Z', 'recorded_at -> recordedAt');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('====================================================');
console.log(`Verification Complete: ${passedCount} passed, ${failedCount} failed.`);
console.log('====================================================');

if (failedCount > 0) {
  process.exit(1);
}

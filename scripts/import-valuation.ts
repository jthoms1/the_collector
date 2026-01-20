/**
 * Import valuation data from collection_valuation.json into the database
 *
 * Run with: npx tsx scripts/import-valuation.ts
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ValuationItem {
  id: number;
  item_description: string;
  estimated_value_low: number;
  estimated_value_mid: number;
  estimated_value_high: number;
  trend: string;
  confidence: string;
}

interface ValuationData {
  valuation_date: string;
  currency: string;
  total_items: number;
  cards: ValuationItem[];
  comics: ValuationItem[];
}

const dbPath = join(process.cwd(), 'collection.db');
const valuationPath = join(process.cwd(), 'collection_valuation.json');

console.log('Opening database:', dbPath);
const db = new Database(dbPath);

console.log('Reading valuation data:', valuationPath);
const valuationData: ValuationData = JSON.parse(readFileSync(valuationPath, 'utf-8'));

const updateStmt = db.prepare(`
  UPDATE items
  SET
    estimated_value = ?,
    estimated_value_low = ?,
    estimated_value_high = ?,
    value_trend = ?,
    value_confidence = ?,
    value_updated_at = ?
  WHERE id = ?
`);

const now = new Date().toISOString();

// Combine cards and comics
const allItems = [...valuationData.cards, ...valuationData.comics];

console.log(`\nImporting ${allItems.length} valuations...`);

let updated = 0;
let notFound = 0;

db.transaction(() => {
  for (const item of allItems) {
    const result = updateStmt.run(
      item.estimated_value_mid,
      item.estimated_value_low,
      item.estimated_value_high,
      item.trend,
      item.confidence,
      now,
      item.id
    );

    if (result.changes > 0) {
      updated++;
    } else {
      console.warn(`  Item ID ${item.id} not found in database`);
      notFound++;
    }
  }
})();

console.log(`\nImport complete!`);
console.log(`  Updated: ${updated} items`);
console.log(`  Not found: ${notFound} items`);
console.log(`  Valuation date: ${valuationData.valuation_date}`);

db.close();

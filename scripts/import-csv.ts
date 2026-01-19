import { createItem, getDb } from '../src/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

interface CardRow {
  Player: string;
  Year: string;
  Brand: string;
  Set: string;
  'Card Number': string;
  Sport: string;
  Team: string;
  Condition: string;
  'Graded By': string;
  Grade: string;
  'Purchase Price': string;
  'Current Value': string;
  'Image Path': string;
  Notes: string;
}

interface ComicRow {
  Title: string;
  'Issue Number': string;
  Volume: string;
  Publisher: string;
  'Cover Date': string;
  Writer: string;
  Artist: string;
  'Cover Artist': string;
  Variant: string;
  Condition: string;
  'Graded By': string;
  Grade: string;
  'Key Issue': string;
  'Purchase Price': string;
  'Current Value': string;
  'Image Path': string;
  Notes: string;
}

function parseCSV<T>(content: string): T[] {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => v === '')) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row as T);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function mapCondition(condition: string): string | null {
  if (!condition) return null;

  const conditionMap: Record<string, string> = {
    'mint': 'Mint',
    'near mint': 'Near Mint (NM)',
    'nm': 'Near Mint (NM)',
    'very fine': 'Very Fine (VF)',
    'vf': 'Very Fine (VF)',
    'fine': 'Fine (F)',
    'f': 'Fine (F)',
    'very good': 'Very Good (VG)',
    'vg': 'Very Good (VG)',
    'good': 'Good (G)',
    'g': 'Good (G)',
    'fair': 'Fair',
    'poor': 'Poor',
  };

  const lower = condition.toLowerCase();
  return conditionMap[lower] || condition;
}

function parseYear(yearStr: string): number | null {
  if (!yearStr) return null;
  const year = parseInt(yearStr, 10);
  return isNaN(year) ? null : year;
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  const price = parseFloat(priceStr.replace(/[$,]/g, ''));
  return isNaN(price) ? null : price;
}

function parseGrade(gradeStr: string): number | null {
  if (!gradeStr) return null;
  const grade = parseFloat(gradeStr);
  return isNaN(grade) ? null : grade;
}

function extractYearFromDate(dateStr: string): number | null {
  if (!dateStr) return null;
  // Try to extract year from formats like "October 1987" or "1987"
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

function importCards(filePath: string, userId: number, collectionTypeId: number): number {
  const content = readFileSync(filePath, 'utf-8');
  const rows = parseCSV<CardRow>(content);
  let imported = 0;

  for (const row of rows) {
    // Build name: use Player if available, otherwise use Brand + Set
    let name = row.Player?.trim();
    if (!name) {
      name = [row.Brand, row.Set].filter(Boolean).join(' - ');
    }
    if (!name) {
      name = 'Unknown Card';
    }

    // Build notes: include sport, team, and original notes
    const notesParts: string[] = [];
    if (row.Sport && row.Sport !== 'Baseball') {
      notesParts.push(`Sport: ${row.Sport}`);
    }
    if (row.Team) {
      notesParts.push(`Team: ${row.Team}`);
    }
    if (row.Notes) {
      notesParts.push(row.Notes);
    }

    try {
      createItem({
        collection_type_id: collectionTypeId,
        user_id: userId,
        name,
        year: parseYear(row.Year),
        publisher: row.Brand || null,
        series: row.Set || null,
        issue_number: row['Card Number'] || null,
        variant: null,
        condition_grade: mapCondition(row.Condition),
        professional_grade: parseGrade(row.Grade),
        grading_company: row['Graded By'] || null,
        purchase_price: parsePrice(row['Purchase Price']),
        estimated_value: parsePrice(row['Current Value']),
        image_path: row['Image Path'] || null,
        notes: notesParts.length > 0 ? notesParts.join('; ') : null,
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import card: ${name}`, error);
    }
  }

  return imported;
}

function importComics(filePath: string, userId: number, collectionTypeId: number): number {
  const content = readFileSync(filePath, 'utf-8');
  const rows = parseCSV<ComicRow>(content);
  let imported = 0;

  for (const row of rows) {
    const title = row.Title?.trim();
    if (!title) continue;

    // Build notes: include writer, artist, cover artist, key issue, volume, and original notes
    const notesParts: string[] = [];
    if (row.Writer) {
      notesParts.push(`Writer: ${row.Writer}`);
    }
    if (row.Artist) {
      notesParts.push(`Artist: ${row.Artist}`);
    }
    if (row['Cover Artist']) {
      notesParts.push(`Cover: ${row['Cover Artist']}`);
    }
    if (row.Volume && row.Volume !== '1') {
      notesParts.push(`Volume: ${row.Volume}`);
    }
    if (row['Key Issue']) {
      notesParts.push(`Key: ${row['Key Issue']}`);
    }
    if (row.Notes) {
      notesParts.push(row.Notes);
    }

    try {
      createItem({
        collection_type_id: collectionTypeId,
        user_id: userId,
        name: title,
        year: extractYearFromDate(row['Cover Date']),
        publisher: row.Publisher || null,
        series: title,
        issue_number: row['Issue Number'] || null,
        variant: row.Variant || null,
        condition_grade: mapCondition(row.Condition),
        professional_grade: parseGrade(row.Grade),
        grading_company: row['Graded By'] || null,
        purchase_price: parsePrice(row['Purchase Price']),
        estimated_value: parsePrice(row['Current Value']),
        image_path: row['Image Path'] || null,
        notes: notesParts.length > 0 ? notesParts.join('; ') : null,
      });
      imported++;
    } catch (error) {
      console.error(`Failed to import comic: ${title} #${row['Issue Number']}`, error);
    }
  }

  return imported;
}

// Main execution
console.log('Starting CSV import...\n');

// Initialize database
getDb();

// Get user IDs (Josh = 1, Ellie = 2 based on db.ts seed order)
const JOSH_USER_ID = 1;
const ELLIE_USER_ID = 2;

// Get collection type IDs (Cards = 1, Comics = 2 based on db.ts seed order)
const CARDS_TYPE_ID = 1;
const COMICS_TYPE_ID = 2;

const projectRoot = process.cwd();

// Import Cards.csv for Josh
console.log('Importing Cards.csv for Josh...');
const cardsPath = join(projectRoot, 'Cards.csv');
const cardsImported = importCards(cardsPath, JOSH_USER_ID, CARDS_TYPE_ID);
console.log(`  Imported ${cardsImported} cards\n`);

// Import Comics.csv for Josh
console.log('Importing Comics.csv for Josh...');
const comicsPath = join(projectRoot, 'Comics.csv');
const comicsImported = importComics(comicsPath, JOSH_USER_ID, COMICS_TYPE_ID);
console.log(`  Imported ${comicsImported} comics\n`);

// Import Ellie.csv for Ellie
console.log('Importing Ellie.csv for Ellie...');
const elliePath = join(projectRoot, 'Ellie.csv');
const ellieImported = importCards(elliePath, ELLIE_USER_ID, CARDS_TYPE_ID);
console.log(`  Imported ${ellieImported} cards\n`);

console.log('Import complete!');
console.log(`Total: ${cardsImported + comicsImported + ellieImported} items imported`);

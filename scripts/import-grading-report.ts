/**
 * Import grading report data into the database
 * Parses grading-report.md and updates card records with grading assessments
 * Run with: npx tsx scripts/import-grading-report.ts
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'collection.db');
const REPORT_PATH = path.join(process.cwd(), 'grading-report.md');
const db = new Database(DB_PATH);

// Map PSA grades to condition_grade values
function mapPsaToCondition(psaGrade: string): string {
  const match = psaGrade.match(/PSA\s*(\d+)/i);
  if (!match) return 'Good (G)';

  const grade = parseInt(match[1], 10);

  if (grade >= 9) return 'Mint';
  if (grade === 8) return 'Near Mint (NM)';
  if (grade === 7) return 'Very Fine (VF)';
  if (grade === 6) return 'Fine (F)';
  if (grade === 5) return 'Very Good (VG)';
  if (grade === 4) return 'Good (G)';
  if (grade === 3) return 'Fair';
  return 'Poor';
}

interface CardGradingData {
  cardId: number;
  playerName: string;
  centering: string;
  corners: string;
  edges: string;
  surface: string;
  gradeLimiters: string;
  estimatedGrade: string;
  notes: string;
}

function parseGradingReport(content: string): CardGradingData[] {
  const cards: CardGradingData[] = [];

  // Match each card section
  const cardRegex = /### Card #(\d+) - (.+?)(?=\n)/g;
  let match;

  while ((match = cardRegex.exec(content)) !== null) {
    const cardId = parseInt(match[1], 10);
    const playerName = match[2].trim();

    // Find the section for this card (from this match to next card header or section header)
    const startIdx = match.index;
    const nextCardMatch = content.slice(startIdx + match[0].length).match(/### Card #\d+|^## /m);
    const endIdx = nextCardMatch
      ? startIdx + match[0].length + (nextCardMatch.index ?? content.length)
      : content.length;

    const section = content.slice(startIdx, endIdx);

    // Extract values from the table
    const extractValue = (label: string): string => {
      const regex = new RegExp(`\\*\\*${label}\\*\\*\\s*\\|\\s*(.+?)(?=\\s*\\|\\s*$|\\n)`, 'im');
      const m = section.match(regex);
      return m ? m[1].trim() : '';
    };

    cards.push({
      cardId,
      playerName,
      centering: extractValue('Centering'),
      corners: extractValue('Corners'),
      edges: extractValue('Edges'),
      surface: extractValue('Surface'),
      gradeLimiters: extractValue('Grade Limiters'),
      estimatedGrade: extractValue('Estimated Grade'),
      notes: extractValue('Notes')
    });
  }

  return cards;
}

function buildGraderNotes(data: CardGradingData): string {
  const lines: string[] = [];

  lines.push(`GRADING ASSESSMENT (2026-01-20)`);
  lines.push(`Estimated Grade: ${data.estimatedGrade}`);
  lines.push('');
  lines.push(`Centering: ${data.centering}`);
  lines.push(`Corners: ${data.corners}`);
  lines.push(`Edges: ${data.edges}`);
  lines.push(`Surface: ${data.surface}`);
  lines.push('');
  lines.push(`Grade Limiters: ${data.gradeLimiters}`);
  lines.push('');
  lines.push(`Notes: ${data.notes}`);

  return lines.join('\n');
}

// ==================== COMIC GRADING DATA ====================
// (Comics were graded separately and stored inline)

interface GradingEntry {
  id: number;
  currentGrade: string | null;
  estimatedGrade: string;
  notes: string;
}

const comicGradingData: GradingEntry[] = [
  { id: 163, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Moderate spine wear visible with some stress marks. Corners show light blunting. Cover has some general wear and light creasing. Colors remain reasonably vibrant for a magazine format. Some edge wear along the bottom." },
  { id: 164, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Magazine format in decent condition. Spine shows minor stress but remains intact. Cover colors are still good with some slight fading. Light corner wear present. Some general handling wear but overall presentable." },
  { id: 165, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Colors are bright and vibrant. Light spine stress visible. Minor corner wear present. Some light edge wear along bottom. Overall clean presentation but shows more wear than typical VF. Current grade is slightly high; recommend F/VF or Fine+." },
  { id: 166, currentGrade: "Good (G)", estimatedGrade: "Very Good (VG)", notes: "Noticeable spine roll and stress. Corner wear with some blunting. Cover shows handling wear and some creasing. Colors still decent but some fading. Overall structural integrity maintained. Current grade is slightly conservative; VG would be more accurate." },
  { id: 167, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Visible spine stress and wear. Corner blunting present on multiple corners. Some cover creasing visible. Colors remain reasonably bright. General handling wear throughout." },
  { id: 168, currentGrade: "Good (G)", estimatedGrade: "Very Good (VG)", notes: "Spine shows stress marks and minor rolling. Cover wear consistent with reading use. Corners have wear but no major damage. Colors somewhat faded but still visible. No major tears or missing pieces. Current grade is slightly conservative; VG- to VG would be more accurate." },
  { id: 169, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Cover presents well with good color retention. Spine shows light stress marks. Corners have minor wear. Some light handling marks. Overall cleaner than average for this era." },
  { id: 170, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Good color vibrancy on cover. Light spine stress visible. Minor corner wear. Some edge wear present. Cover art remains clean and appealing." },
  { id: 171, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Cover colors are vibrant. Spine shows light wear. Corners have minor blunting. Light handling wear overall. Newsstand copy in good condition. Current grade is accurate." },
  { id: 172, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Moderate spine wear visible. Some corner wear present. Cover shows handling marks. Colors remain decent. Newsstand copy with typical wear." },
  { id: 173, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Cover colors are bright (yellow particularly vibrant). Light spine stress. Minor corner wear. Clean overall appearance. Light edge wear at bottom. Current grade is accurate." },
  { id: 174, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Cover presents well with good colors. Light spine stress visible. Minor corner wear. Small pen mark visible at top of cover (previous owner marking). Overall clean copy. Current grade is accurate (pen mark may drop it to F-)." },
  { id: 175, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Visible spine stress and some rolling. Corner wear present. Cover shows handling wear. Colors remain decent. Some creasing visible." },
  { id: 176, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Good color presentation. Light spine stress. Minor corner wear. Clean cover overall. Some light handling marks. Current grade is slightly high; F/VF is more accurate." },
  { id: 177, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Moderate spine wear. Corner wear visible. Cover shows handling marks and light creasing. Colors remain good. Newsstand copy with typical wear." },
  { id: 178, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Cover colors remain bright. Light spine stress. Minor corner wear. Some light edge wear at bottom. Overall clean presentation for newsstand copy. Current grade is accurate." },
  { id: 179, currentGrade: null, estimatedGrade: "Very Good (VG)", notes: "Visible spine wear and stress marks. Corner wear present. Some cover creasing. Colors remain decent. General handling wear throughout." },
  { id: 180, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Good color vibrancy. Light spine stress. Minor corner wear. Light creasing visible. Overall clean copy with typical handling wear." },
  { id: 181, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Comic is bagged and boarded (protective storage). Cover appears clean and vibrant. Minimal visible wear. Corners appear sharp. Well-preserved Bronze Age copy. Current grade appears accurate." },
  { id: 182, currentGrade: "Fair", estimatedGrade: "Good (G)", notes: "Golden Age comic showing significant age. Bagged for protection. Cover shows yellowing/tanning from age. Visible wear but cover intact. Colors faded but still visible. Spine wear present but comic appears complete. Current grade may be slightly conservative; Good- to Good is more likely." },
  { id: 183, currentGrade: "Good (G)", estimatedGrade: "Good (G)", notes: "Silver Age DC comic with age-appropriate wear. Bagged for protection. Cover shows tanning/yellowing. Visible creasing and wear. Colors faded but cover art still clear. Structural integrity maintained. Current grade is accurate." },
  { id: 184, currentGrade: null, estimatedGrade: "Good (G)", notes: "Silver Age DC key issue. Bagged for protection. Cover shows age tanning. Visible creasing and wear marks. Colors faded but imagery clear. Spine shows wear but intact. For age, this is decent preservation." },
  { id: 185, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Cover colors are vibrant. Minimal visible wear. Corners appear sharp. Modern Age comic in good condition. Jim Lee cover presents well." },
  { id: 186, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Excellent color presentation. Cover appears very clean. Sharp corners visible. Minimal handling marks. Well-preserved copy." },
  { id: 187, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Vibrant cover colors. Clean presentation. Sharp corners. Minimal wear visible. Jim Lee art showcased well." },
  { id: 188, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Bagged and boarded. Cover colors are excellent. Clean, sharp presentation. Corners appear sharp. Minimal to no visible defects. Sam Kieth cover in excellent condition. Current grade is accurate or very close." },
  { id: 189, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Good color vibrancy. Clean cover presentation. Sharp corners. Light handling marks possible. Marc Silvestri cover well-preserved." },
  { id: 190, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Cover colors vibrant. Clean presentation. Sharp corners. Minor handling possible. Current grade is accurate." },
  { id: 191, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Bagged and boarded. Iconic Todd McFarlane cover in excellent condition. Colors are vibrant. Sharp corners visible. Minimal visible defects. Well-preserved key issue. Current grade is accurate or very close." },
  { id: 192, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded. Cover presents well. Good color vibrancy. Sharp corners. Minimal wear visible. Current grade is accurate." },
  { id: 193, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Comic is in a protective bag/sleeve. Cover appears clean with good color vibrancy on the black and silver artwork. Corners appear relatively sharp. Minimal visible wear on the spine. Some very light edge wear visible. Overall excellent presentation for an early Image comic." },
  { id: 194, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged and boarded for protection. Vibrant colors on the detailed cover art (Sam Kieth, Jim Lee, Rob Liefeld). Cover lies flat with no major creasing. Corners appear intact with minimal blunting. Slight spine stress ticks may be present. Good overall structural integrity." },
  { id: 195, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Protected in sleeve. Colors remain vibrant. Some light wear along edges. Corners show minor blunting. Spine appears solid with minimal stress marks. Current grade appears accurate." },
  { id: 196, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Clean cover with bold colors. Valiant logo clearly visible. Corners appear sharp. Minimal spine stress. Cover lies flat. Current grade appears accurate." },
  { id: 197, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Excellent condition chromium/embossed cover. Sharp corners throughout. Spine is tight with no visible stress. Colors are crisp and vibrant. No visible creases or defects. Premium presentation. Current grade appears accurate." },
  { id: 198, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Striking cover design with radiating pattern. Colors are bold and unfaded. Corners appear crisp. Spine shows minimal stress. Cover lays flat. Very clean overall presentation." },
  { id: 199, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bagged for protection. Glossy cover with excellent color saturation. Detailed artwork appears crisp. Corners look sharp. No visible spine breaks or roll. Minimal handling wear." },
  { id: 200, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Classic 1980s comic showing age-appropriate wear. Colors remain reasonably vibrant. Some light edge wear visible. Corners show minor wear. Spine has light stress. Good condition for a mid-80s newsstand comic." },
  { id: 201, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Clean cover with good color retention. Corners appear reasonably sharp. Light spine stress marks. Minor edge wear. Cover lies flat. Current grade appears accurate." },
  { id: 202, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "First issue with 'First' banner visible. Colors are good for age. Some light foxing/aging possible on edges. Corners show minor wear. Spine appears intact. Typical condition for 1980s newsstand comic." },
  { id: 203, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Darker cover shows some handling wear. Some visible edge wear. Colors slightly muted in places. Corners show some rounding. Cover has minor wear marks. Current grade may be slightly high - suggest F/VF 7.0." },
  { id: 204, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Visible wear throughout. Some creasing evident. Colors have faded slightly. Corner wear present. Spine shows stress marks. General reader-grade appearance. Current grade appears accurate." },
  { id: 205, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Iconic 'Death of Superman' issue. Newsstand edition with cover price visible. Cover colors are vibrant (red cape tattered artwork). Corners appear decent. Some light handling wear. Current grade appears accurate." },
  { id: 206, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Another copy of the iconic issue. Appears to be in slightly better condition than ID 205. Sharper corners. Cleaner cover presentation. Minimal visible wear. Strong candidate for VF/NM grade." },
  { id: 207, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'Curse of the Atomic Skull' cover. Good color vibrancy. Corners appear intact. Light spine stress. Cover lies relatively flat. Current grade appears accurate." },
  { id: 208, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Superman/Batman cover (John Byrne art). Some visible wear on edges. Colors still decent. Corners show wear. Light spine stress. Current grade appears accurate to slightly conservative." },
  { id: 209, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Maxima cover with striking red-haired character. Cover colors are vibrant. Clean presentation. Corners appear good. Minimal spine stress. Current grade appears accurate." },
  { id: 210, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Tim Drake Robin mini-series. Excellent color saturation. Sharp corners. Clean spine. Cover lies flat. Very well preserved." },
  { id: 211, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Official 1989 Batman movie adaptation. Prestige format/squarebound. Cover shows Batman and Joker. Good structural integrity. Some minor edge wear on squarebound spine. Current grade appears accurate." },
  { id: 212, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Some visible wear on cover. Slight creasing visible. Colors remain decent. Corners show some wear. Cover shows handling marks. Current grade may be slightly high - suggest F/VF 7.0." },
  { id: 213, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "First issue of 1987 relaunch. Some visible wear. Colors somewhat muted. Light creasing possible. Newsstand edition showing age. Current grade may be slightly high - suggest 7.0-7.5." },
  { id: 214, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'Sinestro Strikes' storyline. Dark cover shows wear more prominently. Visible edge wear. Some corner blunting. Cover has some scuffing. Moderate wear consistent with Fine grade." },
  { id: 215, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Colorful action cover. Good color vibrancy. Corners appear decent. Light spine stress. Some minor edge wear. Overall solid presentation." },
  { id: 216, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Dynamic red-toned cover. Bold colors intact. Corners appear good. Cover lies flat. Minimal visible defects. Current grade appears accurate." },
  { id: 217, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Part of X-Cutioner's Song crossover. Bright, vibrant colors. Sharp corners. Clean spine. Excellent color on yellow costume. Well preserved." },
  { id: 218, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Crossover issue with strong colors. Good corner sharpness. Cover lies flat. Minimal wear. Newsstand edition in excellent shape. Current grade appears accurate or very slightly high." },
  { id: 219, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Busy action cover with excellent color saturation. Sharp corners. Clean, tight spine. Minimal handling wear. Cover is bright and glossy. Current grade appears accurate." },
  { id: 220, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Featuring Colossus and Apocalypse. Excellent color vibrancy. Sharp corners throughout. Clean spine. Cover lies perfectly flat. Premium condition. Current grade appears accurate." },
  { id: 221, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Wolverine and Venom cover. Good color depth. Corners appear decent. Light handling wear. Spine shows minimal stress. Solid collectible condition." },
  { id: 222, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bright, dynamic cover. Excellent color saturation. Sharp corners. Clean spine. Minimal visible wear. Very well preserved." },
  { id: 223, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Comic is in a protective sleeve/bag. Cover shows good color vibrancy with bright yellows and purples. Minor spine stress visible. Corners appear reasonably sharp. Some light wear on edges. First issue from the animated series tie-in." },
  { id: 224, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Classic Wolverine vs. Sabretooth cover by Marc Silvestri. In protective sleeve. Cover colors are solid but show some age toning. Minor spine wear visible. Corners show slight rounding. Current grade appears accurate." },
  { id: 225, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "X-Cutioner's Song crossover issue. Some visible wear on cover edges. Spine shows stress marks. Colors slightly muted/aged. Corners show minor wear. Current grade may be slightly high - closer to Fine/Very Fine." },
  { id: 226, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Anniversary issue with foil elements. In protective sleeve. Cover is clean and vibrant. Corners appear sharp. Minimal visible wear. Very good overall presentation. Current grade appears accurate or very close." },
  { id: 227, currentGrade: null, estimatedGrade: "Near Mint (NM)", notes: "Jim Lee cover art featuring Wolverine/X-Men. Excellent color vibrancy. Sharp corners visible. Clean cover with minimal wear. In protective sleeve. 30th Anniversary stamp visible. One of the best condition comics in this collection." },
  { id: 228, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Reprint series issue. Cover shows moderate wear. Colors appear somewhat faded/dark. Spine stress visible. Corners show light wear. Current grade may be slightly high." },
  { id: 229, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'Fallen Angel' storyline featuring Nightcrawler. Good color vibrancy. Cover is clean. Minor spine stress. Corners reasonably sharp. Current grade appears accurate." },
  { id: 230, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Peristrike Force Finale storyline. Excellent cover condition. Sharp corners. Vibrant colors. Clean spine. In protective sleeve. Current grade appears accurate." },
  { id: 231, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Spider-Man and Cannonball cover. Cover shows moderate wear and age toning. Some yellowing visible on cover. Spine shows stress. Corners show wear. Colors are somewhat faded." },
  { id: 232, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'What If Spider-Man Had Kept His Six Arms?' Very clean cover. Good color vibrancy. Sharp corners. Minimal wear visible. In protective sleeve. One of the better condition comics in this batch." },
  { id: 233, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'What If Cable Had Destroyed the X-Men?' Cover shows some wear. Spine stress visible. Colors are decent but show some age. Corner wear present. Not in sleeve in photo." },
  { id: 234, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Cover features Franklin Richards and taxi scene. Clean cover presentation. Good color vibrancy. Minor edge wear. Corners reasonably sharp. Current grade appears accurate." },
  { id: 235, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Ms. Marvel guest star, 'Duel with Diablo.' Cover shows moderate wear. Some color fading visible. Spine stress present. Corners show light wear. Some age toning on cover." },
  { id: 236, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Marvel New Universe title. Cover shows noticeable wear. Spine stress visible. Colors somewhat faded. Corner wear present. Overall moderate condition. Current grade appears accurate." },
  { id: 237, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Re-Enter Starhawk' cover. Excellent color vibrancy. Clean cover. Sharp corners. Minimal visible wear. Very good overall condition." },
  { id: 238, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'The Day the Earth Moved' featuring Iron Man. Good cover condition. Colors are solid. Minor spine wear. Corners reasonably sharp. Current grade appears accurate." },
  { id: 239, currentGrade: "Near Mint (NM)", estimatedGrade: "Near Mint (NM)", notes: "Guest-starring Wolverine cover. Excellent condition. Vibrant colors. Sharp corners. Clean spine. 30th Anniversary stamp. Current grade appears accurate." },
  { id: 240, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'A New Team of Avengers' - team roster cover. 50 Years Captain America emblem. Good color vibrancy. Clean cover. Minor edge wear. Current grade appears accurate." },
  { id: 241, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'Fear the Reaper Part III' cover. Unique finger/eye artwork. Good condition. Colors are solid. Minor wear visible. 30th Anniversary stamp. Current grade appears accurate." },
  { id: 242, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Arena of Death' storyline. Good cover condition. Colors are vibrant. Minor spine stress. Corners show light wear. In protective sleeve." },
  { id: 243, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Action-packed team cover. Very clean presentation. Good color vibrancy. Sharp corners. Minimal wear. 30th Anniversary stamp. Current grade appears accurate or slightly conservative." },
  { id: 244, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "'The Sicilian Saga Part Three.' Good cover condition. Colors are solid. Some minor edge wear. Spine shows light stress. Current grade appears accurate." },
  { id: 245, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Iconic green/grey Hulk cover by Dale Keown. Key issue - 'New' Incredible Hulk. Good color vibrancy (bright green). Minor edge wear. Corners reasonably sharp. Current grade appears accurate." },
  { id: 246, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Ghost of the Past Part Three.' Very clean cover. Excellent color vibrancy. Sharp corners. Minimal wear visible. 30th Anniversary emblem." },
  { id: 247, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "400th issue special. 'Ghost of the Past' conclusion. Good cover condition. Colors are vibrant. Some minor wear on edges. Current grade appears accurate." },
  { id: 248, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Rise of the Midnight Sons preview. August 1992 issue. Cover shows moderate wear. Some edge wear and age toning. Spine stress visible. Current grade appears accurate." },
  { id: 249, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Same issue as ID 248. This copy appears slightly cleaner. Less visible wear than the other copy. Still shows age toning. Current grade appears accurate, possibly slightly conservative." },
  { id: 250, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Rise of the Midnight Sons Part 5 of 6. Good cover condition. Colors are vibrant. Minor wear visible. In protective sleeve. First issue collector's item." },
  { id: 251, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Rise of the Midnight Sons Part 4 of 6. Good cover condition. Colors are solid. Some minor edge wear. Spine shows light stress. First issue." },
  { id: 252, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Rise of the Midnight Sons Part 3 of 6. Good cover condition. Vibrant magenta/purple colors. In protective sleeve. Minor wear visible. Current grade appears accurate." },
  { id: 253, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Comic is bagged with a dark/glow-in-the-dark style cover featuring Ghost Rider. Cover appears clean with good color. Some minor spine stress visible. Corners appear relatively sharp. Part of the Midnight Sons series." },
  { id: 254, currentGrade: "Very Fine (VF)", estimatedGrade: "Fine (F)", notes: "Some visible spine stress marks. Slight corner wear visible at top right. Cover colors are good but there appears to be minor edge wear. Light creasing near spine area. Current grade slightly high - suggest F/VF rather than VF." },
  { id: 255, currentGrade: "Fine (F)", estimatedGrade: "Fine (F)", notes: "Notable spine stress and some rolling. Cover shows moderate wear. Colors remain vibrant. Some edge wear visible. Current grade is accurate, Fine is appropriate." },
  { id: 256, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Cover shows some age-related yellowing on edges. Minor spine stress visible. Corners show light wear. Cover art is clear and colors are decent. Part 3 of 7 issue series." },
  { id: 257, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "Clean cover with vibrant colors. Minor spine stress. Corners appear fairly sharp. Newsstand edition. Bagged and appears well preserved. Current grade is accurate, VF is appropriate." },
  { id: 258, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "First appearance of Spider-Man 2099 (Miguel O'Hara) - KEY ISSUE. Cover has bright colors. Some minor edge wear visible. Spine shows light stress. Bagged copy in good condition." },
  { id: 259, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Excellent cover condition. Clean, bright colors. Sharp corners. Minimal spine stress. Well preserved in bag." },
  { id: 260, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Classic Venom cover. Some spine stress visible. Minor edge wear. Colors remain vibrant. Light corner wear." },
  { id: 261, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Features Cardiac. 30th Anniversary logo. Clean cover with good colors. Minor spine stress. Corners appear relatively sharp." },
  { id: 262, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "30th Anniversary Super-Sized issue. Holographic/hologram cover insert. Cover is clean. Good structural integrity. Spider-Man 2099 preview inside." },
  { id: 263, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'Name of the Rose' storyline. Some visible spine stress. Minor edge wear. Colors are decent. Newsstand edition." },
  { id: 264, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "First issue with Dr. Strange, Wolverine, Nomad, Spider-Woman. Red foil enhanced cover. Clean presentation. Minor spine stress. Bagged copy." },
  { id: 265, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "First issue of the 2099 series. Blue foil enhanced cover. Vibrant colors. Clean cover with minimal wear. Bagged and well preserved." },
  { id: 266, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Introduction of Morg. Features Firelord. Good cover colors. Minor spine stress. Light edge wear." },
  { id: 267, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Battle with Bushman storyline. Some spine stress visible. Minor edge wear. Colors are good. Newsstand edition." },
  { id: 268, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'Resurrection of Evil' storyline. This is an older issue (early 1980s Marvel). Noticeable spine wear. Some edge wear visible. Colors show slight fading. Newsstand edition with some age." },
  { id: 269, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Marvel Comics Group era (1983). Some spine stress and wear. Cover shows age-related wear. Minor edge wear. Colors have slightly faded." },
  { id: 270, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Infinity War crossover. Good cover colors. Minor spine stress. Clean overall appearance. 30th Anniversary Amazing Spider-Man corner box." },
  { id: 271, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Good dark cover with solid colors. Minor spine stress. Some light edge wear. Overall clean presentation." },
  { id: 272, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Bright, vibrant colors. Clean cover. Sharp corners. Minimal spine stress. Well preserved." },
  { id: 273, currentGrade: "Very Fine (VF)", estimatedGrade: "Very Fine (VF)", notes: "First issue collector's item. Some minor spine stress. Colors are good. Light edge wear. Newsstand edition. Current grade is accurate, VF is appropriate." },
  { id: 274, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'Apocalypse, Inc!' cover. Appears to be a later issue (not actually #1 despite listing). Shows some wear. Minor spine stress. Colors are decent." },
  { id: 275, currentGrade: null, estimatedGrade: "Fine (F)", notes: "'Man and Wolf' Part 1 of 6. Some spine stress visible. Minor edge wear. Colors are good. Some light corner wear." },
  { id: 276, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Capwolf' cover - Man and Wolf Part 4. Clean cover with vibrant colors. Minor spine stress. Good corner sharpness. 30th Anniversary Spider-Man corner box." },
  { id: 277, currentGrade: "Near Mint (NM)", estimatedGrade: "Very Fine (VF)", notes: "Features Bloodaxe. Clean cover with bright colors. Sharp corners. Very minor spine stress. 30th Anniversary Spider-Man corner box. Current grade slightly high - suggest VF/NM rather than full NM, but it's close." },
  { id: 278, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "25th Anniversary issue. Excellent cover condition. Clean white background. Sharp corners. Minimal wear visible." },
  { id: 279, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Features Silver Surfer and Mephisto. Excellent cover condition. Bright, vibrant colors. Sharp corners. Very clean presentation." },
  { id: 280, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'In Critical Condition' storyline. Clean cover. Good colors. Minor spine stress. 30th Anniversary Spider-Man corner box." },
  { id: 281, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Features Inhumans/Fantastic Four history. Clean cover with good colors. Minor edge wear. Light spine stress." },
  { id: 282, currentGrade: null, estimatedGrade: "Fine (F)", notes: "New Universe Giant-Sized Annual. Some spine stress visible. Minor edge wear. Colors are good. Light wear at corners." },
  { id: 283, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "X-Cutioner's Song Addendum. Special X-Men Collectable. Clean cover. Good colors. Minor spine stress." },
  { id: 284, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Back in His Element' storyline. Excellent cover condition. Vibrant green colors. Sharp corners. Minimal wear. 30th Anniversary corner box." },
  { id: 285, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Clean cover with bold colors. Minor spine stress. Good corner sharpness. Well preserved." },
  { id: 286, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "Trade paperback format (not standard comic). Liefeld, Nicieza, McFarlane creators. Cover is clean and bright. Square binding in good condition. Minor shelf wear only." },
  { id: 287, currentGrade: null, estimatedGrade: "Very Fine (VF)", notes: "'Back From the Dead?!' issue. Special collector's edition (#500). Some edge wear visible. Spine shows minor stress. Classic painted cover. DC Comics." },
  { id: 288, currentGrade: null, estimatedGrade: "Fine (F)", notes: "Trade paperback collecting the Death of Superman storyline. Iconic cover with Lois Lane holding Superman. Some spine/binding wear visible. Cover shows light wear. Minor corner bumping. Historic storyline collection." },
];

// ==================== IMPORT LOGIC ====================

const updateStmt = db.prepare(`
  UPDATE items
  SET condition_grade = ?,
      notes = ?,
      updated_at = ?
  WHERE id = ?
`);

const checkStmt = db.prepare('SELECT id, name, condition_grade FROM items WHERE id = ?');

function importCards(): { updated: number; notFound: number } {
  console.log('=== Importing Card Grading Data from grading-report.md ===\n');

  if (!fs.existsSync(REPORT_PATH)) {
    console.log('grading-report.md not found, skipping card import');
    return { updated: 0, notFound: 0 };
  }

  const content = fs.readFileSync(REPORT_PATH, 'utf-8');
  const cardData = parseGradingReport(content);
  console.log(`Found ${cardData.length} cards in report\n`);

  let updated = 0;
  let notFound = 0;
  const now = new Date().toISOString();

  for (const data of cardData) {
    const existing = checkStmt.get(data.cardId) as { id: number; name: string; condition_grade: string | null } | undefined;

    if (!existing) {
      console.log(`  Card #${data.cardId} (${data.playerName}) not found in database`);
      notFound++;
      continue;
    }

    const conditionGrade = mapPsaToCondition(data.estimatedGrade);
    const graderNotes = buildGraderNotes(data);

    updateStmt.run(conditionGrade, graderNotes, now, data.cardId);
    console.log(`  Updated #${data.cardId} ${existing.name} -> ${conditionGrade}`);
    updated++;
  }

  return { updated, notFound };
}

function importComics(): { updated: number; notFound: number } {
  console.log('\n=== Importing Comic Grading Data ===\n');

  let updated = 0;
  let notFound = 0;
  const now = new Date().toISOString();

  for (const entry of comicGradingData) {
    const existing = checkStmt.get(entry.id) as { id: number; name: string; condition_grade: string | null } | undefined;

    if (!existing) {
      console.log(`  Comic ID ${entry.id} not found in database`);
      notFound++;
      continue;
    }

    updateStmt.run(entry.estimatedGrade, entry.notes, now, entry.id);
    console.log(`  Updated #${entry.id} ${existing.name} -> ${entry.estimatedGrade}`);
    updated++;
  }

  return { updated, notFound };
}

// Run the import
console.log('Starting grading report import...\n');

const cardResults = importCards();
const comicResults = importComics();

console.log('\n=== Import Summary ===');
console.log(`Cards:  ${cardResults.updated} updated, ${cardResults.notFound} not found`);
console.log(`Comics: ${comicResults.updated} updated, ${comicResults.notFound} not found`);
console.log(`Total:  ${cardResults.updated + comicResults.updated} items updated`);

db.close();
console.log('\nImport complete!');

const pool = require('./src/db');

const initialCategories = [
  { id: 'sparkerls', name: 'SPARKERLS', displayOrder: 1 },
  { id: 'flower-pots', name: 'FLOWER POTS', displayOrder: 2 },
  { id: 'ground-chakkaras', name: 'GROUND CHAKKARAS', displayOrder: 3 },
  { id: 'twinking-stars', name: 'TWINKING STARS', displayOrder: 4 },
  { id: 'colour-candles', name: 'COLOUR CANDLES', displayOrder: 5 },
  { id: 'one-sound-crackers', name: 'ONE SOUND CRACKERS', displayOrder: 6 },
  { id: 'bijili-crackers', name: 'BIJILI CRACKERS', displayOrder: 7 },
  { id: 'atom-bomb', name: 'ATOM BOMB', displayOrder: 8 },
  { id: 'colour-match-box', name: 'COLOUR MATCH BOX', displayOrder: 9 },
  { id: 'drone-and-musicalwheel', name: 'DRONE AND MUSICALWHEEL', displayOrder: 10 },
  { id: 'paper-outs-paper-bomb', name: 'PAPER OUTS PAPER BOMB', displayOrder: 11 },
  { id: 'new-arrival-fountain', name: 'NEW ARRIVAL FOUNTAIN', displayOrder: 12 },
  { id: 'colour-and-crackling-fountain', name: 'COLOUR AND CRACKLING FOUNTAIN', displayOrder: 13 },
  { id: 'paris-colour-crack-fountain', name: 'PARIS COLOUR CRACK FOUNTAIN', displayOrder: 14 },
  { id: 'rockets', name: 'ROCKETS', displayOrder: 15 },
  { id: 'kids-crackers', name: 'KIDS CRACKERS', displayOrder: 16 },
  { id: 'peacock', name: 'PEACOCK', displayOrder: 17 },
  { id: 'magic-sound-wala', name: 'MAGIC SOUND (WALA)', displayOrder: 18 },
  { id: 'gun-and-roll-cap', name: 'GUN AND ROLL CAP', displayOrder: 19 },
  { id: 'amazing-and-colour-fountain-and-fancy', name: 'AMAZING AND COLOUR FOUNTAIN AND FANCY', displayOrder: 20 },
  { id: 'wondering-fountain', name: 'WONDERING FOUNTAIN', displayOrder: 21 },
  { id: 'classic-fountain', name: 'CLASSIC FOUNTAIN', displayOrder: 22 },
  { id: 'purple-dove', name: 'PURPLE DOVE', displayOrder: 23 },
  { id: 'sky-shot-colours', name: 'SKY SHOT COLOURS', displayOrder: 24 },
  { id: 'mega-aerial-fancy', name: 'MEGA AERIAL FANCY', displayOrder: 25 },
  { id: 'multi-colour-shot', name: 'MULTI COLOUR SHOT', displayOrder: 26 },
  { id: 'garland-crackers', name: 'GARLAND CRACKERS', displayOrder: 27 }
];

async function migrate() {
  try {
    console.log('Creating categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        displayOrder INT DEFAULT 999
      )
    `);

    console.log('Inserting categories...');
    for (const cat of initialCategories) {
      await pool.query(`
        INSERT INTO categories (id, name, displayOrder) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [cat.id, cat.name, cat.displayOrder]);
    }
    
    console.log('Categories migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

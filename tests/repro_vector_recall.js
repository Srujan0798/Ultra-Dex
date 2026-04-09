import { VectorStore } from '../apps/cli/lib/memory/vector-store.js';
import path from 'path';
import fs from 'fs/promises';

async function run() {
  console.log('Running Vector Recall Reproduction Test...');

  // Use a temporary DB
  const dbPath = path.resolve(process.cwd(), '.ultra-dex', 'repro-vector.db');

  // Clean up
  try {
    await fs.rm(dbPath, { force: true });
  } catch (e) {}

  const store = new VectorStore({ storagePath: dbPath });
  await store.init();

  const originalText = 'The automobile is parked in the garage.';
  const queryText = 'car parking';

  console.log(`Adding document: "${originalText}"`);
  await store.add('doc1', originalText);

  console.log(`Querying: "${queryText}"`);
  const results = await store.query(queryText);

  const bestMatch = results[0];
  console.log('Best match:', bestMatch);

  // If score is low, it means semantic similarity failed.
  // With hash based embedding, "automobile" and "car" have totally different hashes.
  // "parked" and "parking" might match if stemming was used, but embeddings.js splits by space and hashes.
  // So "parked" != "parking".

  if (!bestMatch || bestMatch.score < 0.1) {
    console.log(
      'SUCCESS: Semantic recall failed (synonyms not matched). Score:',
      bestMatch ? bestMatch.score : 'N/A'
    );
  } else {
    console.log(
      'FAILURE: Unexpectedly high score. Maybe accidental collision? Score:',
      bestMatch.score
    );
  }

  await store.close();
}

run().catch(console.error);

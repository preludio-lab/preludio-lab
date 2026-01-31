import fs from 'fs';
import path from 'path';
import { ComposerMasterSchema } from '../src/application/composer/master/composer-master.schema';
import { WorkMasterSchema } from '../src/application/work/master/work-master.schema';

const DATA_DIR = path.join(process.cwd(), 'data');

async function validateComposers() {
  const dir = path.join(DATA_DIR, 'composers');
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  console.log(`\nValidating ${files.length} composers...`);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const result = ComposerMasterSchema.safeParse(content);
    if (result.success) {
      console.log(`✅ ${file}: OK`);
    } else {
      console.error(`❌ ${file}: FAILED`, result.error.format());
      process.exit(1);
    }
  }
}

async function validateWorks() {
  const dir = path.join(DATA_DIR, 'works');
  if (!fs.existsSync(dir)) return;

  console.log(`\nValidating works...`);
  // Recursive search for all json files in works/
  const composers = fs.readdirSync(dir);

  for (const composer of composers) {
    const composerDir = path.join(dir, composer);
    if (!fs.statSync(composerDir).isDirectory()) continue;

    const files = fs.readdirSync(composerDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(composerDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const result = WorkMasterSchema.safeParse(content);
      if (result.success) {
        // Additional check: Does slug match filename? (Optional but good)
        const expectedSlug = path.parse(file).name;
        if (content.slug !== expectedSlug) {
          console.error(
            `❌ ${composer}/${file}: Slug mismatch (file: ${expectedSlug}, content: ${content.slug})`,
          );
          process.exit(1);
        }
        console.log(`✅ ${composer}/${file}: OK`);
      } else {
        console.error(`❌ ${composer}/${file}: FAILED`, result.error.format());
        process.exit(1);
      }
    }
  }
}

async function main() {
  console.log('🎼 Starting Master Data Validation...');
  try {
    await validateComposers();
    await validateWorks();
    console.log('\n✨ All data is valid!');
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
}

main();

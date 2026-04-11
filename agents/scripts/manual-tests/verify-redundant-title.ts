import { WorkDraftAgent } from '../../src/agents/work/draft-agent.js';
import { GeminiModels } from '../../src/core/models.js';
import { consola } from 'consola';

async function main() {
  const agent = new WorkDraftAgent({ modelName: GeminiModels.FLASH_LITE });

  const input = {
    composerName: 'Wolfgang Amadeus Mozart',
    composerSlug: 'mozart',
    workTitle: 'Piano Concerto No. 20 in D minor, K. 466',
    slug: 'piano-concerto-no-20',
  };

  consola.log('Generating draft for:', input.workTitle);
  const result = await agent.execute(input);

  consola.log('\nGenerated titleComponents:');
  consola.log(JSON.stringify(result.titleComponents, null, 2));

  if (result.titleComponents.distinctiveTitle) {
    consola.error('\nFAIL: redundant distinctiveTitle still exists!');
  } else {
    consola.log('\nSUCCESS: distinctiveTitle is omitted as expected.');
  }
}

main().catch(consola.error);

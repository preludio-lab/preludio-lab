import { MediaMetadataService } from './src/infrastructure/player/MediaMetadataService';

const abcContent = `X:3
%%audio_src iWoI8vmE8bI
%%audio_title J.S. Bach: Prelude No. 1
%%audio_composer J.S. Bach
%%audio_performer Alexandre Tharaud
%%audio_artworkSrc https://img.youtube.com/vi/iWoI8vmE8bI/hqdefault.jpg
M:4/4
L:1/16
K:C
%%score_system_on
z2 E2 G2 c2 e2 G2 c2 e2 | z2 F2 A2 d2 f2 A2 d2 f2 |`;

const service = new MediaMetadataService();
const result = service.parse(abcContent, 'abc');

console.log('Parsed Result:', JSON.stringify(result, null, 2));

import { zInt } from './src/shared/validation/zod';
import { z } from 'zod';

const schema = z.object({
  val: zInt().optional(),
});

console.log('Zod Optional Check (undefined):', schema.safeParse({ val: undefined }));
console.log('Zod Optional Check (missing):', schema.safeParse({}));

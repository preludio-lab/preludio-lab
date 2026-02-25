import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('test', { fetch: (...args) => fetch(...args) } as any);
console.log(genAI);

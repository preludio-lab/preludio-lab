import { GoogleGenerativeAI } from '@google/generative-ai';
import { consola } from 'consola';
const genAI = new GoogleGenerativeAI('test');
consola.info(genAI);

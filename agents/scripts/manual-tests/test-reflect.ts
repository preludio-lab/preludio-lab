import { GoogleGenerativeAI } from '@google/generative-ai';
import { consola } from 'consola';
const genAI = new GoogleGenerativeAI('foo');
consola.info(genAI);

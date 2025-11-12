import axios from 'axios';
import 'dotenv/config'; // Load .env variables

const listModels = async () => {
  const API_KEY = process.env.GOOGLE_API_KEY;
  if (!API_KEY) {
    console.error('❌ GOOGLE_API_KEY not found in .env file!');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  console.log('Fetching available models...');
  try {
    const response = await axios.get(url);
    const models = response.data.models;

    console.log('\n--- ALL AVAILABLE MODELS ---');
    models.forEach(model => {
      console.log(`\nModel Name: ${model.name}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
    });

    // Filter for the ones we care about
    const streamingModels = models
      .filter(m => m.supportedGenerationMethods.includes('streamGenerateContent'))
      .map(m => m.name);

    console.log('\n\n--- 🚀 MODELS THAT SUPPORT STREAMING ---');
    console.log(streamingModels.join('\n'));
    console.log('\n--------------------------------------');
    console.log('Find a model in the list above (like "gemini-1.5-flash") and copy its name.');

  } catch (error) {
    console.error('❌ Error fetching models:', error.response?.data || error.message);
  }
};

listModels();
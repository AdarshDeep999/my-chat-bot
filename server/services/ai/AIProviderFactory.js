import GoogleProvider from './providers/GoogleProvider.js';
import DialogflowProvider from './providers/DialogflowProvider.js';

const instances = {
  google: new GoogleProvider(process.env.GOOGLE_API_KEY),
  dialogflow: new DialogflowProvider()
};

export default {
  getProvider(name = 'google') {
    return instances[name] || instances.google;
  }
};

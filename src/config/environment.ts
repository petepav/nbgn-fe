const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    network: 'arbitrum',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067',
    eureAddress: '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
    dbgnAddress: '0x144bc6785d4bBC450a736f0e0AC6d2B551a1eDB6',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  preview: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api-staging.example.com',
    network: 'arbitrum-goerli',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    eureAddress: process.env.REACT_APP_EURE_ADDRESS,
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.example.com',
    network: 'arbitrum',
    contractAddress: '0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067',
    eureAddress: '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
    dbgnAddress: '0x144bc6785d4bBC450a736f0e0AC6d2B551a1eDB6',
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  }
};

const envKey = process.env.VERCEL_ENV || 'development';
console.log('Environment key:', envKey);
console.log('Contract address being used:', config[envKey as keyof typeof config].contractAddress);
console.log('EURe address being used:', config[envKey as keyof typeof config].eureAddress);
export default config[envKey as keyof typeof config];
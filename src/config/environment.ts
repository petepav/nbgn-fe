const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    network: 'arbitrum',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0xF5834Af69E2772604132f796f6ee08fd0f83C28a',
    eureAddress: '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
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
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0xF5834Af69E2772604132f796f6ee08fd0f83C28a',
    eureAddress: '0x0c06cCF38114ddfc35e07427B9424adcca9F44F8',
  }
};

const envKey = process.env.VERCEL_ENV || 'development';
export default config[envKey as keyof typeof config];
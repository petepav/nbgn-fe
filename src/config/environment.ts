const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    network: 'arbitrum',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5eD4874Ea2598b3E58ebbEd8b24bCff595834492',
    eureAddress: '0x0c06ccf38114ddfc35e07427b9424adcca9f44f8',
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
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '0x5eD4874Ea2598b3E58ebbEd8b24bCff595834492',
    eureAddress: '0x0c06ccf38114ddfc35e07427b9424adcca9f44f8',
  }
};

const envKey = process.env.VERCEL_ENV || 'development';
export default config[envKey as keyof typeof config];
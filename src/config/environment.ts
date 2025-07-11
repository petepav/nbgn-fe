const config = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
    network: 'localhost',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    eurcAddress: process.env.REACT_APP_EURC_ADDRESS,
  },
  preview: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api-staging.example.com',
    network: 'goerli',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    eurcAddress: process.env.REACT_APP_EURC_ADDRESS,
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.example.com',
    network: 'mainnet',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS,
    eurcAddress: process.env.REACT_APP_EURC_ADDRESS,
  }
};

const envKey = process.env.VERCEL_ENV || 'development';
export default config[envKey as keyof typeof config];
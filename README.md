# NBGN Frontend - Production-Ready React Web3 App

A complete implementation of a production-ready React Web3 application with TypeScript, ethers.js, multi-language support, and Vercel deployment setup.

## Features

- ✅ **TypeScript Support** - Full type safety for Web3 interactions
- ✅ **Web3 Integration** - ethers.js with WalletConnect support
- ✅ **Multi-language Support** - i18n with English, Spanish, and Chinese
- ✅ **State Management** - React Context API with performance optimizations
- ✅ **Smart Contract Hooks** - Reusable hooks for contract interactions
- ✅ **Transaction Management** - Complete transaction lifecycle handling
- ✅ **Vercel Deployment** - Production-ready deployment configuration
- ✅ **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- ✅ **Code Quality** - ESLint, Prettier, and pre-commit hooks
- ✅ **Testing Setup** - Jest with Web3 mocking

## Environment Setup

1. Copy `.env.local` and update with your values:
```bash
REACT_APP_INFURA_ID=your-infura-project-id
REACT_APP_ALCHEMY_KEY=your-alchemy-key
REACT_APP_WALLETCONNECT_ID=your-walletconnect-id
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK=mainnet
REACT_APP_API_URL=http://localhost:3001
```

## Available Scripts

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run test:ci`

Runs tests in CI mode (no watch, passes with no tests).

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run lint`

Runs ESLint on the source code.

### `npm run format`

Formats code with Prettier.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

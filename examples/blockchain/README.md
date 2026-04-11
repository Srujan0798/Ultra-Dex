# Web3 dApp Template

A complete, production-ready template for building decentralized applications (dApps) with modern Web3 technologies.

## Features

- **Smart Contracts**: Solidity contracts with OpenZeppelin standards
- **Multi-Wallet Support**: MetaMask, WalletConnect, Coinbase Wallet, and more
- **Full TypeScript**: Type safety throughout the entire stack
- **Modern Frontend**: Next.js 14 with App Router and Tailwind CSS
- **Contract Interaction**: Read, write, and listen to contract events
- **Comprehensive Testing**: Full test suite with Hardhat
- **Production Ready**: Deploy to mainnet, testnet, or local network

## Tech Stack

### Smart Contracts

- Solidity ^0.8.19
- OpenZeppelin Contracts
- Hardhat
- Ethers.js v6

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- RainbowKit (Wallet integration)
- wagmi (React hooks for Ethereum)
- viem (TypeScript interface for Ethereum)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Install dependencies:**

```bash
# Install root dependencies (Hardhat, contracts)
npm install

# Install frontend dependencies
cd frontend && npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Compile contracts:**

```bash
npm run compile
```

### Local Development

1. **Start local blockchain:**

```bash
npm run node
```

This starts a Hardhat network on `http://127.0.0.1:8545`

2. **Deploy contracts to local network:**

```bash
# In a new terminal
npm run deploy:local
```

3. **Start the frontend:**

```bash
npm run dev
```

4. **Open browser:**
   Navigate to `http://localhost:3000`

### Connect MetaMask to Local Network

1. Open MetaMask
2. Add network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. Import test account using private key from Hardhat console

## Project Structure

```
examples/blockchain/
├── contracts/              # Solidity smart contracts
│   ├── SimpleStorage.sol   # Basic storage contract
│   ├── MyToken.sol        # ERC20 token
│   └── MyNFT.sol          # ERC721 NFT
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router pages
│   │   ├── components/   # React components
│   │   └── config/       # Contract ABIs and addresses
│   └── package.json
├── test/                  # Contract tests
├── scripts/               # Deployment scripts
├── hardhat.config.js      # Hardhat configuration
└── package.json          # Root package.json
```

## Available Scripts

### Root Directory

- `npm run compile` - Compile Solidity contracts
- `npm run test` - Run contract tests
- `npm run coverage` - Run tests with coverage report
- `npm run node` - Start local Hardhat network
- `npm run deploy:local` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet

### Frontend Directory

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Smart Contracts

### SimpleStorage

Basic contract for storing and retrieving values with access control.

**Functions:**

- `store(uint256 value)` - Store a new value (owner only)
- `retrieve()` - Get current value
- `increment()` - Increment value by 1 (owner only)
- `transferOwnership(address newOwner)` - Transfer ownership

### MyToken (ERC20)

Fungible token with minting, burning, and transfer capabilities.

**Features:**

- Initial supply: 100,000 tokens
- Max supply: 1,000,000 tokens
- Public minting with ETH payment
- Burn functionality
- Mint price management

### MyNFT (ERC721)

Non-fungible token collection with metadata support.

**Features:**

- Max supply: 10,000 NFTs
- Max 5 mints per wallet
- Batch minting support
- Enumerable (view all tokens)
- Owner minting (free)

## Deployment

### Local Network

```bash
npm run node
npm run deploy:local
```

### Testnet (Sepolia)

1. Get Sepolia ETH from faucet
2. Set `SEPOLIA_RPC_URL` and `PRIVATE_KEY` in `.env`
3. Deploy:

```bash
npm run deploy:sepolia
```

### Mainnet

1. Set `MAINNET_RPC_URL` and `PRIVATE_KEY` in `.env`
2. Deploy (be cautious!):

```bash
npx hardhat run scripts/deploy-all.js --network mainnet
```

## Frontend Features

### Wallet Integration

- Connect multiple wallet types
- Network switching
- Account balance display
- Transaction status tracking

### Pages

- **Home**: Overview and navigation
- **Storage**: Interact with SimpleStorage contract
- **Token**: Transfer and burn ERC20 tokens
- **NFT**: Mint and view NFTs
- **Transactions**: View transaction history

## Environment Variables

Create `.env` file:

```env
# Required for deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_key

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

## Testing

### Contract Tests

```bash
npm run test
```

Tests cover:

- Contract deployment
- All function calls
- Access control
- Event emission
- Edge cases

### Coverage

```
npm run coverage
```

## Security Considerations

- Uses OpenZeppelin battle-tested contracts
- Access control patterns
- Reentrancy protection
- Input validation
- Never commit real private keys

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For issues and questions:

- Open an issue on GitHub
- Check the documentation
- Review the code comments

## Roadmap

- [ ] Add more contract examples (DAO, Staking, etc.)
- [ ] Add subgraph integration for indexing
- [ ] Add IPFS integration for NFT metadata
- [ ] Add multi-chain support
- [ ] Add gasless transactions (meta-transactions)

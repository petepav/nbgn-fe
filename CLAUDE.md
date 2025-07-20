# NBGN Voucher System Development Log

## Team
- **Harrison** (Frontend) - Me
- **Molly** (Backend) 
- **Jenny** (Smart Contracts)

## Current Status

### ✅ Completed Features
1. **Voucher Creation Flow**
   - Blockchain voucher creation with wagmi/viem
   - Backend integration for shareable links
   - Two-step process: blockchain first, then backend API
   - QR code generation for sharing

2. **Voucher Dashboard** 
   - Display user's created vouchers
   - Copy/share functionality with proper URL formatting
   - Cancel voucher with blockchain interaction
   - Manual delete from backend list

3. **Voucher Claiming**
   - Claim page with wallet-less option
   - Backend authorization with signature verification
   - Blockchain simulation (ready for gasless execution)

4. **API Integration**
   - All endpoints properly integrated with Molly's specs
   - Error handling and rate limiting
   - Sync functionality for blockchain state

5. **Language Support**
   - Removed Spanish, kept English and Bulgarian
   - All translations updated

### 🔧 Current Issues

1. **Voucher Amount Display Bug**
   - **Status**: Backend issue
   - **Problem**: Verify endpoint returns `amount: 0` instead of actual amount (1000000000000000000 wei)
   - **Next**: Ask Molly to check voucher amount storage/retrieval

2. **Voucher Persistence Issues**
   - **Status**: Backend issue  
   - **Problem**: Created vouchers sometimes disappear from list
   - **Next**: Ask Molly about voucher saving and filtering logic

### 🎯 Implementation Details

**Contract Integration:**
- Contract: `0x66Eb0Aa46827e5F3fFcb6Dea23C309CB401690B6`
- Network: Arbitrum One
- Uses wagmi v2 with proper error handling

**API Endpoints Used:**
- `POST /api/vouchers/link` - Create shareable link
- `POST /api/vouchers/verify` - Verify voucher with code
- `POST /api/vouchers/claim` - Get claim authorization
- `GET /api/vouchers/user/{address}` - Get user vouchers
- `POST /api/vouchers/sync/{voucherId}` - Sync blockchain state
- `DELETE /api/vouchers/{voucherId}` - Manual delete

**URL Format:**
- Always use hash routing: `http://localhost:3000/#/claim/{CODE}`
- Fixed multiple issues with URL generation

### 📋 Next Steps
1. **Fix amount display** - Work with Molly on backend amount storage/retrieval
2. **Test gasless claiming** - Determine who submits blockchain transactions
3. **Voucher persistence** - Ensure vouchers are properly saved and listed
4. **Production deployment** - Update API URL environment variable

### 🐛 Known Workarounds
- Added manual delete button for stuck vouchers
- Enhanced sync after voucher cancellation
- Robust URL parsing for different API response formats
- Fallback copy methods for older browsers

---
*Last updated: July 20, 2025*
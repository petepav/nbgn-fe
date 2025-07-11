// NBGN Token Contract ABI
export const NBGN_ABI = [
  // ERC-20 Standard Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  
  // NBGN Specific Functions
  "function mint(uint256 _eureAmount) returns (uint256)",
  "function redeem(uint256 _nbgnAmount) returns (uint256)",
  "function calculateNBGN(uint256 _eureAmount) pure returns (uint256)",
  "function calculateEURe(uint256 _nbgnAmount) pure returns (uint256)"
] as const;

export default NBGN_ABI;
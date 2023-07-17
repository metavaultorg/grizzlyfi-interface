import { ethers } from "ethers";

export const opBNB = 5611;
export const BSC = 56;

const { AddressZero } = ethers.constants;

export const XGMT_EXCLUDED_ACCOUNTS = [
  "0x330eef6b9b1ea6edd620c825c9919dc8b611d5d5",
  "0xd9b1c23411adbb984b1c4be515fafc47a12898b2",
  "0xa633158288520807f91ccc98aa58e0ea43acb400",
  "0xffd0a93b4362052a336a7b22494f1b77018dd34b",
];

const CONTRACTS = {
  [opBNB]: {
    Vault: "0x218703d0515f24Ca3Fa0751266051Db1ecD58f27",
    Router: "0x855f9462B3120F1607c60Fa22E5595a36AD360B4",
    VaultReader: "0x2cF7138b058187D78F09b2a7ed2CC48Cc1eE62ea",
    Reader: "0x977410290f1f091948456Ed0Fc34fAe483176396",
    GllManager: "0xb2dBc323a658ddc9C8672d3174d6721665b50B01",
    RewardRouter: "0xd7e8901A49576b974EE65A474Fc459F5A96dce72",
    RewardReader: "0x5f7881F6F06eF513243c3e2A062968255e465653",
    GLL: "0xCc570Ec20eCB62cd9589FA33724514BDBc98DC7E",
    USDG: "0x686a9130A6A7864dFAA9C7efDCeE0bbaB77C5b7D",
    FeeGllTracker: "0xfc0943aB33eE7a7fCf3fa649D9643f8413d381f8",
    OrderBook: "0xAd391e77140059D95509446B1a7D5090FB4a85cf",
    OrderExecutor: "0xdb6DB98A73cc64d5f71b92BEfD57c66E22D6724b",
    OrderBookReader: "0xdb6DB98A73cc64d5f71b92BEfD57c66E22D6724b",
    PositionRouter: "0xF72c3386f420d754FB6e8Bf70aC8AA1205F0A5eb",
    ReferralStorage: "0x99144a08937d5E8727e2C8FABc551f3E19c42c1C",
    ReferralReader: "0xe20395E5AB9ed2eD9691BB089eF9021204507cd6",
    PositionManager: "0x3408B48668a9FF760aCbFA7dfe9BAc9215A6Fc21",
    GrizzlyFaucet: "0x53f6807e32b8acA6d6d8EDCf9b24E63cC30d8dEf",
    NATIVE_TOKEN: "0x617d91847b74b70a3d3e3745445cb0d1b3c8560e",
  },
  [BSC]: {  //TEST FORK CONTRACTS
    Vault: "0x7bD86d286EC3613535B53F7B7aC9cFBfd3BCa549",
    Router: "0x218703d0515f24Ca3Fa0751266051Db1ecD58f27",
    VaultReader: "0x5f7881F6F06eF513243c3e2A062968255e465653",
    Reader: "0xABdAa623782d96eC2fA64b01Cd452cF99a76e59B",
    GllManager: "0x606E4922b259fe28c10e6731e8317705AA1e253B",
    RewardRouter: "0x2a3D06A340b2b2888891acb1f169E7C0e321fFaF",
    RewardReader: "0xd7e8901A49576b974EE65A474Fc459F5A96dce72",
    GLL: "0x63A8A929fA175667832329dee1Bc4c4922AfFe6d",
    USDG: "0x5979C5315625276ff99a56f95eE5cC44293e7b36",
    FeeGllTracker: "0x9a28a65b3a3a06e3da0fb285Cba50F10C08c8bF6",
    OrderBook: "0x4BaB8F3096A3Fb4A2EBcEb3965A1088B32EecDca",
    OrderExecutor: "0xf3Ef1c95aecf5B5025815014890dC14488599883",
    OrderBookReader: "0xf3Ef1c95aecf5B5025815014890dC14488599883",
    PositionRouter: "0x646AAfF875Bd16d2c3777F3F6e1599eEbf1e2137",
    ReferralStorage: "0xba397Cc36B14b1C86313b9D96211847682EFA15a",
    ReferralReader: "0xad75637664b12836634bF7E8F4249bC08d8D9bE2",
    PositionManager: "0xCc570Ec20eCB62cd9589FA33724514BDBc98DC7E",
    NATIVE_TOKEN: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },  
};

export function getContract(chainId, name){
  if (!CONTRACTS[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }

  if (!CONTRACTS[chainId][name]) {
    throw new Error(`Unknown contract "${name}" for chainId ${chainId}`);
  }

  return CONTRACTS[chainId][name];
}

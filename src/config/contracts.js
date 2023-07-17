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
  [BSC]: {
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

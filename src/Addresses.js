const CONTRACTS = {
  56: {
    // bsc
    Vault: "0x32848E2d3aeCFA7364595609FB050A301050A6B4",
    Router: "0xCA9c89410025F2bc3BeFb07CE57529F26ad69093",
    VaultReader: "0xa1Cc67170DF03aAbD5e39406e390Ef5AA2137BBb",
    Reader: "0x01dd8B434A83cbdDFa24f2ef1fe2D6920ca03734",
    GllManager: "0x13E733dDD6725a8133bec31b2Fc5994FA5c26Ea9",
    RewardRouter: "0x8991C17593A6fA3F9eA46E4A9fE87272921593B3",
    RewardReader: "0x398cAB94DEa3b44861E7Ad7eFCD23a6A35d57C3a",
    GLL: "0x9F4f8bc00F48663B7C204c96b932C29ccc43A2E8",
    USDG: "0x533403a3346cA31D67c380917ffaF185c24e7333",
    StakedGllTracker: "0xA6ca41Bbf555074ed4d041c1F4551eF48116D59A",
    FeeGllTracker: "0xaBD6c70C41FdF9261dfF15F4eB589b44a37072eB",
    StakedGllDistributor: "0xaf26dBF99bA3bBD758002a4BfB53762eaf1bd7F2",
    ReferralStorage: "0x2b27d228D1e6Db9b0A4dE299a0c749CA11E7f8aC",
    ReferralReader: "0x3444dF08aA9eBA2B49c7106C57aee3cb13c578fC",
    PositionManager: "0x3408B48668a9FF760aCbFA7dfe9BAc9215A6Fc21",
    OrderBook: "0x17B63682B3fE4E0DA1594623235cF047Bbc21c4B",
    OrderBookSwap: "0xCDcF17E15a8Fd5094e52D90b22AF53A051bd96a1",
    OrderBookReader: "0x05d08d133b1808Ca80f339c1E9CE7f8b9d006c16",
    PositionRouter: "0x5368Fa0120C2Ae88023dD4447E2c0f49E90E20eD",
    NftLocked : "0x2aa5d15eb36e5960d056e8fea6e7bb3e2a06a351",
    NATIVE_TOKEN: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
};


const tryRequire = (path) => {
  try {
    return require(`${path}`);
  } catch (err) {
    return undefined;
  }
};
const devAddresses = tryRequire("./development.Addresses.js");

export function getContract(chainId, name) {
  const contracts = process.env.NODE_ENV === "development" && devAddresses ? devAddresses.CONTRACTS : CONTRACTS;

  if (!contracts[chainId]) {
    throw new Error(`Unknown chainId ${chainId}`);
  }
  if (!contracts[chainId][name]) {
    throw new Error(`Unknown constant "${name}" for chainId ${chainId}`);
  }
  return contracts[chainId][name];
}

export const XGMT_EXCLUDED_ACCOUNTS = [
  "0x330eef6b9b1ea6edd620c825c9919dc8b611d5d5",
  "0xd9b1c23411adbb984b1c4be515fafc47a12898b2",
  "0xa633158288520807f91ccc98aa58e0ea43acb400",
  "0xffd0a93b4362052a336a7b22494f1b77018dd34b",
];



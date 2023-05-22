const CONTRACTS = {
  137: {
    // polygon
    Vault: "0x32848E2d3aeCFA7364595609FB050A301050A6B4",
    Router: "0xCA9c89410025F2bc3BeFb07CE57529F26ad69093",
    VaultReader: "0xa1Cc67170DF03aAbD5e39406e390Ef5AA2137BBb",
    Reader: "0x01dd8B434A83cbdDFa24f2ef1fe2D6920ca03734",
    MvlpManager: "0x13E733dDD6725a8133bec31b2Fc5994FA5c26Ea9",
    RewardRouter: "0x8991C17593A6fA3F9eA46E4A9fE87272921593B3",
    RewardReader: "0x398cAB94DEa3b44861E7Ad7eFCD23a6A35d57C3a",
    MVLP: "0x9F4f8bc00F48663B7C204c96b932C29ccc43A2E8",
    MVX: "0x2760e46d9bb43dafcbecaad1f64b93207f9f0ed7",
    ES_MVX: "0xd1b2f8DFF8437BE57430Ee98767d512F252ead61",
    BN_MVX: "0xB6BDd10A12286401C8DfaC93Fe933c7abBD6d0aF",
    USDM: "0x533403a3346cA31D67c380917ffaF185c24e7333",
    StakedMvxTracker: "0xE8e2E78D8cA52f238CAf69f020fA961f8A7632e9",
    BonusMvxTracker: "0x295818E13208d81c40E884Cc52720c45155Fdd93",
    FeeMvxTracker: "0xaCEC858f6397Dd227dD4ed5bE91A5BB180b8c430",
    StakedMvlpTracker: "0xA6ca41Bbf555074ed4d041c1F4551eF48116D59A",
    FeeMvlpTracker: "0xaBD6c70C41FdF9261dfF15F4eB589b44a37072eB",
    StakedMvxDistributor: "0xAeFE07f369FA46026CB27fB9d09eF59E913d6119",
    StakedMvlpDistributor: "0xaf26dBF99bA3bBD758002a4BfB53762eaf1bd7F2",
    MvxVester: "0x505B0ECAc7a2709C59DF1F7E7B21dbc7fB5f7DC6",
    MvlpVester: "0x041D005Ef436c41383AD9A36BC86Aee6cc526D07",
    ReferralStorage: "0x2b27d228D1e6Db9b0A4dE299a0c749CA11E7f8aC",
    ReferralReader: "0x3444dF08aA9eBA2B49c7106C57aee3cb13c578fC",
    PositionManager: "0x3408B48668a9FF760aCbFA7dfe9BAc9215A6Fc21",
    OrderBook: "0x17B63682B3fE4E0DA1594623235cF047Bbc21c4B",
    OrderBookSwap: "0xCDcF17E15a8Fd5094e52D90b22AF53A051bd96a1",
    OrderBookReader: "0x05d08d133b1808Ca80f339c1E9CE7f8b9d006c16",
    PositionRouter: "0x5368Fa0120C2Ae88023dD4447E2c0f49E90E20eD",
    UniswapMvxWethPool: "0xfb9caae5a5c0ab91f68542124c05d1efbb97d151",
    KyberMvxWethPool: "0x3063c9d40d4a84cc48bb9d5eda1c82d9fc05f05a",
    QuickMvxWethPool: "0xa649040d1a13376ac0c4bcccb587963fb7961095",
    SolidlyMvxWethPool: "0xe0be941ddB4B425f5E9E924Af202bdb4c8e3D791",
    Solidly2MvxWethPool: "0xAf6ebFc41e498C072372220aD30997e11478d8c1",    
    CelerBridgeMvxWethPool : "0x88dcdc47d2f83a99cf0000fdf667a468bb958a78",
    NftLocked : "0x2aa5d15eb36e5960d056e8fea6e7bb3e2a06a351",
    NATIVE_TOKEN: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
  324: {
    // zksync
    MVX: "0xC8Ac6191CDc9c7bF846AD6b52aaAA7a0757eE305",    
    MuteMvxWethPool: "0xff2c6230b241a5c183e8f42d3b1805a4acd9fb3e",
    VelocoreMvxWethPool: "0x3aaa323ebb537a68ded727247bcfac14dfa33577",
    CelerMvxWethPool: "0x54069e96c4247b37c2fbd9559ca99f08cd1cd66c",
    MvxDeployer: "0x4126Bb708458fe7C9126DD7854255F57ac3e1d67",
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

export const MVX_MULTISIG_ADDRESS = "0x203d15f68d594060c0eae4edecbd2ab124d6450c";
export const MVX_RESERVE_TIMELOCK = "0x1FDEb738E2b268a98FF743Cef4B1Af89068123dC";
export const MVD_TREASURY_ADDRESS = "0x4876e4303dad975effe107ba84598ce4a24724ed";
export const MVX_TEAM_VESTING_ADDRESS = "0x2445340A803339E6E307075dFf37D03Cb99bE15b";

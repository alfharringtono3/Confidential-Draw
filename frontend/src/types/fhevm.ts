/**
 * Zama FHE SDK 配置和类型定义 (UMD)
 */

// ============ 类型定义 ============

export interface EncryptedInput {
  add8(value: number): EncryptedInput;
  add16(value: number): EncryptedInput;
  add32(value: number): EncryptedInput;
  add64(value: bigint): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  addAddress(address: string): EncryptedInput;
  encrypt(): Promise<{
    handles: Uint8Array[];
    inputProof: Uint8Array;
  }>;
}

export interface Keypair {
  publicKey: string;
  privateKey: string;
}

interface EIP712 {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    UserDecryptRequestVerification: Array<{
      name: string;
      type: string;
    }>;
  };
  message: {
    publicKey: string;
    contractAddresses: string[];
    start: string;
    end: string;
  };
}

interface HandleContractPair {
  handle: Uint8Array | string;
  contractAddress: string;
}

export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  generateKeypair(): Keypair;
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: string,
    durationDays: string
  ): EIP712;
  userDecrypt(
    handleContractPairs: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: string,
    durationDays: string
  ): Promise<Record<string, number | boolean>>;
}

export interface FhevmConfig {
  network: any; // ethers provider or window.ethereum
  gatewayUrl?: string;
  relayerUrl?: string;
}

// UMD SDK 模块接口
export interface ZamaRelayerSDK {
  initSDK: () => Promise<void>;
  createInstance: (config: FhevmConfig) => Promise<FhevmInstance>;
  SepoliaConfig?: Partial<FhevmConfig>;
}

// 扩展 Window 接口 - UMD 全局对象
declare global {
  interface Window {
    ethereum?: any;
    // UMD 包导出的全局对象（可能的名称）
    zamaRelayerSDK?: ZamaRelayerSDK;
    relayerSDK?: ZamaRelayerSDK;
    ZamaRelayerSDK?: ZamaRelayerSDK;
    RelayerSDK?: ZamaRelayerSDK;
    // 向后兼容：直接挂载的函数
    initSDK?: () => Promise<void>;
    createInstance?: (config: FhevmConfig) => Promise<FhevmInstance>;
  }
}

// ============ 配置和工具函数 ============

// Sepolia 配置
export const SepoliaConfig: Partial<FhevmConfig> = {
  gatewayUrl: 'https://gateway.sepolia.zama.ai',
  relayerUrl: 'https://relayer.sepolia.zama.ai'
};

/**
 * 智能获取 UMD SDK 全局对象
 * UMD 包可能使用不同的全局变量名，此函数尝试所有可能的名称
 */
export const getSDK = (): ZamaRelayerSDK | null => {
  // 尝试不同的可能的全局变量名
  const possibleNames: (keyof Window)[] = [
    'zamaRelayerSDK',    // 官方 CDN 使用的名称
    'relayerSDK',        // 可能的替代名称
    'ZamaRelayerSDK',    // 大写版本
    'RelayerSDK'         // 大写版本
  ];
  
  for (const name of possibleNames) {
    const sdk = window[name];
    if (sdk && typeof sdk === 'object') {
      console.log(`✅ 找到 SDK 全局对象: window.${String(name)}`);
      console.log('SDK 对象:', sdk);
      console.log('initSDK 类型:', typeof (sdk as any).initSDK);
      console.log('createInstance 类型:', typeof (sdk as any).createInstance);
      return sdk as ZamaRelayerSDK;
    }
  }
  
  // 检查是否直接挂载到 window 上（向后兼容）
  if (typeof window.initSDK === 'function' && typeof window.createInstance === 'function') {
    console.log('✅ 找到直接挂载的 SDK 函数');
    return {
      initSDK: window.initSDK,
      createInstance: window.createInstance
    };
  }
  
  console.error('❌ 未找到 SDK 全局对象');
  console.log('所有可能的 SDK 相关全局变量:', 
    Object.keys(window).filter(k => 
      k.toLowerCase().includes('sdk') || 
      k.toLowerCase().includes('zama') ||
      k.toLowerCase().includes('relayer')
    )
  );
  
  return null;
};


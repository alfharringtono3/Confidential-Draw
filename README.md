# 🎰 Confidential Lottery - 机密抽奖 DApp

基于 FHEVM（全同态加密虚拟机）的去中心化隐私抽奖应用，实现完全透明且保护隐私的链上抽奖系统。
A decentralized privacy lottery application based on FHEVM to achieve a completely transparent and privacy-protected on-chain lottery system.


## 📋 项目简介

这是一个创新的区块链抽奖应用，使用 Zama 的 FHEVM 技术实现：
- ✅ **完全隐私**：用户选号和中奖号码在链上加密，无人可提前知晓
- ✅ **公平透明**：智能合约逻辑公开，抽奖过程完全去中心化
- ✅ **即时结算**：中奖结果实时计算并自动发放奖金
- ✅ **多语言支持**：支持中文、英文、日文三种界面语言

### 游戏规则

1. **购买彩票**：玩家选择 1-9 之间的幸运数字，支付 0.001 ETH
2. **开奖抽签**：合约生成 1-9 的随机中奖号码（链上加密）
3. **中奖结果**：号码匹配则中奖，获得 0.01 ETH 奖金（10倍收益）
4. **结果验证**：通过去中心化预言机解密结果，确保公平性

## 🏗️ 技术架构

### 后端（智能合约）

- **框架**：Hardhat v2.26.0
- **Solidity**：^0.8.24
- **核心技术**：
  - `@fhevm/solidity` - 全同态加密库
  - `@zama-fhe/oracle-solidity` - 去中心化解密预言机
  - TypeScript - 类型安全的开发环境

### 前端（Web DApp）

- **框架**：React 18 + TypeScript + Vite
- **Web3 集成**：ethers.js v6.9.0
- **UI 特性**：
  - 响应式设计（支持移动端和桌面端）
  - 实时步骤指示器
  - 多语言切换（中/英/日）
  - 现代化渐变 UI

### 智能合约核心功能

```solidity
// 主要合约：ConfidentialLottery.sol
- buyTicket() - 购买彩票（加密选号）
- drawLottery() - 执行开奖（生成加密中奖号）
- revealWinner() - 解密并结算中奖结果
- fundPrizePool() - 为奖池注入资金
```

## 📦 项目结构

```
fhevm-hardhat-template/
├── contracts/                    # 智能合约
│   ├── ConfidentialLottery.sol  # 机密抽奖主合约
│   └── FHECounter.sol           # FHEVM 示例合约
├── frontend/                     # React 前端应用
│   ├── src/
│   │   ├── App.tsx              # 主应用组件
│   │   ├── contract-abi.ts      # 合约 ABI
│   │   ├── i18n.ts              # 国际化配置
│   │   ├── types/               # TypeScript 类型定义
│   │   └── App.css              # 样式文件
│   ├── dist/                    # 构建输出
│   └── package.json
├── scripts/                      # 部署和测试脚本
│   ├── deploy-sepolia.ts        # Sepolia 部署脚本
│   └── check-result.ts          # 结果查询脚本
├── test/                         # 合约测试
│   ├── FHECounter.ts
│   └── FHECounterSepolia.ts
├── deploy/                       # 自动部署配置
│   └── deploy.ts
├── hardhat.config.ts            # Hardhat 配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- **Node.js**: ≥ 20.0.0
- **npm**: ≥ 7.0.0
- **MetaMask**: 浏览器钱包插件
- **网络**: Sepolia 测试网

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# Sepolia 测试网 RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY

# 部署私钥
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API Key（用于验证合约）
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. 编译合约

```bash
npm run compile
```

### 4. 部署合约到 Sepolia

```bash
npm run deploy:sepolia
```

部署后会显示合约地址，需要更新 `frontend/src/App.tsx` 中的 `CONTRACT_ADDRESS`。

### 5. 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:5173 即可使用应用。

### 6. 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 输出到 frontend/dist/
```

## 🎮 使用指南

### 用户操作流程

1. **连接钱包**
   - 点击"连接 MetaMask"按钮
   - 确保切换到 Sepolia 测试网
   - 授权连接

2. **选择幸运号码**
   - 使用滑块或输入框选择 1-9 的数字
   - 点击"购买彩票"按钮

3. **确认交易**
   - MetaMask 会弹出确认窗口
   - 支付 0.001 ETH + Gas 费
   - 等待交易确认

4. **开奖抽签**
   - 点击"执行开奖"按钮
   - 合约会生成加密的中奖号码
   - 等待开奖交易确认

5. **查看结果**
   - 应用自动触发解密流程
   - 等待预言机解密（约 1-2 分钟）
   - 显示中奖结果和号码

6. **领取奖金**
   - 如果中奖，点击"领取奖金"
   - 0.01 ETH 会自动转到你的钱包
   - 查看交易记录确认

### 合约管理员操作

```bash
# 为奖池注入资金
npx hardhat run scripts/fund-prize-pool.ts --network sepolia

# 提取合约盈余
npx hardhat run scripts/withdraw-profit.ts --network sepolia

# 查询合约状态
npx hardhat run scripts/check-result.ts --network sepolia
```

## 🔐 安全特性

### FHEVM 隐私保护

1. **选号加密**：用户选择的号码在前端使用 FHEVM SDK 加密
2. **链上计算**：所有比较和判断在加密状态下完成
3. **预言机解密**：只有在需要公开时才通过去中心化预言机解密
4. **访问控制**：只有合约和玩家本人可以解密结果

### 智能合约安全

- ✅ **重入攻击防护**：使用 Checks-Effects-Interactions 模式
- ✅ **金额验证**：严格检查支付金额和余额
- ✅ **状态机保护**：防止重复开奖和重复领奖
- ✅ **权限控制**：敏感操作仅限合约所有者

## 📊 合约数据

### 已部署的合约

- **网络**：Sepolia Testnet
- **合约地址**：`0x98002AB8529Df26C1ebC877D4ebDD1BfeA6Fd45d`
- **浏览器验证**：[Sepolia Etherscan](https://sepolia.etherscan.io/address/0x98002AB8529Df26C1ebC877D4ebDD1BfeA6Fd45d)

### 游戏参数

| 参数 | 值 |
|------|-----|
| 彩票价格 | 0.001 ETH |
| 中奖奖金 | 0.01 ETH |
| 号码范围 | 1-9 |
| 中奖概率 | 1/9 ≈ 11.11% |
| 预期收益率 | 111% (赔率 1:10) |

## 🧪 测试

### 运行本地测试

```bash
# 运行所有测试
npm run test

# 运行 Sepolia 测试
npm run test:sepolia

# 生成覆盖率报告
npm run coverage
```

### 测试覆盖

- ✅ 购买彩票流程
- ✅ 开奖和解密流程
- ✅ 中奖判定逻辑
- ✅ 奖金发放机制
- ✅ 错误处理和边界情况

## 🛠️ 开发工具

### 可用脚本

```bash
# 编译合约
npm run compile

# 清理构建文件
npm run clean

# 代码格式化
npm run prettier:write

# 代码检查
npm run lint

# 运行本地节点
npm run chain

# 部署到本地
npm run deploy:localhost

# 验证合约
npm run verify:sepolia
```

### 前端开发

```bash
cd frontend

# 开发模式（热重载）
npm run dev

# 类型检查
npm run build

# ESLint 检查
npm run lint
```

## 🌐 多语言支持

应用支持以下语言：

- 🇨🇳 **简体中文** (zh)
- 🇺🇸 **English** (en)
- 🇯🇵 **日本語** (ja)

语言切换按钮位于页面右上角，设置会保存在浏览器本地存储。

## 📝 技术亮点

### 1. FHEVM 全同态加密

```typescript
// 前端加密用户选号
const encryptedNumber = await fhevmInstance.encrypt8(luckyNumber)

// 后端加密处理
euint8 playerNumber = FHE.asEuint8(encryptedNumber)
euint8 winningNumber = FHE.randEuint8() % 9 + 1
ebool isWinner = FHE.eq(playerNumber, winningNumber)
```

### 2. 去中心化解密

使用 Zama 的预言机网络进行可验证的解密：

```solidity
// 请求解密中奖结果
function revealWinner(uint256 roundId) public {
    Round storage round = rounds[roundId];
    
    // 调用预言机解密
    uint256 requestId = requestDecryption(
        round.isWinner,
        this.handleDecryptionCallback.selector,
        roundId
    );
}
```

### 3. 自动化流程

前端使用 React Hooks 实现自动化步骤流程：

```typescript
useEffect(() => {
    if (currentStep === Step.INIT_CONTRACT && provider && signer) {
        initContract()
    }
    // ... 其他自动化步骤
}, [currentStep, provider, signer])
```

## 🐛 故障排查

### 常见问题

**Q: MetaMask 连接失败**
- 确保已安装 MetaMask 浏览器插件
- 检查是否已切换到 Sepolia 测试网
- 尝试刷新页面重新连接

**Q: 交易失败或 Gas 不足**
- 确保钱包有足够的 Sepolia ETH（需要 > 0.002 ETH）
- 可从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取测试币

**Q: 解密时间过长**
- 预言机解密通常需要 1-3 分钟
- 可在 Etherscan 查看交易状态
- 如果超过 5 分钟，可刷新页面重试

**Q: 合约地址不匹配**
- 检查 `frontend/src/App.tsx` 中的 `CONTRACT_ADDRESS`
- 确保与 Sepolia 部署的合约地址一致

## 📚 相关资源

- [FHEVM 官方文档](https://docs.zama.ai/fhevm)
- [Hardhat 文档](https://hardhat.org/docs)
- [React 文档](https://react.dev/)
- [ethers.js 文档](https://docs.ethers.org/v6/)
- [Sepolia 测试网](https://sepolia.dev/)

## 📄 许可证

BSD-3-Clause-Clear License

Copyright (c) 2024 Zama

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/zama-ai/fhevm-hardhat-template/issues)
- Discord: [Zama 社区](https://discord.gg/zama)

---

**⚠️ 免责声明**：本项目仅用于教育和演示目的，部署在测试网络上。请勿在主网上使用未经审计的智能合约处理真实资产。



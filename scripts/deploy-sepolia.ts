import { ethers } from "hardhat";

async function main() {
  console.log("开始部署 ConfidentialLottery 到 Sepolia...");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户地址:", deployer.address);
  
  // 查询账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");

  // 部署合约
  const ConfidentialLottery = await ethers.getContractFactory("ConfidentialLottery");
  console.log("正在部署合约...");
  
  const lottery = await ConfidentialLottery.deploy();
  await lottery.waitForDeployment();

  const contractAddress = await lottery.getAddress();
  console.log("✅ ConfidentialLottery 部署成功!");
  console.log("合约地址:", contractAddress);

  // 等待几个区块确认
  console.log("\n等待区块确认...");
  await lottery.deploymentTransaction()?.wait(5);
  console.log("✅ 已确认 5 个区块");

  // 验证部署
  console.log("\n部署信息:");
  console.log("- 网络: Sepolia");
  console.log("- 合约地址:", contractAddress);
  console.log("- 部署者:", deployer.address);
  console.log("- 交易哈希:", lottery.deploymentTransaction()?.hash);

  console.log("\n🎉 部署完成!");
  console.log("\n下一步:");
  console.log("1. 在 Etherscan 上验证合约:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  console.log("\n2. 测试合约功能:");
  console.log(`   npx hardhat run scripts/test-lottery.ts --network sepolia`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });




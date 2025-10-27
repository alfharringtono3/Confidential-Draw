import { ethers } from "hardhat";
import { createInstance } from "../test/instance";
import { getSigners } from "../test/signers";

async function main() {
  console.log("查询彩票结果...\n");

  const CONTRACT_ADDRESS = process.env.LOTTERY_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";
  const ROUND_ID = process.env.ROUND_ID || "0";

  if (CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ 错误: 请设置合约地址和回合ID!");
    console.log("使用方法:");
    console.log("  LOTTERY_ADDRESS=0x... ROUND_ID=0 npx hardhat run scripts/check-result.ts --network sepolia");
    process.exit(1);
  }

  const signers = await getSigners();
  const player = signers.alice;
  
  const lottery = await ethers.getContractAt("ConfidentialLottery", CONTRACT_ADDRESS);
  const instance = await createInstance();

  console.log("合约地址:", CONTRACT_ADDRESS);
  console.log("回合 ID:", ROUND_ID);
  console.log("查询账户:", player.address, "\n");

  try {
    // 获取回合信息
    const round = await lottery.rounds(ROUND_ID);
    
    console.log("📊 回合信息:");
    console.log("- 玩家:", round.player);
    console.log("- 是否已开奖:", round.isDrawn);
    console.log("- 彩票价格:", ethers.formatEther(round.ticketPrice), "ETH");
    console.log("- 购买时间:", new Date(Number(round.timestamp) * 1000).toLocaleString());

    if (!round.isDrawn) {
      console.log("\n⚠️  该回合尚未开奖");
      return;
    }

    console.log("\n🎲 解密中奖号码...");
    
    // 获取加密的中奖号码
    const encryptedWinningNumber = round.winningNumber;
    
    // 解密 (需要用户授权)
    const { publicKey, privateKey } = instance.generateKeypair();
    const eip712 = instance.createEIP712(publicKey, CONTRACT_ADDRESS);
    const signature = await player.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message
    );
    
    const winningNumber = await instance.reencrypt(
      encryptedWinningNumber,
      privateKey,
      publicKey,
      signature.replace("0x", ""),
      CONTRACT_ADDRESS,
      player.address
    );

    console.log("✅ 中奖号码:", winningNumber);

    // 检查是否中奖
    console.log("\n🔍 检查结果...");
    const isWinner = await lottery.connect(player).checkResult(ROUND_ID);
    
    if (isWinner) {
      console.log("🎉🎉🎉 恭喜中奖! 🎉🎉🎉");
      
      // 领奖
      console.log("\n💰 领取奖金...");
      const claimTx = await lottery.connect(player).claimPrize(ROUND_ID);
      const receipt = await claimTx.wait();
      console.log("✅ 奖金已到账! 交易哈希:", receipt?.hash);
      
      const prize = round.ticketPrice * 2n;
      console.log("奖金金额:", ethers.formatEther(prize), "ETH");
    } else {
      console.log("😢 很遗憾，未中奖");
      console.log("请再接再厉!");
    }

  } catch (error: any) {
    console.error("❌ 查询失败:", error.message);
    
    if (error.message.includes("Decryption")) {
      console.log("\n💡 提示: 解密可能尚未完成，请等待几分钟后重试");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




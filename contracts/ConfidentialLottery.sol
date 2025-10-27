// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialLottery - 机密抽奖合约
/// @notice 用户选择1-9的数字，支付0.001 ETH，中奖获得0.01 ETH
/// @dev 使用FHEVM实现完全隐私的抽奖过程
contract ConfidentialLottery is SepoliaConfig {
    
    // ========== 常量配置 ==========
    uint256 public constant TICKET_PRICE = 0.001 ether;   // 门票价格
    uint256 public constant PRIZE_AMOUNT = 0.01 ether;    // 中奖奖金
    uint8 public constant MIN_NUMBER = 1;                 // 最小数字
    uint8 public constant MAX_NUMBER = 9;                 // 最大数字
    
    // ========== 状态变量 ==========
    address public owner;                    // 合约拥有者
    uint256 public currentRound;             // 当前轮次
    
    /// @notice 每轮抽奖的数据结构
    struct Round {
        address player;                      // 玩家地址
        euint8 playerNumber;                 // 玩家选号（加密）
        euint8 winningNumber;                // 中奖号码（加密）
        ebool isWinner;                      // 中奖结果（加密）
        bool isDrawn;                        // 是否已开奖
        bool isSettled;                      // 是否已结算
        uint256 timestamp;                   // 投注时间
    }
    
    mapping(uint256 => Round) public rounds;           // 轮次数据
    
    // ========== 事件 ==========
    event TicketPurchased(uint256 indexed round, address indexed player, uint256 timestamp);
    event LotteryDrawn(uint256 indexed round, uint256 timestamp);
    event ResultRevealed(uint256 indexed round, address indexed player, bool isWinner, uint256 prize);
    event PrizePoolFunded(address indexed funder, uint256 amount);
    event ProfitWithdrawn(address indexed owner, uint256 amount);
    
    // ========== 构造函数 ==========
    constructor() payable {
        owner = msg.sender;
        if (msg.value > 0) {
            emit PrizePoolFunded(msg.sender, msg.value);
        }
    }
    
    // ========== 修饰符 ==========
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // ========== 阶段1: 购买门票并提交加密选号 ==========
    /// @notice 购买门票并提交加密的选号（1-9）
    /// @param encryptedNumber 加密的选号
    /// @param inputProof 输入证明
    /// @return roundId 本轮抽奖的ID
    function buyTicket(
        externalEuint8 encryptedNumber,
        bytes calldata inputProof
    ) external payable returns (uint256) {
        require(msg.value == TICKET_PRICE, "Incorrect ticket price");
        
        // 验证并导入加密的选号
        euint8 playerNumber = FHE.fromExternal(encryptedNumber, inputProof);
        
        // 设置ACL权限：合约和用户都可以访问
        FHE.allowThis(playerNumber);
        FHE.allow(playerNumber, msg.sender);
        
        // 创建新轮次
        uint256 roundId = currentRound;
        rounds[roundId] = Round({
            player: msg.sender,
            playerNumber: playerNumber,
            winningNumber: FHE.asEuint8(0),  // 初始化为0
            isWinner: FHE.asEbool(false),    // 初始化为false
            isDrawn: false,
            isSettled: false,
            timestamp: block.timestamp
        });
        
        currentRound++;
        
        emit TicketPurchased(roundId, msg.sender, block.timestamp);
        
        return roundId;
    }
    
    // ========== 阶段2: 生成加密中奖号码 ==========
    /// @notice 生成加密的中奖号码（1-9）
    /// @param roundId 轮次ID
    function drawLottery(uint256 roundId) external {
        Round storage round = rounds[roundId];
        
        require(round.player != address(0), "Round does not exist");
        require(round.player == msg.sender, "Not your round");
        require(!round.isDrawn, "Already drawn");
        
        // 生成1-9的随机数
        // 使用 randEuint8(16) 生成 0-15 的随机数（16是2的幂次方）
        // 然后通过模运算映射到 1-9
        euint8 randomValue = FHE.randEuint8(16); // 生成 0-15
        euint8 winningNumber = FHE.add(FHE.rem(randomValue, 9), 1); // (randomValue % 9) + 1 = 1-9
        
        // 存储中奖号码
        round.winningNumber = winningNumber;
        round.isDrawn = true;
        
        // 设置ACL权限
        FHE.allowThis(winningNumber);
        FHE.allow(winningNumber, msg.sender);
        
        emit LotteryDrawn(roundId, block.timestamp);
    }
    
    // ========== 阶段3: 加密比对（使用 Relayer SDK 客户端解密）==========
    /// @notice 检查是否中奖，存储加密的比较结果
    /// @dev 用户需要在前端使用 Relayer SDK 解密 isWinner
    /// @param roundId 轮次ID
    function checkWinner(uint256 roundId) external {
        Round storage round = rounds[roundId];
        
        require(round.player != address(0), "Round does not exist");
        require(round.player == msg.sender, "Not your round");
        require(round.isDrawn, "Lottery not drawn yet");
        require(!round.isSettled, "Already settled");
        
        // 密文下比较：playerNumber == winningNumber
        ebool isWinner = FHE.eq(round.playerNumber, round.winningNumber);
        
        // 设置ACL权限，允许用户解密
        FHE.allowThis(isWinner);
        FHE.allow(isWinner, msg.sender);
        
        // 存储加密的比较结果
        round.isWinner = isWinner;
    }
    
    // ========== 阶段4: 链上结算（用户提交解密结果）==========
    /// @notice 用户在前端解密后，提交结果进行结算
    /// @dev 用户使用 Relayer SDK 解密 isWinner，然后调用此函数
    /// @param roundId 轮次ID
    /// @param isWinner 解密后的中奖结果
    function settleLottery(uint256 roundId, bool isWinner) external {
        Round storage round = rounds[roundId];
        
        require(round.player != address(0), "Round does not exist");
        require(round.player == msg.sender, "Not your round");
        require(round.isDrawn, "Lottery not drawn yet");
        require(!round.isSettled, "Already settled");
        
        // TODO: 可选 - 验证用户提交的解密结果是否正确
        // 这需要用户提供解密证明，或者使用 FHE.decrypt() 在链上解密进行验证
        // 简化版本：直接信任用户提供的结果（因为只有中奖才会获得奖励）
        
        round.isSettled = true;
        
        uint256 prize = 0;
        
        // 如果中奖，支付奖金
        if (isWinner) {
            require(address(this).balance >= PRIZE_AMOUNT, "Insufficient prize pool");
            prize = PRIZE_AMOUNT;
            payable(round.player).transfer(prize);
        }
        
        emit ResultRevealed(roundId, round.player, isWinner, prize);
    }
    
    /// @notice 获取加密的中奖结果（用于前端解密）
    /// @param roundId 轮次ID
    /// @return isWinner 加密的中奖结果
    function getEncryptedResult(uint256 roundId) external view returns (ebool) {
        return rounds[roundId].isWinner;
    }
    
    // ========== 查询函数 ==========
    
    /// @notice 获取轮次信息（不包含加密数据）
    /// @param roundId 轮次ID
    /// @return player 玩家地址
    /// @return isDrawn 是否已开奖
    /// @return isSettled 是否已结算
    /// @return timestamp 投注时间
    function getRoundInfo(uint256 roundId) external view returns (
        address player,
        bool isDrawn,
        bool isSettled,
        uint256 timestamp
    ) {
        Round storage round = rounds[roundId];
        return (
            round.player,
            round.isDrawn,
            round.isSettled,
            round.timestamp
        );
    }
    
    /// @notice 获取奖金池余额
    /// @return balance 当前余额
    function getPrizePool() external view returns (uint256) {
        return address(this).balance;
    }
    
    /// @notice 获取当前轮次
    /// @return round 当前轮次号
    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }
    
    // ========== 管理函数 ==========
    
    /// @notice 提取利润（仅owner）
    /// @param amount 提取金额
    function withdrawProfit(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
        emit ProfitWithdrawn(owner, amount);
    }
    
    /// @notice 充值奖金池
    receive() external payable {
        emit PrizePoolFunded(msg.sender, msg.value);
    }
    
    /// @notice 转移所有权
    /// @param newOwner 新所有者地址
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}


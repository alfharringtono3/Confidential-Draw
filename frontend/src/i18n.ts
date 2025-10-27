// 多语言配置文件

export type Language = 'zh' | 'en'

export interface Translations {
  // 标题和副标题
  title: string
  subtitle: string
  
  // 钱包和合约信息
  walletAddress: string
  accountBalance: string
  contractPool: string
  ticketPrice: string
  
  // 步骤标题
  connectWallet: string
  selectNumber: string
  drawLottery: string
  checkWinner: string
  decryptResult: string
  showResult: string
  gameCompleted: string
  
  // 按钮文本
  connectMetaMask: string
  buyTicket: string
  startDraw: string
  checkResult: string
  startDecrypt: string
  claimPrize: string
  confirmSettle: string
  playAgain: string
  switchToSepolia: string
  cancel: string
  
  // 描述文本
  connectWalletDesc: string
  selectNumberDesc: string
  drawLotteryDesc: string
  checkWinnerDesc: string
  decryptDesc: string
  decryptWarning: string
  
  // 结果显示
  congratulations: string
  notWinner: string
  yourNumber: string
  winningNumber: string
  numberMatch: string
  numberNotMatch: string
  prizeAwarded: string
  gameEnded: string
  tryAgain: string
  
  // 回合信息
  roundId: string
  yourLuckyNumber: string
  
  // 状态信息
  connecting: string
  processing: string
  drawing: string
  checking: string
  decrypting: string
  
  // 流程状态
  statusConnectingWallet: string
  statusInitContract: string
  statusEncryptNumber: string
  statusBuyTicket: string
  statusGetRound: string
  statusDrawLottery: string
  statusCheckWinner: string
  statusGetRoundInfo: string
  statusDecryptResult: string
  statusSettle: string
  
  // 进度文本
  step: string
  
  // 错误和警告
  networkError: string
  networkErrorDesc: string
  wrongNetwork: string
  
  // VS 文本
  vs: string
}

export const translations: Record<Language, Translations> = {
  zh: {
    title: '保密彩票',
    subtitle: '基于 FHEVM 的完全隐私彩票系统',
    
    walletAddress: '钱包地址',
    accountBalance: '账户余额',
    contractPool: '合约奖池',
    ticketPrice: '彩票价格',
    
    connectWallet: '连接钱包',
    selectNumber: '选择你的幸运号码',
    drawLottery: '准备开奖',
    checkWinner: '检查中奖结果',
    decryptResult: '解密结果',
    showResult: '开奖结果',
    gameCompleted: '游戏完成',
    
    connectMetaMask: '🦊 连接 MetaMask',
    buyTicket: '🎫 购买彩票',
    startDraw: '🎰 开始开奖',
    checkResult: '🔍 检查中奖结果',
    startDecrypt: '🔓 开始解密',
    claimPrize: '💰 领取奖金',
    confirmSettle: '✅ 确认结算',
    playAgain: '🔄 再玩一次',
    switchToSepolia: '🔄 切换到 Sepolia',
    cancel: '取消',
    
    connectWalletDesc: '请先连接你的 MetaMask 钱包到 Sepolia 测试网',
    selectNumberDesc: '选择 1-9 之间的数字，中奖概率 11.11%',
    drawLotteryDesc: '开奖已完成，现在检查你是否中奖',
    checkWinnerDesc: '开奖已完成，现在检查你是否中奖',
    decryptDesc: '正在解密中奖号码和结果...',
    decryptWarning: '⏳ 解密可能需要 2-5 分钟，请耐心等待',
    
    congratulations: '🎉 恭喜中奖！',
    notWinner: '😢 未中奖',
    yourNumber: '你的号码',
    winningNumber: '中奖号码',
    numberMatch: '✅ 号码匹配！',
    numberNotMatch: '❌ 号码不匹配',
    prizeAwarded: '奖金已发送到你的钱包',
    gameEnded: '本轮游戏已结束',
    tryAgain: '💪 不要灰心，再试一次！',
    
    roundId: '回合 ID:',
    yourLuckyNumber: '你的幸运号码:',
    
    connecting: '连接中...',
    processing: '处理中...',
    drawing: '开奖中...',
    checking: '检查中...',
    decrypting: '解密中...',
    
    statusConnectingWallet: '正在连接 MetaMask 钱包...',
    statusInitContract: '正在初始化合约和 FHE 实例...',
    statusEncryptNumber: '正在加密你的幸运号码',
    statusBuyTicket: '正在发送购票交易，请确认 MetaMask...',
    statusGetRound: '正在获取回合信息...',
    statusDrawLottery: '正在开奖，生成随机中奖号码...',
    statusCheckWinner: '正在检查中奖结果...',
    statusGetRoundInfo: '正在获取回合数据...',
    statusDecryptResult: '正在解密中奖结果（可能需要 2-5 分钟）...',
    statusSettle: '正在发放奖金...',
    
    step: '步骤',
    
    networkError: '⚠️ 网络错误',
    networkErrorDesc: '本应用仅支持 Sepolia 网络，请切换网络后继续。',
    wrongNetwork: '检测到您当前不在',
    
    vs: 'VS',
  },
  
  en: {
    title: 'Confidential Lottery',
    subtitle: 'Fully Private Lottery System Based on FHEVM',
    
    walletAddress: 'Wallet Address',
    accountBalance: 'Account Balance',
    contractPool: 'Contract Pool',
    ticketPrice: 'Ticket Price',
    
    connectWallet: 'Connect Wallet',
    selectNumber: 'Select Your Lucky Number',
    drawLottery: 'Ready to Draw',
    checkWinner: 'Check Result',
    decryptResult: 'Decrypt Result',
    showResult: 'Draw Result',
    gameCompleted: 'Game Completed',
    
    connectMetaMask: '🦊 Connect MetaMask',
    buyTicket: '🎫 Buy Ticket',
    startDraw: '🎰 Start Draw',
    checkResult: '🔍 Check Result',
    startDecrypt: '🔓 Start Decrypt',
    claimPrize: '💰 Claim Prize',
    confirmSettle: '✅ Confirm Settle',
    playAgain: '🔄 Play Again',
    switchToSepolia: '🔄 Switch to Sepolia',
    cancel: 'Cancel',
    
    connectWalletDesc: 'Please connect your MetaMask wallet to Sepolia testnet',
    selectNumberDesc: 'Choose a number between 1-9, winning probability 11.11%',
    drawLotteryDesc: 'Drawing completed, now check if you won',
    checkWinnerDesc: 'Drawing completed, now check if you won',
    decryptDesc: 'Decrypting winning number and result...',
    decryptWarning: '⏳ Decryption may take 2-5 minutes, please be patient',
    
    congratulations: '🎉 Congratulations!',
    notWinner: '😢 Not Winner',
    yourNumber: 'Your Number',
    winningNumber: 'Winning Number',
    numberMatch: '✅ Number Match!',
    numberNotMatch: '❌ Number Not Match',
    prizeAwarded: 'Prize sent to your wallet',
    gameEnded: 'Game ended',
    tryAgain: '💪 Don\'t give up, try again!',
    
    roundId: 'Round ID:',
    yourLuckyNumber: 'Your Lucky Number:',
    
    connecting: 'Connecting...',
    processing: 'Processing...',
    drawing: 'Drawing...',
    checking: 'Checking...',
    decrypting: 'Decrypting...',
    
    statusConnectingWallet: 'Connecting to MetaMask wallet...',
    statusInitContract: 'Initializing contract and FHE instance...',
    statusEncryptNumber: 'Encrypting your lucky number',
    statusBuyTicket: 'Sending ticket purchase transaction, please confirm MetaMask...',
    statusGetRound: 'Getting round information...',
    statusDrawLottery: 'Drawing lottery, generating random winning number...',
    statusCheckWinner: 'Checking winning result...',
    statusGetRoundInfo: 'Getting round data...',
    statusDecryptResult: 'Decrypting result (may take 2-5 minutes)...',
    statusSettle: 'Distributing prize...',
    
    step: 'Step',
    
    networkError: '⚠️ Network Error',
    networkErrorDesc: 'This app only supports Sepolia network, please switch network to continue.',
    wrongNetwork: 'Detected that you are not on',
    
    vs: 'VS',
  }
}

export const getTranslation = (lang: Language): Translations => {
  return translations[lang]
}


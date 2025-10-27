import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import type { FhevmInstance } from './types/fhevm.d.ts'
import { SepoliaConfig, getSDK } from './types/fhevm.ts'
import './App.css'
import { CONTRACT_ABI } from './contract-abi'
import { Language, getTranslation } from './i18n'

// 合约地址
const CONTRACT_ADDRESS = "0x98002AB8529Df26C1ebC877D4ebDD1BfeA6Fd45d"

// Sepolia 网络配置
const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111 in hex

// 步骤枚举
enum Step {
  CONNECT_WALLET = 0,
  INIT_CONTRACT = 1,
  SELECT_NUMBER = 2,
  ENCRYPT_NUMBER = 3,
  BUY_TICKET = 4,
  GET_ROUND = 5,
  DRAW_LOTTERY = 6,
  CHECK_WINNER = 7,
  GET_ROUND_INFO = 8,
  DECRYPT_RESULT = 9,
  SHOW_RESULT = 10,
  SETTLE = 11,
  COMPLETED = 12
}

function App() {
  // 钱包和合约状态
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null)
  
  // 合约信息
  const [contractBalance, setContractBalance] = useState<string>('0')
  const [ticketPrice, setTicketPrice] = useState<string>('0')
  const [prizeAmount, setPrizeAmount] = useState<string>('0')
  
  // 用户操作
  const [luckyNumber, setLuckyNumber] = useState<number>(1)
  const [myRoundId, setMyRoundId] = useState<bigint | null>(null)
  
  // 解密结果
  const [winningNumber, setWinningNumber] = useState<number | null>(null)
  const [isWinner, setIsWinner] = useState<boolean | null>(null)
  
  // UI 状态
  const [currentStep, setCurrentStep] = useState<Step>(Step.CONNECT_WALLET)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [showNetworkModal, setShowNetworkModal] = useState<boolean>(false)
  
  // 语言设置
  const [language, setLanguage] = useState<Language>('zh')
  const t = getTranslation(language)

  // 添加日志（在开发模式下记录到控制台）
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📝'
    const logMessage = `[${timestamp}] ${prefix} ${message}`
    
    // 在开发环境下输出到控制台
    if (type === 'error') {
      console.error(logMessage)
    } else if (type === 'warning') {
      console.warn(logMessage)
    } else {
      console.log(logMessage)
    }
  }

  // 切换到 Sepolia 网络
  const switchToSepolia = async () => {
    if (!window.ethereum) {
      setError('未检测到 MetaMask')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      })
      
      setShowNetworkModal(false)
      addLog('已切换到 Sepolia 网络', 'success')
      // 等待网络切换完成后重新连接
      setTimeout(() => {
        connectWallet()
      }, 500)
    } catch (switchError: any) {
      // 如果网络不存在（错误码 4902），尝试添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }],
          })
          setShowNetworkModal(false)
          addLog('Sepolia 网络已添加并切换', 'success')
          setTimeout(() => {
            connectWallet()
          }, 500)
        } catch (addError: any) {
          setError('添加 Sepolia 网络失败: ' + addError.message)
          addLog('添加 Sepolia 网络失败', 'error')
        }
      } else {
        setError('切换网络失败: ' + switchError.message)
        addLog('切换网络失败', 'error')
      }
    }
  }

  // 步骤 1: 连接钱包
  const connectWallet = async () => {
    try {
      setLoading(true)
      setError('')
      addLog('正在连接 MetaMask 钱包...')

      if (!window.ethereum) {
        throw new Error('请先安装 MetaMask!')
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      await browserProvider.send('eth_requestAccounts', [])
      const walletSigner = await browserProvider.getSigner()
      const walletAddress = await walletSigner.getAddress()
      const walletBalance = await browserProvider.getBalance(walletAddress)

      // 检查网络
      const network = await browserProvider.getNetwork()
      if (network.chainId !== 11155111n) {
        addLog(`当前网络: Chain ID ${network.chainId}`, 'warning')
        addLog('请切换到 Sepolia 测试网络', 'warning')
        setShowNetworkModal(true)
        setLoading(false)
        return
      }

      setProvider(browserProvider)
      setSigner(walletSigner)
      setAddress(walletAddress)
      setBalance(ethers.formatEther(walletBalance))

      addLog(`钱包已连接: ${walletAddress}`, 'success')
      addLog(`账户余额: ${ethers.formatEther(walletBalance)} ETH`, 'info')

      if (walletBalance < ethers.parseEther('0.01')) {
        addLog('余额可能不足，建议至少有 0.01 ETH', 'warning')
      }

      setCurrentStep(Step.INIT_CONTRACT)
    } catch (err: any) {
      setError(err.message)
      addLog(`连接失败: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 步骤 2: 初始化合约
  const initContract = async () => {
    try {
      setLoading(true)
      setError('')
      addLog('正在初始化彩票合约...')

      if (!provider || !signer) {
        throw new Error('请先连接钱包')
      }

      const lotteryContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      setContract(lotteryContract)

      addLog(`合约地址: ${CONTRACT_ADDRESS}`, 'info')

      // 获取合约信息
      const balance = await provider.getBalance(CONTRACT_ADDRESS)
      const price = await lotteryContract.TICKET_PRICE()
      const prize = await lotteryContract.PRIZE_AMOUNT()

      setContractBalance(ethers.formatEther(balance))
      setTicketPrice(ethers.formatEther(price))
      setPrizeAmount(ethers.formatEther(prize))

      addLog(`合约奖池余额: ${ethers.formatEther(balance)} ETH`, 'info')
      addLog(`彩票价格: ${ethers.formatEther(price)} ETH`, 'info')
      addLog(`中奖奖金: ${ethers.formatEther(prize)} ETH`, 'info')

      if (balance < prize) {
        addLog('警告: 合约奖池不足以支付奖金!', 'warning')
      }

      // 初始化 FHE 实例 (UMD 方式)
      addLog('正在加载 FHE WASM 模块...', 'info')
      
      // 智能获取 SDK 全局对象
      console.log('=== FHE SDK 加载检查 ===')
      const sdk = getSDK()
      
      if (!sdk) {
        throw new Error('FHE SDK 未加载，请检查 index.html 中的 UMD 脚本标签，然后刷新页面重试')
      }
      
      if (!sdk.initSDK || typeof sdk.initSDK !== 'function') {
        console.error('❌ SDK.initSDK 不是函数！', sdk)
        addLog(`SDK.initSDK 类型: ${typeof sdk.initSDK}`, 'error')
        throw new Error('SDK 对象不完整：initSDK 方法不存在')
      }
      
      if (!sdk.createInstance || typeof sdk.createInstance !== 'function') {
        console.error('❌ SDK.createInstance 不是函数！', sdk)
        addLog(`SDK.createInstance 类型: ${typeof sdk.createInstance}`, 'error')
        throw new Error('SDK 对象不完整：createInstance 方法不存在')
      }
      
      console.log('✅ FHE SDK 对象检查通过')
      addLog('SDK 对象检查通过', 'success')
      
      // 调用 initSDK
      console.log('⏳ 开始调用 SDK.initSDK()...')
      try {
        await sdk.initSDK()
        console.log('✅ SDK.initSDK() 成功')
        addLog('WASM 模块加载成功', 'success')
      } catch (sdkErr: any) {
        console.error('❌ SDK.initSDK() 失败:', sdkErr)
        addLog(`initSDK 失败: ${sdkErr.message}`, 'error')
        throw sdkErr
      }
      
      // 创建实例
      addLog('正在创建 FHE 实例...', 'info')
      
      // 使用 SDK 自带的 SepoliaConfig 或我们自己的配置
      const sdkConfig = sdk.SepoliaConfig || SepoliaConfig
      const config = { 
        ...sdkConfig, 
        network: window.ethereum 
      }
      console.log('⏳ FHE 实例配置:', config)
      
      try {
        const instance = await sdk.createInstance(config)
        console.log('✅ FHE 实例创建成功:', instance)
        setFhevmInstance(instance)
        addLog('FHE 实例创建成功', 'success')
      } catch (instanceErr: any) {
        console.error('❌ createInstance 失败:', instanceErr)
        addLog(`createInstance 失败: ${instanceErr.message}`, 'error')
        throw instanceErr
      }

      setCurrentStep(Step.SELECT_NUMBER)
      addLog('初始化完成，请选择你的幸运号码!', 'success')
    } catch (err: any) {
      setError(err.message)
      addLog(`初始化失败: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 步骤 3-6: 购买彩票
  const buyTicket = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!fhevmInstance || !contract || !signer || !address) {
        throw new Error('请先完成初始化')
      }

      // 步骤 3: 加密幸运号码
      setCurrentStep(Step.ENCRYPT_NUMBER)
      addLog(`正在加密你的幸运号码: ${luckyNumber}`, 'info')
      
      const encryptedInput = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address)
      const encrypted = await encryptedInput.add8(luckyNumber).encrypt()
      const encryptedHandle = encrypted.handles[0]
      const inputProof = encrypted.inputProof
      
      addLog('加密完成!', 'success')
      addLog(`加密句柄: ${ethers.hexlify(encryptedHandle).substring(0, 20)}...`, 'info')

      // 步骤 4: 购买彩票
      setCurrentStep(Step.BUY_TICKET)
      addLog('正在发送购票交易...', 'info')
      
      const price = await contract.TICKET_PRICE()
      const buyTx = await contract.buyTicket(encryptedHandle, inputProof, { value: price })
      
      addLog(`交易已发送: ${buyTx.hash}`, 'info')
      addLog(`浏览器: https://sepolia.etherscan.io/tx/${buyTx.hash}`, 'info')
      
      const buyReceipt = await buyTx.wait()
      addLog(`购票成功! 区块: ${buyReceipt?.blockNumber}`, 'success')

      // 步骤 5: 获取回合 ID
      setCurrentStep(Step.GET_ROUND)
      const nextRound = await contract.currentRound()
      const roundId = nextRound - 1n
      setMyRoundId(roundId)
      
      addLog(`你的回合 ID: ${roundId.toString()}`, 'success')
      
      setCurrentStep(Step.DRAW_LOTTERY)
    } catch (err: any) {
      setError(err.message)
      addLog(`购票失败: ${err.message}`, 'error')
      setCurrentStep(Step.SELECT_NUMBER)
    } finally {
      setLoading(false)
    }
  }

  // 步骤 6: 开奖
  const drawLottery = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!contract || !myRoundId) {
        throw new Error('请先购买彩票')
      }

      addLog(`正在开奖 (回合 ${myRoundId})...`, 'info')
      
      const drawTx = await contract.drawLottery(myRoundId)
      addLog(`开奖交易已发送: ${drawTx.hash}`, 'info')
      
      const drawReceipt = await drawTx.wait()
      addLog(`开奖成功! 区块: ${drawReceipt?.blockNumber}`, 'success')
      addLog('中奖号码已生成 (加密状态)', 'info')
      
      setCurrentStep(Step.CHECK_WINNER)
    } catch (err: any) {
      setError(err.message)
      addLog(`开奖失败: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 步骤 7: 检查中奖结果
  const checkWinner = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!contract || !myRoundId) {
        throw new Error('请先开奖')
      }

      addLog('正在检查中奖结果...', 'info')
      
      const checkTx = await contract.checkWinner(myRoundId)
      addLog(`检查交易已发送: ${checkTx.hash}`, 'info')
      
      const checkReceipt = await checkTx.wait()
      addLog(`比较完成! 区块: ${checkReceipt?.blockNumber}`, 'success')
      addLog('结果已加密存储，准备解密...', 'info')
      
      setCurrentStep(Step.GET_ROUND_INFO)
    } catch (err: any) {
      setError(err.message)
      addLog(`检查失败: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 步骤 8-10: 解密结果
  const decryptResult = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!contract || !fhevmInstance || !signer || !address || !myRoundId) {
        throw new Error('请先完成前面的步骤')
      }

      setCurrentStep(Step.GET_ROUND_INFO)
      addLog('正在获取回合信息...', 'info')
      
      const round = await contract.rounds(myRoundId)
      addLog(`玩家地址: ${round.player}`, 'info')
      addLog(`是否已开奖: ${round.isDrawn ? '是' : '否'}`, 'info')
      addLog(`是否已结算: ${round.isSettled ? '是' : '否'}`, 'info')

      setCurrentStep(Step.DECRYPT_RESULT)
      addLog('开始解密过程...', 'info')
      addLog('注意: 解密可能需要 2-5 分钟，请耐心等待...', 'warning')

      // 生成密钥对
      addLog('生成用户密钥对...', 'info')
      const keypair = fhevmInstance.generateKeypair()
      addLog('密钥对生成成功', 'success')

      // 准备解密参数
      const startTimestamp = Math.floor(Date.now() / 1000).toString()
      const durationDays = '30'
      const contractAddresses = [CONTRACT_ADDRESS]

      // 创建 EIP712 签名
      addLog('创建 EIP712 签名...', 'info')
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      )

      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      )
      addLog('签名成功', 'success')

      // 解密中奖号码
      addLog('解密中奖号码...', 'info')
      const encryptedWinningNumber = round.winningNumber

      // 调试信息
      console.log('🔍 解密参数调试:')
      console.log('  - encryptedWinningNumber:', encryptedWinningNumber)
      console.log('  - contractAddresses:', contractAddresses)
      console.log('  - contractAddresses 是数组?', Array.isArray(contractAddresses))
      console.log('  - address:', address)
      console.log('  - startTimestamp:', startTimestamp)
      console.log('  - durationDays:', durationDays)

      // 注意：根据官方文档，handle 必须是字符串格式（十六进制）
      const handleContractPairsWinning = [{
        handle: '0x' + encryptedWinningNumber.toString(16),
        contractAddress: CONTRACT_ADDRESS
      }]

      const handleStr = '0x' + encryptedWinningNumber.toString(16)
      console.log('  - handleContractPairsWinning handle (原始BigInt):', encryptedWinningNumber.toString())
      console.log('  - handleContractPairsWinning handle (转换后):', handleStr)
      console.log('  - handleContractPairsWinning handle 类型:', typeof handleStr)
      console.log('  - handleContractPairsWinning contractAddress:', CONTRACT_ADDRESS)
      console.log('  - keypair.publicKey 类型:', typeof keypair.publicKey, '长度:', keypair.publicKey.length)
      console.log('  - keypair.privateKey 类型:', typeof keypair.privateKey, '长度:', keypair.privateKey.length)
      console.log('  - signature 类型:', typeof signature, '长度:', signature.replace('0x', '').length)
      console.log('  - startTimestamp 类型:', typeof startTimestamp, '值:', startTimestamp)
      console.log('  - durationDays 类型:', typeof durationDays, '值:', durationDays)
      console.log('  - address 类型:', typeof address, '值:', address)
      console.log('  - contractAddresses 类型:', typeof contractAddresses, '是数组?', Array.isArray(contractAddresses))
      console.log('  - fhevmInstance.userDecrypt 类型:', typeof fhevmInstance.userDecrypt)

      console.log('\n⏳ 开始调用 fhevmInstance.userDecrypt()...')
      
      let winningNumberResults
      try {
        winningNumberResults = await fhevmInstance.userDecrypt(
          handleContractPairsWinning,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          address,
          startTimestamp,
          durationDays
        )
        console.log('✅ userDecrypt 调用成功')
      } catch (decryptErr: any) {
        console.error('❌ userDecrypt 调用失败:', decryptErr)
        console.error('   错误消息:', decryptErr.message)
        console.error('   错误类型:', decryptErr.name)
        throw decryptErr
      }

      // 使用十六进制字符串作为 key 来获取解密结果
      const decryptedWinningNumber = Number(winningNumberResults[handleStr])
      setWinningNumber(decryptedWinningNumber)
      addLog(`中奖号码解密成功: ${decryptedWinningNumber}`, 'success')

      // 解密中奖结果
      addLog('解密中奖结果...', 'info')
      const encryptedIsWinner = round.isWinner
      const handleStrWinner = '0x' + encryptedIsWinner.toString(16)

      const handleContractPairsWinner = [{
        handle: handleStrWinner,
        contractAddress: CONTRACT_ADDRESS
      }]

      const isWinnerResults = await fhevmInstance.userDecrypt(
        handleContractPairsWinner,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays
      )

      const decryptedIsWinner = Boolean(isWinnerResults[handleStrWinner])
      setIsWinner(decryptedIsWinner)
      addLog(`中奖结果解密成功: ${decryptedIsWinner ? '中奖 🎉' : '未中奖 😢'}`, 'success')

      setCurrentStep(Step.SHOW_RESULT)
    } catch (err: any) {
      console.error('❌ 解密错误详情:')
      console.error('  - 错误消息:', err.message)
      console.error('  - 错误类型:', err.name)
      console.error('  - 完整错误:', err)
      if (err.stack) {
        console.error('  - 错误堆栈:', err.stack)
      }

      if (err.message.includes('not ready') || err.message.includes('pending')) {
        addLog('解密尚未完成，这是正常的!', 'warning')
        addLog('FHE 解密需要通过 Relayer 完成，通常需要 2-5 分钟', 'info')
        addLog('请稍后刷新页面重试', 'info')
      } else if (err.message.includes('reduce') || err.message.includes('is not a function')) {
        addLog(`解密失败: ${err.message}`, 'error')
        addLog('可能是 SDK 参数格式问题，请查看控制台详细日志', 'error')
        setError(`SDK 错误: ${err.message}`)
      } else {
        setError(err.message)
        addLog(`解密失败: ${err.message}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // 步骤 11: 结算
  const settleLottery = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!contract || !myRoundId || isWinner === null) {
        throw new Error('请先完成解密')
      }

      setCurrentStep(Step.SETTLE)
      
      if (isWinner) {
        addLog('准备领取奖金...', 'info')
        addLog(`奖金金额: ${prizeAmount} ETH`, 'info')
      } else {
        addLog('准备结算...', 'info')
      }

      const settleTx = await contract.settleLottery(myRoundId, isWinner)
      addLog(`结算交易已发送: ${settleTx.hash}`, 'info')
      addLog(`浏览器: https://sepolia.etherscan.io/tx/${settleTx.hash}`, 'info')
      
      const settleReceipt = await settleTx.wait()
      
      if (isWinner) {
        addLog(`领奖成功! 区块: ${settleReceipt?.blockNumber}`, 'success')
        addLog(`恭喜获得 ${prizeAmount} ETH!`, 'success')
      } else {
        addLog(`结算完成! 区块: ${settleReceipt?.blockNumber}`, 'success')
      }

      setCurrentStep(Step.COMPLETED)
    } catch (err: any) {
      setError(err.message)
      addLog(`结算失败: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 重新开始
  const resetGame = () => {
    setMyRoundId(null)
    setWinningNumber(null)
    setIsWinner(null)
    setLuckyNumber(1)
    setCurrentStep(Step.SELECT_NUMBER)
    setError('')
    addLog('游戏已重置，请选择新的幸运号码!', 'info')
  }

  // 自动执行步骤
  useEffect(() => {
    if (currentStep === Step.INIT_CONTRACT && provider && signer) {
      initContract()
    }
  }, [currentStep, provider, signer])

  // 获取当前步骤的状态描述
  const getStepStatus = () => {
    if (!loading) return null
    
    switch (currentStep) {
      case Step.CONNECT_WALLET:
        return t.statusConnectingWallet
      case Step.INIT_CONTRACT:
        return t.statusInitContract
      case Step.ENCRYPT_NUMBER:
        return `${t.statusEncryptNumber} ${luckyNumber}...`
      case Step.BUY_TICKET:
        return t.statusBuyTicket
      case Step.GET_ROUND:
        return t.statusGetRound
      case Step.DRAW_LOTTERY:
        return t.statusDrawLottery
      case Step.CHECK_WINNER:
        return t.statusCheckWinner
      case Step.GET_ROUND_INFO:
        return t.statusGetRoundInfo
      case Step.DECRYPT_RESULT:
        return t.statusDecryptResult
      case Step.SETTLE:
        return isWinner ? t.statusSettle : t.processing
      default:
        return t.processing
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>
            <span className="emoji">🎰</span>
            <span className="text">{t.title}</span>
          </h1>
          <div className="language-switcher">
            <button 
              className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
              onClick={() => setLanguage('zh')}
            >
              中文
            </button>
            <button 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
          </div>
        </div>
        <p className="subtitle">{t.subtitle}</p>
      </header>

      <div className="main-container">
        {/* 钱包和合约信息栏 */}
        {address && (
          <div className="info-bar">
            <div className="info-card">
              <div className="info-icon">👛</div>
              <div className="info-details">
                <div className="info-label">{t.walletAddress}</div>
                <div className="info-value mono">{address.substring(0, 6)}...{address.substring(38)}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">💰</div>
              <div className="info-details">
                <div className="info-label">{t.accountBalance}</div>
                <div className="info-value">{balance} ETH</div>
              </div>
            </div>
            {contract && (
              <>
                <div className="info-card">
                  <div className="info-icon">🏆</div>
                  <div className="info-details">
                    <div className="info-label">{t.contractPool}</div>
                    <div className="info-value">{contractBalance} ETH</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">🎫</div>
                  <div className="info-details">
                    <div className="info-label">{t.ticketPrice}</div>
                    <div className="info-value">{ticketPrice} ETH</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 钱包连接 */}
        {currentStep === Step.CONNECT_WALLET && (
          <div className="card center-card">
            <h2>👛 {t.connectWallet}</h2>
            <p className="card-description">{t.connectWalletDesc}</p>
            <button onClick={connectWallet} disabled={loading} className="primary-btn">
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.connecting}
                </>
              ) : (
                t.connectMetaMask
              )}
            </button>
          </div>
        )}

        {/* 选择幸运号码 */}
        {currentStep === Step.SELECT_NUMBER && (
          <div className="card center-card">
            <h2>🎯 {t.selectNumber}</h2>
            <p className="card-description">{t.selectNumberDesc}</p>
            <div className="number-selector">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  className={`number-btn ${luckyNumber === num ? 'selected' : ''}`}
                  onClick={() => setLuckyNumber(num)}
                >
                  <span>{num}</span>
                </button>
              ))}
            </div>
            <button onClick={buyTicket} disabled={loading || !luckyNumber} className="primary-btn">
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.processing}
                </>
              ) : (
                `${t.buyTicket} (${ticketPrice} ETH)`
              )}
            </button>
          </div>
        )}

        {/* 开奖 */}
        {currentStep === Step.DRAW_LOTTERY && (
          <div className="card center-card">
            <h2>🎲 {t.drawLottery}</h2>
            <div className="round-info">
              <div className="info-row">
                <span className="label">{t.roundId}</span>
                <span className="value mono">{myRoundId?.toString()}</span>
              </div>
              <div className="info-row highlight">
                <span className="label">{t.yourLuckyNumber}</span>
                <span className="lucky-number">{luckyNumber}</span>
              </div>
            </div>
            <button onClick={drawLottery} disabled={loading} className="primary-btn">
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.drawing}
                </>
              ) : (
                t.startDraw
              )}
            </button>
          </div>
        )}

        {/* 检查中奖 */}
        {currentStep === Step.CHECK_WINNER && (
          <div className="card center-card">
            <h2>🔍 {t.checkWinner}</h2>
            <p className="card-description">{t.checkWinnerDesc}</p>
            <button onClick={checkWinner} disabled={loading} className="primary-btn">
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.checking}
                </>
              ) : (
                t.checkResult
              )}
            </button>
          </div>
        )}

        {/* 解密 */}
        {(currentStep === Step.GET_ROUND_INFO || currentStep === Step.DECRYPT_RESULT) && (
          <div className="card center-card">
            <h2>🔐 {t.decryptResult}</h2>
            <p className="card-description">{t.decryptDesc}</p>
            <div className="warning">
              {t.decryptWarning}
            </div>
            {currentStep === Step.GET_ROUND_INFO && (
              <button onClick={decryptResult} disabled={loading} className="primary-btn">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    {t.decrypting}
                  </>
                ) : (
                  t.startDecrypt
                )}
              </button>
            )}
          </div>
        )}

        {/* 显示结果 */}
        {currentStep === Step.SHOW_RESULT && winningNumber !== null && isWinner !== null && (
          <div className={`card center-card result-card ${isWinner ? 'winner' : 'loser'}`}>
            <h2>{isWinner ? t.congratulations : t.notWinner}</h2>
            <div className="result-details">
              <div className="number-comparison">
                <div className="number-box">
                  <span className="label">{t.yourNumber}</span>
                  <div className="number">{luckyNumber}</div>
                </div>
                <div className="vs">{t.vs}</div>
                <div className="number-box">
                  <span className="label">{t.winningNumber}</span>
                  <div className="number">{winningNumber}</div>
                </div>
              </div>
              <div className="match-result">
                <span className={luckyNumber === winningNumber ? 'match' : 'no-match'}>
                  {luckyNumber === winningNumber ? t.numberMatch : t.numberNotMatch}
                </span>
              </div>
            </div>
            <button onClick={settleLottery} disabled={loading} className="primary-btn">
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.processing}
                </>
              ) : isWinner ? (
                t.claimPrize
              ) : (
                t.confirmSettle
              )}
            </button>
          </div>
        )}

        {/* 完成 */}
        {currentStep === Step.COMPLETED && (
          <div className="card center-card completion-card">
            <h2><span className="emoji">🎰</span> {t.gameCompleted}</h2>
            {isWinner ? (
              <div className="completion-message success">
                <p className="prize-amount"><span className="emoji">🎊</span> + {prizeAmount} ETH</p>
                <p className="prize-info">{t.prizeAwarded}</p>
              </div>
            ) : (
              <div className="completion-message">
                <p className="try-again">{t.gameEnded}</p>
                <p className="encourage">{t.tryAgain}</p>
              </div>
            )}
            <button onClick={resetGame} className="primary-btn">
              {t.playAgain}
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* 网络切换提示弹窗 */}
        {showNetworkModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{t.networkError}</h2>
              </div>
              <div className="modal-body">
                <p>{t.wrongNetwork} <strong>Sepolia {language === 'zh' ? '测试网络' : 'Test Network'}</strong>。</p>
                <p>{t.networkErrorDesc}</p>
              </div>
              <div className="modal-footer">
                <button onClick={switchToSepolia} className="primary-btn">
                  {t.switchToSepolia}
                </button>
                <button onClick={() => setShowNetworkModal(false)} className="secondary-btn">
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 实时流程提示 - 放在进度指示器上方 */}
        {loading && (
          <div className="status-banner">
            <div className="status-content">
              <span className="loading-spinner"></span>
              <span className="status-text">{getStepStatus()}</span>
            </div>
          </div>
        )}

        {/* 进度指示器 */}
        <div className="progress">
          <div className="progress-text">
            {t.step} {currentStep} / {Step.COMPLETED}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / Step.COMPLETED) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App


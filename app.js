const contractAddress = "0x44A545F6acE2D44a8ba7486baA7dfC11934D102B";
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "guess",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "correct",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "prize",
        "type": "uint256"
      }
    ],
    "name": "GuessResult",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getPrizePool",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_guess",
        "type": "uint256"
      }
    ],
    "name": "guess",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "guessFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "playerBalances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "prizePool",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "randomNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "max",
        "type": "uint256"
      }
    ],
    "name": "setDifficulty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];


let provider, signer, contract;
let guessedNumbers = new Set();

// 在init中加载
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        loadGuessedNumbers();
        updateBalances();
        createGrid();
        
        updateStatus("✅ 连接成功！开始游戏吧", "success");
        
        // 在初始化时设置一次事件监听器
        const signerAddress = await signer.getAddress();
        contract.on("GuessResult", (player, guessNum, correct, prize) => {
            if (player.toLowerCase() === signerAddress.toLowerCase()) {
                if (correct) {
                    const resultMsg = `🎉 恭喜！猜对了数字 ${guessNum}，赢得 ${ethers.utils.formatEther(prize)} ETH！`;
                    updateStatus(resultMsg, "success");
                    showModal(resultMsg); // 猜对时显示弹窗庆祝
                } else {
                    updateStatus(`❌ 猜错了，${guessNum} 不是正确答案`, "error");
                }
                updateBalances();
            }
        });
    } else {
        showModal("请先安装 MetaMask 钱包！");
    }
}

// 加载函数
function loadGuessedNumbers() {
    const stored = localStorage.getItem('guessedNumbers');
    if (stored) {
        const numbers = JSON.parse(stored);
        numbers.forEach(num => guessedNumbers.add(num));
    }
}

// 保存函数
function saveGuessedNumbers() {
    localStorage.setItem('guessedNumbers', JSON.stringify([...guessedNumbers]));
}

async function updateBalances() {
    const prizePool = await contract.getPrizePool();
    document.getElementById("prizePool").textContent = ethers.utils.formatEther(prizePool);
    const userBalance = await signer.getBalance();
    document.getElementById("userBalance").textContent = parseFloat(ethers.utils.formatEther(userBalance)).toFixed(4);
}

function createGrid() {
    const grid = document.getElementById("numberGrid");
    grid.innerHTML = "";
    for (let i = 1; i <= 100; i++) {
        const div = document.createElement("div");
        div.textContent = i;
        if (guessedNumbers.has(i)) {
            div.classList.add("guessed");
        }
        grid.appendChild(div);
    }
}

// 添加弹窗函数（仅用于重要消息）
function showModal(message) {
    document.getElementById("modalMessage").textContent = message;
    document.getElementById("customModal").style.display = "block";
}

// 关闭弹窗
document.querySelector(".close").onclick = function() {
    document.getElementById("customModal").style.display = "none";
}

// 点击弹窗外关闭
window.onclick = function(event) {
    if (event.target == document.getElementById("customModal")) {
        document.getElementById("customModal").style.display = "none";
    }
}

// 改进的状态更新函数，支持不同类型的消息
function updateStatus(message, type = "info") {
    const statusDiv = document.getElementById("statusMessages");
    const p = document.createElement("p");
    p.className = `status-${type}`;
    
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    p.innerHTML = `<span class="time">[${time}]</span> ${message}`;
    
    statusDiv.insertBefore(p, statusDiv.firstChild); // 新消息显示在顶部
    
    // 5分钟后移除
    setTimeout(() => {
        if (statusDiv.contains(p)) {
            p.style.opacity = '0';
            setTimeout(() => statusDiv.removeChild(p), 300);
        }
    }, 60 * 60 * 1000);
    
    // 自动滚动到顶部
    statusDiv.scrollTop = 0;
}

// 修改猜测按钮事件处理
document.getElementById("guessBtn").addEventListener("click", async () => {
    const guess = parseInt(document.getElementById("guessInput").value);
    if (!guess || guess < 1 || guess > 100) {
        showModal("⚠️ 请输入1-100之间的数字！");
        return;
    }
    if (guessedNumbers.has(guess)) {
        showModal("⚠️ 你已经猜过这个数字了！");
        return;
    }
    
    // 禁用按钮防止重复点击
    const btn = document.getElementById("guessBtn");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "处理中...";
    
    try {
        updateStatus(`💭 正在猜测数字 ${guess}...`, "info");
        
        const tx = await contract.guess(guess, { value: ethers.utils.parseEther("0.001") });
        updateStatus(`💰 支付 0.001 ETH 成功，等待区块确认...`, "info");
        
        const receipt = await tx.wait();
        
        updateStatus(`✅ 交易已确认 (Gas: ${receipt.gasUsed.toString()})`, "success");
        
        // 如果猜对了，清空已猜数字；如果猜错了，添加到已猜列表
        const event = receipt.events?.find(e => e.event === 'GuessResult');
        if (event && event.args.correct) {
            // 猜对后清空已猜数字
            guessedNumbers.clear();
            localStorage.removeItem('guessedNumbers');
        } else {
            // 猜错了，添加到已猜列表
            guessedNumbers.add(guess);
            saveGuessedNumbers();
        }
        
        createGrid();
        updateBalances();
        
        // 清空输入框
        document.getElementById("guessInput").value = "";
        
    } catch (error) {
        console.error(error);
        let errorMsg = "交易失败：";
        if (error.code === 4001) {
            errorMsg += "用户取消了交易";
        } else if (error.code === -32603) {
            errorMsg += "余额不足或交易被拒绝";
        } else {
            errorMsg += error.message;
        }
        showModal("❌ " + errorMsg);
        updateStatus(errorMsg, "error");
    } finally {
        // 恢复按钮
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// 回车键支持
document.getElementById("guessInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("guessBtn").click();
    }
});


// 初始化应用
init();
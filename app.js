const contractAddress = "0x432602BA6cAAB1217436C214B78D375d62F21E0D";
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
let guessedNumbers = new Set(); // 存储猜过的数字

// 在init中加载
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        loadGuessedNumbers(); // 加载持久化数据
        updateBalances();
        createGrid();
    } else {
        alert("请安装MetaMask！");
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
    document.getElementById("userBalance").textContent = ethers.utils.formatEther(userBalance);
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

// 添加弹窗函数
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

// 修改所有提示为弹窗
document.getElementById("guessBtn").addEventListener("click", async () => {
    const guess = parseInt(document.getElementById("guessInput").value);
    if (!guess || guess < 1 || guess > 100) {
        showModal("请输入1-100的数字！");
        return;
    }
    if (guessedNumbers.has(guess)) {
        showModal("你已经猜过这个数字了！");
        return;
    }
    try {
        showModal("正在付款...");
        const tx = await contract.guess(guess, { value: ethers.utils.parseEther("0.001") });
        showModal("付款成功，等待确认...");
        await tx.wait();
        guessedNumbers.add(guess);
        saveGuessedNumbers();
        createGrid();
        updateBalances();
        // 监听事件
        contract.on("GuessResult", (player, guessNum, correct, prize) => {
            if (player.toLowerCase() === signer.getAddress().toLowerCase()) {
                showModal(correct ? `猜对了！赢得 ${ethers.utils.formatEther(prize)} ETH` : "猜错了，再试试！");
            }
        });
    } catch (error) {
        showModal("错误：" + error.message);
    }
});

init();
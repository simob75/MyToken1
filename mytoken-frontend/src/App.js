import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import MyTokenABI from "./MyTokenABI.json";
import "./App.css";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [buyAmount, setBuyAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [claimTime, setClaimTime] = useState(null); // ✅ Faucet cooldown time
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [newFaucetAmount, setNewFaucetAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Track admin status
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true"; // Load from localStorage
  });
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    localStorage.setItem("darkMode", !darkMode);
  };

  // ✅ Fetch token balance
  async function fetchBalance(address) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); hardhat localhost 
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, provider);
      const balance = await contract.balanceOf(address);
      setBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }

  // ✅ Admin check function
  const checkIfAdmin = useCallback(async () => {
    if (!account) return;

    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, provider);
      const owner = await contract.owner();
      
      const isAdminStatus = owner.toLowerCase() === account.toLowerCase();
      console.log("Contract Owner:", owner);
      console.log("Connected Account:", account);
      console.log("Is Admin?", isAdminStatus);

      setIsAdmin(isAdminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  }, [account]);

  // ✅ Auto-check if the connected account is admin
  useEffect(() => {
    if (account) {
      checkIfAdmin();
    }
  }, [account, checkIfAdmin]);

  // ✅ Wallet connection checker
  const checkWalletConnection = useCallback(async () => {
    if (window.ethereum) {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);

      if (accounts.length) {
        setAccount(accounts[0]);
        fetchBalance(accounts[0]);
        await checkIfAdmin();
      }
    } else {
      alert("MetaMask not found. Please install it.");
    }
  }, [checkIfAdmin]);

  useEffect(() => {
    checkWalletConnection();
  }, [checkWalletConnection]);

  async function connectWallet() {
    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      setAccount(userAddress);
      fetchBalance(userAddress);
      localStorage.setItem("walletAddress", userAddress);

      await checkIfAdmin();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }

  async function disconnectWallet() {
    setAccount(null);
    setBalance("0");
    setIsAdmin(false);

    if (window.ethereum) {
      window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] })
        .then(() => console.log("Disconnected from MetaMask"))
        .catch((error) => console.error("Disconnect failed:", error));
    }

    localStorage.removeItem("walletAddress");
  }

  // ✅ TokensPurchased Event Listener
  useEffect(() => {
    if (!account) return;
    //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); //for hardhat
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, provider);
  
    const fetchPastEvents = async () => {
      try {
        console.log("🔍 Fetching past transactions...");
        const events = await contract.queryFilter("TokensPurchased", -10000); // Fetch from last 10,000 blocks
    
        console.log("📝 Raw Events:", events); // Log raw events
    
        const formattedEvents = events.map((event) => ({
          buyer: event.args.buyer,
          ethAmount: ethers.formatEther(event.args.ethAmount),
          tokenAmount: ethers.formatUnits(event.args.tokenAmount, 18),
        }));
    
        console.log("✅ Formatted Transactions:", formattedEvents);
        setTransactions(formattedEvents);
      } catch (error) {
        console.error("⚠️ Error fetching past transactions:", error);
      }
    };
    
    fetchPastEvents(); // Load past transactions on page load
  
    const handleTokensPurchased = (buyer, ethAmount, tokenAmount) => {
      console.log("📌 TokensPurchased Event:", { buyer, ethAmount, tokenAmount });
  
      setTransactions((prevTxs) => [
        ...prevTxs,
        {
          buyer,
          ethAmount: ethers.formatEther(ethAmount),
          tokenAmount: ethers.formatUnits(tokenAmount, 18),
        },
      ]);
    };
  
    contract.on("TokensPurchased", handleTokensPurchased);
  
    return () => {
      contract.off("TokensPurchased", handleTokensPurchased);
    };
  }, [account]);
  
  

  async function transferTokens() {
    if (!recipient || !amount) return alert("Enter recipient and amount");

    try {
      setLoading(true);
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, signer);

      const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 18));
      alert("Transaction submitted! Waiting for confirmation...");

      await tx.wait();
      alert("✅ Transfer Successful!");

      fetchBalance(account);
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      alert("❌ Transaction failed!");
    } finally {
      setLoading(false);
    }
  }

  async function buyTokens() {
    if (!buyAmount || isNaN(buyAmount) || buyAmount <= 0) {
      alert("Enter a valid ETH amount");
      return;
    }

    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, signer);

      const tx = await contract.buyTokens({ value: ethers.parseEther(buyAmount) });
      alert("Transaction submitted! Waiting for confirmation...");
      await tx.wait();

      alert("✅ Tokens purchased successfully!");
      fetchBalance(account);
      setBuyAmount("");
    } catch (error) {
      console.error("Buy failed:", error);
      alert("❌ Purchase failed!");
    }
  }

  async function mintTokens() {
    if (!mintAmount) return alert("Enter mint amount");
    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, signer);
      
      const tx = await contract.mint(account, ethers.parseUnits(mintAmount, 18));
      await tx.wait();
      
      alert("✅ Mint Successful!");
      fetchBalance(account);
      setMintAmount("");
    } catch (error) {
      console.error("Mint failed:", error);
    }
  }

  async function claimTokens() {
    if (!window.ethereum) return alert("MetaMask is required!");

    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, signer);

      const tx = await contract.claimTokens();
      await tx.wait();

      alert("✅ Faucet claimed successfully! You can claim again in 72 hours.");
      fetchBalance(account);
    } catch (error) {
      console.error("❌ Faucet claim failed:", error);
      if (error.message.includes("Wait 72 hours")) {
        alert("⏳ You must wait 72 hours before claiming again!");
      } else if (error.message.includes("User rejected")) {
        alert("❌ Transaction rejected. Please confirm it in MetaMask.");
      } else {
        alert("⚠️ Something went wrong! Check the console for details.");
      }
    }
  }

  async function setFaucetAmount(newAmount) {
    if (!window.ethereum) return alert("MetaMask is required!");

    try {
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, signer);

      const tx = await contract.setFaucetAmount(ethers.parseUnits(newAmount, 18));
      await tx.wait();

      alert(`✅ Faucet amount updated to ${newAmount} tokens!`);
      setNewFaucetAmount("");
    } catch (error) {
      console.error("Updating faucet amount failed:", error);
    } 
  }
  
  // ✅ Fetch last claim time (Faucet Timer)
  const fetchClaimTime = useCallback(async () => {
    if (!account) return;
    try {
      console.log("Fetching last claim time...");
      //const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, MyTokenABI.abi, provider);
      const lastClaim = await contract.lastClaimTime(account);
      setClaimTime(Number(lastClaim)); // Convert to number
      console.log("Last claim time:", new Date(Number(lastClaim) * 1000).toLocaleString());
    } catch (error) {
      console.error("Error fetching claim time:", error);
    }
  }, [account]);  // ✅ Now fetchClaimTime is stable
  
  // ✅ Now this won't trigger unnecessary re-renders:
  useEffect(() => {
    fetchClaimTime();
  }, [account, fetchClaimTime]);  


  return (
    <div className={`App ${darkMode ? "dark-mode" : ""}`}>
      <h1>MyToken dApp</h1>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>

      <p><strong>Connected as:</strong> {account || "Not connected"}</p>

      {account && <p className="balance">Balance: {balance} MTK</p>}

      {account ? (
        <button onClick={disconnectWallet}>🚫 Disconnect Wallet</button>
      ) : (
        <button onClick={connectWallet}>🔗 Connect Wallet</button>
      )}

      {account && <button onClick={() => fetchBalance(account)}>🔄 Refresh Balance</button>}

      <div className="content-grid">

        <div className="buy-container">
          <h2>💰 Buy Tokens</h2>
          <input type="number" placeholder="Amount in ETH" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
          <button onClick={buyTokens}>Buy</button>
        </div>

        <div className="transfer-container">
          <h2>🚀 Transfer Tokens</h2>
          <input type="text" placeholder="Recipient Address" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={transferTokens} disabled={loading}>{loading ? "Processing..." : "Send"}</button>
        </div>


        {/* ✅ Claim Tokens */}
        <div className="faucet-container">
          <h2>🚰 Free Token Faucet</h2>
          <p>Claim 50 free tokens every 72 hours.</p>

           {/* ✅ Display last claim time properly */}
           <p><strong>Last Claim:</strong> {claimTime ? new Date(claimTime * 1000).toLocaleString() : "Never"}</p>

          {/* ✅ Claim Free Tokens button */}
          <button onClick={claimTokens}>Claim Free Tokens</button>

          {/* ✅ Automatically update claim time after claiming */}
          <p className="refresh-text" onClick={fetchClaimTime} style={{ cursor: "pointer", textDecoration: "underline" }}>
          🔄 Refresh Claim Time
          </p>
        </div>

    <div className="history-container">
        <h2>📜 Transaction History</h2>
          {transactions.length === 0 ? (
            <p>No transactions found.</p>
          ) : (
          <div className="transaction-list">
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
            <p><strong>Buyer:</strong> {tx.buyer}</p>
              <p><strong>ETH Spent:</strong> {tx.ethAmount} ETH</p>
            <p><strong>Tokens Received:</strong> {tx.tokenAmount} MTK</p>
          </div>
       ))}
      </div>
     )}
  </div>

      </div>

        {isAdmin && (
  <>
    <button 
      onClick={() => setShowAdminPanel(!showAdminPanel)} 
      className="admin-toggle-btn"
    >
      {showAdminPanel ? "Hide Admin Panel" : "Show Admin Panel"}
    </button>

    {showAdminPanel && (
      <div className="admin-container">
        <div className="mint-container">
          <h2>🔥 Mint Tokens (Owner Only)</h2>
          <input 
            type="number" 
            placeholder="Mint Amount" 
            value={mintAmount} 
            onChange={(e) => setMintAmount(e.target.value)} 
          />
          <button onClick={mintTokens}>Mint</button>
        </div>

        <div className="admin-container">
          <h2>⚙️ Admin: Set Faucet Amount</h2>
          <input 
            type="number" 
            placeholder="New Faucet Amount" 
            value={newFaucetAmount} 
            onChange={(e) => setNewFaucetAmount(e.target.value)} 
          />
          <button onClick={() => setFaucetAmount(newFaucetAmount)}>Set Faucet Amount</button>
        </div>
      </div>
    )}
  </>
)}
      </div>
  );
}

export default App;
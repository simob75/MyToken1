# Sample Hardhat Project

<!-- TOC -->
🏆 MyToken dApp
A decentralized application (dApp) for managing MyToken (MTK), allowing users to transfer tokens, claim free tokens from a faucet, and enabling the admin to mint new tokens or adjust the faucet distribution amount.

📸 Screenshots
1️⃣ Home Screen (Not Connected)
Users need to connect their wallet to interact with the dApp.

2️⃣ User Connected (Non-Admin)
A regular user can claim tokens and transfer them, but admin features are disabled.

3️⃣ Admin Connected
The admin can mint tokens and set the faucet amount.

4️⃣ Token Transfer & Faucet Claim
Users can send tokens to another wallet and claim from the faucet (every 72 hours).

5️⃣ Error Handling (Example: Faucet Cooldown)
If a user tries to claim tokens too soon, they will see this message.

🚀 Features
✅ Connect Wallet – Supports MetaMask to connect a user's wallet.
✅ View Balance – Displays the current balance of MyToken (MTK).
✅ Transfer Tokens – Send MTK to another wallet.
✅ Faucet (Claim Free Tokens) – Users can claim 50 MTK every 72 hours.
✅ Admin Features

🔥 Mint Tokens – The admin can create new tokens.
⚙️ Set Faucet Amount – The admin can adjust the claimable amount.
✅ Error Handling – Detects and displays errors (e.g., insufficient balance, cooldown period).

🛠️ Setup & Installation
1️⃣ Clone the Repository
git clone https://github.com/simob75/MyToken1
cd mytoken-dapp
2️⃣ Install Dependencies
npm install
3️⃣ Configure Environment Variables
Create a .env file and add:
REACT_APP_CONTRACT_ADDRESS=your_contract_address_here
4️⃣ Run a Local Blockchain (Hardhat)
npx hardhat node
5️⃣ Deploy the Smart Contract
npx hardhat ignition deploy ignition/modules/mytoken.ts --network localhost
6️⃣ Start the dApp
npm start
📜 Smart Contract
The MyToken contract follows the ERC-20 standard and includes additional features:

mint(address to, uint256 amount) – Admin can mint new tokens.
claimTokens() – Users can claim free tokens from the faucet.
setFaucetAmount(uint256 newAmount) – Admin can adjust the faucet distribution.
🤝 Contributing
If you'd like to improve this project, feel free to submit a pull request! Make sure to:

Fork the repo
Create a new branch (git checkout -b feature-branch)
Commit changes (git commit -m "Add new feature")
Push to your fork (git push origin feature-branch)
Open a PR
📜 License
This project is licensed under the MIT License. See the LICENSE file for details.

🔗 Connect with Me
👤 Your Name
🔗 GitHub: yourusername
🐦 Twitter: @yourhandle

<!-- /TOC -->

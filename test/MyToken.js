const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const  { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers");
const tokensPerETH = 1000;

describe("MyToken", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Set initial supply to 1000 tokens (18 decimals)
    const initialSupply = ethers.parseUnits("1000", 18);

    // Deploy the MyToken contract
    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy(initialSupply);
    await myToken.waitForDeployment();

    return { myToken, owner, addr1, addr2, initialSupply };
  }

  it("Should assign the initial supply to the owner", async function () {
    const { myToken, owner, initialSupply } = await loadFixture(deployTokenFixture);
    expect(await myToken.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should allow the owner to mint tokens", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const mintAmount = ethers.parseUnits("100", 18);

    await myToken.mint(addr1.address, mintAmount);
    expect(await myToken.balanceOf(addr1.address)).to.equal(mintAmount);
  });

  it("Should not allow non-owners to mint", async function () {
    const { myToken, addr1 } = await loadFixture(deployTokenFixture);
    const mintAmount = ethers.parseUnits("100", 18);

    await expect(myToken.connect(addr1).mint(addr1.address, mintAmount)).to.be.reverted;
  });

  it("Should transfer tokens between accounts", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const transferAmount = ethers.parseUnits("50", 18);

    await myToken.transfer(addr1.address, transferAmount);
    expect(await myToken.balanceOf(addr1.address)).to.equal(transferAmount);
    expect(await myToken.balanceOf(owner.address)).to.equal(ethers.parseUnits("950", 18));
  });

  it("Should allow transfer of 0 tokens", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
  
    // Explicitly connect the `owner` before calling `transfer`
    await expect(myToken.connect(owner).transfer(addr1.address, 0))
      .to.emit(myToken, "Transfer")
      .withArgs(owner.address, addr1.address, 0);
  
    // Ensure balances remain unchanged
    expect(await myToken.balanceOf(owner.address)).to.equal(ethers.parseUnits("1000", 18));
    expect(await myToken.balanceOf(addr1.address)).to.equal(0);
  });
  

  it("Should not allow transfers exceeding balance", async function () {
    const { myToken, addr1, addr2 } = await loadFixture(deployTokenFixture);
    const transferAmount = ethers.parseUnits("10", 18);

    await expect(myToken.connect(addr1).transfer(addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should approve and check allowance", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const approveAmount = ethers.parseUnits("100", 18);

    await myToken.approve(addr1.address, approveAmount);
    expect(await myToken.allowance(owner.address, addr1.address)).to.equal(approveAmount);
  });

  it("Should allow transferFrom when approved", async function () {
    const { myToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
    const approveAmount = ethers.parseUnits("100", 18);
    const transferAmount = ethers.parseUnits("50", 18);

    await myToken.approve(addr1.address, approveAmount);
    await myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

    expect(await myToken.balanceOf(addr2.address)).to.equal(transferAmount);
    expect(await myToken.balanceOf(owner.address)).to.equal(ethers.parseUnits("950", 18));
  });

  it("Should emit a Transfer event", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const transferAmount = ethers.parseUnits("10", 18);

    await expect(myToken.transfer(addr1.address, transferAmount))
      .to.emit(myToken, "Transfer")
      .withArgs(owner.address, addr1.address, transferAmount);
  });

  it("Should emit an Approval event", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const approveAmount = ethers.parseUnits("50", 18);

    await expect(myToken.approve(addr1.address, approveAmount))
      .to.emit(myToken, "Approval")
      .withArgs(owner.address, addr1.address, approveAmount);
  });

  it("Should not allow transferFrom without enough allowance", async function () {
    const { myToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
    const transferAmount = ethers.parseUnits("10", 18);

    await expect(myToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
  });

  it("Should allow users to buy tokens with ETH", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const buyAmount = ethers.parseEther("1"); // 1 ETH
    const expectedTokens = buyAmount * BigInt(tokensPerETH);
  
    // 🛠 Ensure the owner has enough tokens to sell
    await myToken.connect(owner).mint(owner.address, expectedTokens);
  
    // 🛠 Debugging: Check if owner has enough tokens
    console.log("Owner MTK balance before sale:", (await myToken.balanceOf(owner.address)).toString());
  
    // 🛠 Check initial ETH balances
    console.log("Owner ETH before:", ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    console.log("Addr1 ETH before:", ethers.formatEther(await ethers.provider.getBalance(addr1.address)));
  
    // 🛠 Debugging: Try transaction and catch errors
    try {
      const tx = await myToken.connect(addr1).buyTokens({ value: buyAmount });
      await tx.wait(); // Ensure it completes
    } catch (error) {
      console.error("🔥 buyTokens FAILED!", error);
      throw error; // Re-throw so test fails with error details
    }
  
    // 🛠 Check final ETH balances
    console.log("Owner ETH after:", ethers.formatEther(await ethers.provider.getBalance(owner.address)));
    console.log("Addr1 ETH after:", ethers.formatEther(await ethers.provider.getBalance(addr1.address)));
  
    // 🛠 Validate balances
    expect(await myToken.balanceOf(addr1.address)).to.equal(expectedTokens);
  });

  it("Should emit TokensPurchased event on buy", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const buyAmount = ethers.parseEther("0.5"); // 0.5 ETH
    const expectedTokens = buyAmount * BigInt(tokensPerETH);

    // Transfer tokens to owner for selling
    await myToken.transfer(owner.address, expectedTokens);

    await expect(myToken.connect(addr1).buyTokens({ value: buyAmount }))
      .to.emit(myToken, "TokensPurchased")
      .withArgs(addr1.address, buyAmount, expectedTokens);
  });

  it("Should fail if contract does not have enough tokens", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const buyAmount = ethers.parseEther("2"); // 2 ETH
    await expect(myToken.connect(addr1).buyTokens({ value: buyAmount }))
      .to.be.revertedWith("Not enough tokens in contract");
  });

  it("Should allow only owner to set faucet amount", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const newFaucetAmount = ethers.parseUnits("100", 18);

    await expect(myToken.connect(addr1).setFaucetAmount(newFaucetAmount))
      .to.be.reverted;

    await myToken.connect(owner).setFaucetAmount(newFaucetAmount);
    expect(await myToken.faucetAmount()).to.equal(newFaucetAmount);
  });

  it("Should allow only owner to change tokens per ETH rate", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const newRate = 1500;

    await expect(myToken.connect(addr1).setTokensPerETH(newRate))
      .to.be.reverted;

    await myToken.connect(owner).setTokensPerETH(newRate);
    expect(await myToken.tokensPerETH()).to.equal(newRate);
  });

  it("Should allow owner to withdraw ETH", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const buyAmount = ethers.parseEther("1");

    // Transfer tokens to owner for selling
    await myToken.transfer(owner.address, buyAmount * BigInt(tokensPerETH));

    await myToken.connect(addr1).buyTokens({ value: buyAmount });

    await expect(() => myToken.connect(owner).withdrawETH())
      .to.changeEtherBalances([owner], [buyAmount]);
  });

  it("Should fail if non-owner tries to withdraw ETH", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    await expect(myToken.connect(addr1).withdrawETH())
      .to.be.reverted;
  });

  it("Should allow users to claim free tokens every 72 hours", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const newFaucetAmount = ethers.parseUnits("100", 18);

    // 🟢 Step 1: Ensure the contract has tokens for the faucet
    await myToken.connect(owner).mint(owner.address, newFaucetAmount);
    await myToken.connect(owner).transfer(myToken.target, newFaucetAmount);

    // 🟢 Step 2: Set the faucet amount
    await myToken.connect(owner).setFaucetAmount(newFaucetAmount);

    // 🟢 Step 3: First claim should succeed
    await myToken.connect(addr1).claimTokens();
    const balanceAfterFirstClaim = await myToken.balanceOf(addr1.address);
    expect(balanceAfterFirstClaim).to.be.gt(0); // Addr1 should now have tokens
    console.log(balanceAfterFirstClaim);

    // ❌ Step 4: Second claim should fail (before 72 hours)
    await expect(myToken.connect(addr1).claimTokens())
        .to.be.revertedWith("Wait 72 hours to claim again");
});



  it("Should allow only the owner to set claim cooldown", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const newCooldown = 48 * 3600; // 48 hours
  
    // Non-owner should fail
    await expect(myToken.connect(addr1).setClaimCooldown(newCooldown))
      .to.be.reverted;
  
    // Owner should succeed
    await myToken.connect(owner).setClaimCooldown(newCooldown);
    expect(await myToken.claimCooldown()).to.equal(newCooldown);
  });
  
  it("Should allow only owner to set faucet amount", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const newFaucetAmount = ethers.parseUnits("100", 18);
  
    // Non-owner should fail
    await expect(myToken.connect(addr1).setFaucetAmount(newFaucetAmount))
      .to.be.reverted;
  
    // Owner should succeed
    await myToken.connect(owner).setFaucetAmount(newFaucetAmount);
    expect(await myToken.faucetAmount()).to.equal(newFaucetAmount);
  });
  
  it("Should allow only owner to withdraw ETH", async function () {
    const { myToken, owner, addr1 } = await loadFixture(deployTokenFixture);
    const buyAmount = ethers.parseEther("1");
  
    // Transfer tokens to owner for selling
    await myToken.transfer(owner.address, buyAmount * BigInt(tokensPerETH));
  
    await myToken.connect(addr1).buyTokens({ value: buyAmount });
  
    // Owner should be able to withdraw
    await expect(() => myToken.connect(owner).withdrawETH())
      .to.changeEtherBalances([owner], [buyAmount]);
  });
  
  it("Should fail if non-owner tries to withdraw ETH", async function () {
    const { myToken, addr1 } = await loadFixture(deployTokenFixture);
    await expect(myToken.connect(addr1).withdrawETH())
      .to.be.reverted;
  });
  
});

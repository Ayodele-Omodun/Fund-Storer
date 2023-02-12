/** @format */

const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  amount,
  time,
  developmentChains,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundStorer", () => {
      let fundStorer, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundStorer = await ethers.getContract("FundStorer", deployer);
      });

      describe("constructor", () => {
        it("sets the owner correctly", async () => {
          assert.equal(await fundStorer.i_owner, deployer);
        });
      });

      describe("Deposit", () => {
        it("receives the money", async () => {
          const initialAmount = await ethers.provider.getBalance(
            fundStorer.address
          );
          const tx = await fundStorer.deposit(time, { value: amount });
          await tx.wait(1);
          const finalAmount = await ethers.provider.getBalance(
            fundStorer.address
          );
          assert.equal(
            amount.toString(),
            finalAmount.sub(initialAmount).toString()
          );
        });

        beforeEach(async () => {
          const tx = await fundStorer.deposit(time, { value: amount });
          await tx.wait(1);
        });

        it("sets the time deposited correctly", async () => {
          const blockNumber = await ethers.provider.getBlockNumber();
          const block = await ethers.provider.getBlock(blockNumber);
          assert.equal(
            (block.timestamp / 1000).toFixed(0),
            (await fundStorer.getTimeDeposited()).toString()
          );
        });
        it("calculates the time correctly", async () => {
          await network.provider.send("evm_increaseTime", [3600]);
          await network.provider.send("evm_mine", []);
          const blockNumber = await ethers.provider.getBlockNumber();
          const block = await ethers.provider.getBlock(blockNumber);
          const currentTime = (block.timestamp / 1000).toFixed(0);
          assert.equal(
            (await fundStorer.getTimeDeposited()).add(time).toString() -
              currentTime,
            (await fundStorer.getTimeLeft()).toString()
          );
        });
        it("sets time length correctly", async () => {
          const timeDeposited = await fundStorer.getTimeDeposited();
          assert.equal((await fundStorer.timeLength()).toString(), time);
        });
        it("maps the saver's address to the amount sent", async () => {
          const amountStored = await fundStorer.getAmountStored();
          assert.equal(amount, amountStored);
        });
        it("adds depositer to the array correctly", async () => {
          assert.equal(await fundStorer.getDepositer(0), deployer);
        });
        it("emits an event after deposit", async () => {
          await expect(fundStorer.deposit(time, { value: amount })).to.emit(
            fundStorer,
            "Deposited"
          );
        });
      });

      describe("Withdraw", () => {
        it("goes through the authentication process", async () => {
          await expect(fundStorer.withdraw()).to.be.reverted;
        });
        beforeEach(async () => {
          const tx = await fundStorer.deposit(time, { value: amount });
          await tx.wait(1);
        });
        it("reverts if time isn't right", async () => {
          network.provider.send("evm_increaseTime", [2]);
          network.provider.send("evm_mine", []);
          await expect(fundStorer.withdraw()).to.be.reverted;
        });
        it("pays the saver when time is right", async () => {
          const initialSaverBalance = await ethers.provider.getBalance(
            deployer
          );
          network.provider.send("evm_increaseTime", [36000000]);
          network.provider.send("evm_mine", []);
          await fundStorer.withdraw();
          const finalSaverBalance = await ethers.provider.getBalance(deployer);
          expect(finalSaverBalance).to.be.greaterThanOrEqual(
            initialSaverBalance
          );
        });
        it("emits an event after payment", async () => {
          network.provider.send("evm_increaseTime", [360000000]);
          network.provider.send("evm_mine", []);
          await expect(fundStorer.withdraw()).to.emit(fundStorer, "Withdrawn");
        });
      });
    });

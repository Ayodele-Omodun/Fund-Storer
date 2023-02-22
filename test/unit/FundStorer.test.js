/** @format */

const { deployments, getNamedAccounts, ethers } = require("hardhat");
const { expect, assert } = require("chai");
const {
  time,
  amount,
  moveBlocks,
  moveTime,
  withdrawAmount,
} = require("../../helper-hardhat-config");

describe("FundStorer", () => {
  let fundStorer, deployer;
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundStorer = await ethers.getContract("FundStorer", deployer);
  });
  describe("Deposit", () => {
    it("receives the money", async () => {
      const initContractAmount = await ethers.provider.getBalance(
        fundStorer.address
      );
      const tx = await fundStorer.deposit(time, { value: amount });
      await tx.wait(1);
      const finalContractAmount = await ethers.provider.getBalance(
        fundStorer.address
      );
      const balance = finalContractAmount.sub(initContractAmount);
      assert.equal(balance.toString(), amount);
    });
    it("stores the depositor correctly", async () => {
      const tx = await fundStorer.deposit(time, { value: amount });
      const txrc = await tx.wait(1);
      const depositId = txrc.events[0].args.depositId;
      const depositor = (await fundStorer.getDepositDetails(depositId))
        .depositor;
      assert.equal(depositor, deployer);
    });
    it("stores the time length correctly", async () => {
      const tx = await fundStorer.deposit(time, { value: amount });
      const rc = await tx.wait(1);
      const depositId = rc.events[0].args.depositId;
      const timeLength = (await fundStorer.getDepositDetails(depositId))
        .timeLength;
      assert.equal(timeLength, time);
    });
    it("stores the amount deposited", async () => {
      const tx = await fundStorer.deposit(time, { value: amount });
      const rc = await tx.wait(1);
      const depositId = rc.events[0].args.depositId;
      const amountDeposited = (await fundStorer.getDepositDetails(depositId))
        .amountDeposited;
      assert.equal(amountDeposited, amount);
    });
    it("calculates the unlock time correctly", async () => {
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      const tx = await fundStorer.deposit(time, { value: amount });
      const timeDeposited = +(block.timestamp / 1000).toFixed(0).toString();
      const rc = await tx.wait(1);
      const depositId = rc.events[0].args.depositId;
      const unlockTime = (await fundStorer.getDepositDetails(depositId))
        .unlockTime;
      assert.equal(timeDeposited + time, unlockTime.toString());
    });
    it("emits an event", async () => {
      expect(await fundStorer.deposit(time, { value: amount }))
        .to.emit("FundStorer", "Deposited")
        .withArgs(0, true);
    });
  });
  describe("Withdraw", () => {
    it("reverts if time isn't right", async () => {
      const tx = await fundStorer.deposit(10, { value: amount });
      const txrc = await tx.wait(1);
      const depositId = txrc.events[0].args.depositId;
      await expect(fundStorer.withdraw(depositId, withdrawAmount)).to.be
        .reverted;
    });
    let depositId;
    beforeEach(async () => {
      const tx = await fundStorer.deposit(time, { value: amount });
      const txrc = await tx.wait(1);
      depositId = txrc.events[0].args.depositId;
    });
    it("reverts if not owner of deposit Id", async () => {
      await expect(fundStorer.withdraw(2, withdrawAmount)).to.be.reverted;
    });
    it("reverts if funds are less than amount to be withdrawn", async () => {
      await expect(fundStorer.withdraw(depositId, amount + withdrawAmount)).to
        .be.reverted;
    });
    it("pays the depositer", async () => {
      const initContractrBalance = (
        await ethers.provider.getBalance(fundStorer.address)
      ).toString();
      moveBlocks(time + 2);
      moveTime(time + 2);
      const tx = await fundStorer.withdraw(depositId, withdrawAmount);
      await tx.wait(1);
      const finalContractrBalance = (
        await ethers.provider.getBalance(fundStorer.address)
      ).toString();
      const totBalance = Math.abs(
        +finalContractrBalance - +initContractrBalance
      );
      expect(totBalance).to.be.greaterThanOrEqual(withdrawAmount * 10 ** 18);
      it("calculates amount left", async () => {
        await moveBlocks("100");
        await moveTime("100");
        const tx = await fundStorer.withdraw(depositId, withdrawAmount);
        await tx.wait(1);
        const balance = +amount - +(withdrawAmount * 10 ** 18);
        const amountLeft = (await fundStorer.getDepositDetails(depositId))
          .amountLeft;
        assert.equal(balance, amountLeft);
      });

      it("resets the amountWithdrawn property", async () => {
        await moveBlocks("100");
        await moveTime("100");
        const tx = await fundStorer.withdraw(depositId, withdrawAmount);
        await tx.wait(1);
        const amountWithdrawn = (await fundStorer.getDepositDetails(depositId))
          .amountWithdrawn;

        assert.equal(withdrawAmount, amountWithdrawn);
      });
    });
    it("emits an event", async () => {
      expect(await fundStorer.withdraw(depositId, withdrawAmount)).to.emit(
        "FundStorer",
        "Withdrawn"
      );
    });
  });
});

/** @format */

const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  amount,
  time,
  developmentChains,
  moveBlocks,
  moveTime,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundStorer", () => {
      let fundStorer, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundStorer = await ethers.getContract("FundStorer", deployer);
      });

      describe("deposit", () => {
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
        let depositTxRes, depositTxReciept, depositId;
        beforeEach(async () => {
          depositTxRes = await fundStorer.deposit(time, {
            value: amount,
          });
          depositTxReciept = await depositTxRes.wait(1);
          depositId = await depositTxReciept.event[1].args.depositId;
        });
        it("stores the depositor correctly", async () => {
          const depositor = await fundStorer.getDepositDetails(depositId)
            .depositor;
          assert.equal(depositor, deployer);
        });
        it("stores the amount deposited correctly", async () => {
          const amountDeposited = await fundStorer.getDepositDetails(depositId)
            .amountDeposited;
          assert.equal(amountDeposited, amount);
        });
        it("stores the time length correctly", async () => {
          const timeDeposited = await fundStorer.getDepositDetails(depositId)
            .timeDeposited;
          assert.equal(timeDeposited, time);
        });
        it("emits the deposited event", async () => {
          await expect(
            await fundStorer.deposit(time, { value: amount })
          ).to.emit("FundStorer", "Deposited");
        });
      });

      describe("Withdraw", () => {
        let txReceipt;
        beforeEach(async () => {
          const depositTx = await fundStorer.deposit(time, { value: amount });
          txReceipt = await depositTx.wait(1);
        });
        it("reverts if the function caller is not the owner of the depositId", async () => {
          expect(await fundStorer.withdraw("3", amount)).to.be.reverted;
        });
      });
    });

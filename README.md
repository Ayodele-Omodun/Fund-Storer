<!-- @format -->

# Fund Storer

## Stores users funds.

This project helps user store funds and locks them away for a given amount of time.
This projects shows how to do the following:

- Create a smart contract that stores funds with solidity
- Write a deploy script
- Write tests for smart contract
- Write a script that automatically helps to verify the project on etherscan
- Create and use a custom config file with other important information

The easiest way to see how this works is to:

1. clone this project

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## How to tweak this project for your own use

Since this is an example project, I'd encourage you to clone and rename this project to use for your own purposes.

## Find a bug?

If you found an issue or would like to submit an improvement to this project, please submit an issue using the issues tab above.

## New features added

- Users are able to withdraw amount of choice
- Users are able to pay more than once consecutively
- Certain security problems have been fixed

## Features still workning on

This project is still being worked on.

List of things coming soon:

- Payment will be made in terms of dollars (not ether)

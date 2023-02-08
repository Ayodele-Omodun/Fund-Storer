// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

error NotYetTime();
error NotOwner();
error NoAmountStored();

contract FundStorer {
    uint256 private previousBalance = address(this).balance;
    address public immutable i_owner;

    address payable[] private depositers;

    mapping(address => uint256) private addressToAmountStored;
    mapping(address => int256) private saverToTimeDeposited;
    mapping(address => int256) private saverToTimeLength;
    mapping(address => int256) private saverToTimeOver;

    event Withdrawn(bool _withdrawn);
    event Deposited(bool transactionSuccess);

    modifier onlyOwner(address owner) {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    fallback() external payable {
        deposit(24 * 60 * 60);
    }

    receive() external payable {
        deposit(24 * 60 * 60);
    }

    constructor() {
        i_owner = msg.sender;
    }

    function deposit(int256 _timeLengthInSeconds) public payable {
        // block.timestamp is used because it continously counts while variables don't, it is in milliseconds
        saverToTimeDeposited[msg.sender] = int256(block.timestamp / 1000);
        // total time needed to store money
        saverToTimeLength[msg.sender] = _timeLengthInSeconds;
        saverToTimeOver[msg.sender] = (saverToTimeDeposited[msg.sender] +
            _timeLengthInSeconds);
        addressToAmountStored[msg.sender] = msg.value;
        uint256 currentBalance = address(this).balance;
        bool Tansactionsuccess = (currentBalance - previousBalance ==
            msg.value);
        depositers.push(payable(msg.sender));
        emit Deposited(Tansactionsuccess);
    }

    function withdraw() public {
        if (addressToAmountStored[msg.sender] == 0) revert NoAmountStored();
        // checks if time
        if (getTimeLeft(msg.sender) > 0) revert NotYetTime();
        payable(msg.sender).transfer(addressToAmountStored[msg.sender]);
        bool withdrawn = (previousBalance -
            addressToAmountStored[msg.sender]) >= address(this).balance;
        saverToTimeDeposited[msg.sender] = 0;
        saverToTimeOver[msg.sender] = 0;
        addressToAmountStored[msg.sender] = 0;
        previousBalance = address(this).balance;
        emit Withdrawn(withdrawn);
    }

    function getTimeLeft(
        address _saver
    ) public view onlyOwner(_saver) returns (int256) {
        if (
            (saverToTimeOver[msg.sender]) - int256(block.timestamp / 1000) <= 0
        ) {
            return 0;
        } else {
            return (saverToTimeOver[msg.sender] -
                int256(block.timestamp / 1000));
        }
    }

    // this gets the amount an address stored (only the address can check it's own amount)
    function getAmountStored(
        address _saver
    ) public view onlyOwner(_saver) returns (uint256) {
        return addressToAmountStored[_saver];
    }

    function getTimeDeposited(
        address _saver
    ) external view onlyOwner(_saver) returns (int256) {
        return saverToTimeDeposited[_saver];
    }

    function timeLength(
        address _saver
    ) external view onlyOwner(_saver) returns (int256) {
        return saverToTimeLength[_saver];
    }

    function getDepositer(
        uint256 depositerIndex
    ) private view returns (address) {
        return depositers[depositerIndex];
    }

    function destroy() external onlyOwner(i_owner) {
        for (uint i = 0; i < depositers.length; i++) {
            depositers[i].transfer(addressToAmountStored[depositers[i]]);
        }
        selfdestruct(payable(i_owner));
    }
}

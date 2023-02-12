// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

/* CUSTOM ERRORS */
error TimeLimitNotReached();
error NotOwner();
error TransactionInProgress();
error onlyYourDetailsCanBeViewed();
error InsufficientFunds();
error NotEnoughFundStored();

contract FundStorer {
    /* STATE VARIABLES */
    address public immutable i_owner;
    // minimum amount that can be stored in terms of ether
    uint256 public immutable minimumAmount;
    uint256 public immutable minimumTimeLimit;
    uint256 private previousBalance = address(this).balance;
    bool internal locked = false;
    uint256 private constant DECIMAL = 10e18;
    // used as a nonce to access each point on the arrOfDepositDetails array
    uint16 private depositId = 0;
    // used to store each instance of the struct, this allows for multiple-seperate payments without mixing things up
    DepositDetails[] private arrOfDepositDetails;

    /* STRUCT */
    struct DepositDetails {
        address saver;
        uint256 amountDeposited;
        uint256 amountWithdrawn;
        uint256 amountLeft;
        uint256 timeDeposited;
        uint256 timeLength;
        uint256 timeLimit;
    }

    /* EVENTS */
    event Withdrawn(bool _withdrawn);
    event Deposited(uint16 indexed transactionId, bool transactionSuccess);

    /* MODIFIERS */
    // allows only the owner of the contract
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert NotOwner();
        _;
    }

    // allow only onwers of transaction details to be able to view their details (to limit who can view details)
    modifier onlyYoursCanBeViewed(uint16 _depositId) {
        if (msg.sender != arrOfDepositDetails[_depositId].saver)
            revert onlyYourDetailsCanBeViewed();
        _;
    }

    // nullify re-entrancy attack
    modifier noReentrancy() {
        if (locked) revert TransactionInProgress();
        locked = true;
        _;
        locked = false;
    }

    /* FUNCTIONS */
    // in case function wasn't called directly
    fallback() external payable {
        deposit(24 * 60 * 60);
    }

    // in case function wasn't called directly
    receive() external payable {
        deposit(24 * 60 * 60);
    }

    constructor(uint256 _minimumAmount, uint256 _minimumTimeLimitInSeconds) {
        i_owner = msg.sender;
        minimumAmount = _minimumAmount * DECIMAL;
        minimumTimeLimit = _minimumTimeLimitInSeconds;
    }

    function deposit(uint256 _timeLengthInSeconds) public payable noReentrancy {
        if (msg.value < minimumAmount) revert NotEnoughFundStored();
        DepositDetails memory depositDetails;
        depositDetails.saver = msg.sender;
        // block.timestamp is used because it continously counts while variables don't, it is in milliseconds
        // so the time-related variables are made in relation to block.timestamp
        depositDetails.timeDeposited = (block.timestamp / 1000);
        // time funds will get released
        depositDetails.timeLength = _timeLengthInSeconds;
        // total time needed to store money
        depositDetails.timeLimit =
            depositDetails.timeLength +
            depositDetails.timeDeposited;
        // setting each transaction amount related variables
        depositDetails.amountLeft = depositDetails.amountDeposited = msg.value;
        depositDetails.amountWithdrawn = 0;
        // storing the struct in an array
        arrOfDepositDetails.push(depositDetails);
        // new contract balance
        uint256 currentBalance = address(this).balance;
        bool Tansactionsuccess = (currentBalance - previousBalance ==
            msg.value);
        emit Deposited(depositId, Tansactionsuccess);
        previousBalance = currentBalance;
        depositId++;
    }

    function withdraw(
        uint16 _depositId,
        uint256 _amountToWithdraw
    ) public noReentrancy {
        // checks if amount is available
        if (
            arrOfDepositDetails[_depositId].amountLeft < _amountToWithdraw ||
            arrOfDepositDetails[_depositId].amountLeft == 0
        ) revert InsufficientFunds();
        // checks time
        if (getTimeLeft(_depositId) != 0) revert TimeLimitNotReached();
        // pays the saver
        payable(msg.sender).transfer(_amountToWithdraw);
        // updates amount-related variables
        arrOfDepositDetails[_depositId].amountWithdrawn += _amountToWithdraw;
        arrOfDepositDetails[_depositId].amountLeft =
            arrOfDepositDetails[_depositId].amountDeposited -
            arrOfDepositDetails[_depositId].amountWithdrawn;
        // to confirm if fund was sent out if contract
        // Note: it is expected to be greater than or equal to due to gasPrice
        bool withdrawn = (previousBalance - _amountToWithdraw) >=
            address(this).balance;
        // setting other variables
        previousBalance = address(this).balance;
        emit Withdrawn(withdrawn);
    }

    // time left before release of funds
    function getTimeLeft(
        uint16 _depositId
    ) public view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        // to avoid underflow
        if (
            (block.timestamp / 1000) >=
            arrOfDepositDetails[_depositId].timeLimit
        ) {
            return 0;
        } else {
            return
                arrOfDepositDetails[_depositId].timeLimit -
                (block.timestamp / 1000);
        }
    }

    // this gets the amount an address stored
    function getAmountStored(
        uint16 _depositId
    ) public view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        return arrOfDepositDetails[_depositId].amountDeposited;
    }

    // time depositer stored funds (in seconds)
    function getTimeDeposited(
        uint16 _depositId
    ) external view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        return arrOfDepositDetails[_depositId].timeDeposited;
    }

    // how long funds should be stored before being transferable
    function timeLength(
        uint16 _depositId
    ) external view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        return arrOfDepositDetails[_depositId].timeLength;
    }

    /*     function getDepositer(uint16 _depositId) public view returns (address) {
        return arrOfDepositDetails[_depositId].saver;
    } */
}

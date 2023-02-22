// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

/* CUSTOM ERRORS */
error unlockTimeNotReached(uint256 timeLeft);
error TransactionInProgress();
error onlyYourDetailsCanBeViewed();
error InsufficientFunds(uint16 depositId);
error notOwner();

contract FundStorer {
    /* STATE VARIABLES */
    uint256 private previousBalance = address(this).balance;
    bool internal locked = false;
    // used as a nonce to access each point on the idToDepositDetails mapping
    uint16 private depositId = 0;

    /* MAPPING */
    // depositor -> total amount the depositor has in the contract
    mapping(address => uint256) private addressToTotalAmountPaid;
    //     depositId -> struct(DepositDetails)
    mapping(uint16 => DepositDetails) private idToDepositDetails;

    /* STRUCT */
    struct DepositDetails {
        address depositor;
        uint256 amountDeposited;
        uint256 amountWithdrawn;
        uint256 amountLeft;
        uint256 timeDeposited;
        uint256 timeLength;
        uint256 unlockTime;
    }

    /* EVENTS */
    event Withdrawn(bool _withdrawn);
    event Deposited(uint16 indexed depositId, bool transactionSuccess);

    /* MODIFIERS */
    // allow only onwers of transaction details to be able to view their details (to limit who can view details)
    modifier onlyYoursCanBeViewed(uint16 _depositId) {
        if (msg.sender != idToDepositDetails[_depositId].depositor)
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

    /**
     * @dev constructor is payable so at deployment ether can be added to contract to avoid problems with withdrawal due to gas
     */
    constructor() payable {}

    function deposit(uint256 _timeLengthInSeconds) public payable noReentrancy {
        idToDepositDetails[depositId] = DepositDetails(
            msg.sender,
            msg.value,
            0,
            msg.value,
            (block.timestamp / 1000),
            _timeLengthInSeconds,
            ((block.timestamp / 1000) + _timeLengthInSeconds)
        );
        // new contract balance ;
        bool Tansactionsuccess = (address(this).balance - previousBalance ==
            msg.value);
        emit Deposited(depositId, Tansactionsuccess);
        addressToTotalAmountPaid[msg.sender] += msg.value;
        previousBalance = address(this).balance;
        depositId++;
    }

    /**
     * @dev depositId is used so that there can be access to each property of the transaction e.g. time the amount was deposited
     */
    function withdraw(
        uint16 _depositId,
        uint256 _amountToWithdraw
    ) public noReentrancy {
        if (msg.sender != idToDepositDetails[_depositId].depositor)
            revert notOwner();
        // calculates the amount in terms of wei
        uint256 calculatedAmount = _amountToWithdraw * 10 ** 18;
        // checks if amount is available for withdrawal
        if (
            calculatedAmount > idToDepositDetails[_depositId].amountLeft ||
            idToDepositDetails[_depositId].amountLeft == 0
        ) revert InsufficientFunds(_depositId);
        // checks time
        if (getTimeLeft(_depositId) > 0)
            revert unlockTimeNotReached(getTimeLeft(_depositId));
        // pays the depositor
        (bool withdrawn, ) = msg.sender.call{value: calculatedAmount}("");
        // updates amount-related variables
        idToDepositDetails[_depositId].amountWithdrawn += calculatedAmount;
        idToDepositDetails[_depositId].amountLeft =
            idToDepositDetails[_depositId].amountDeposited -
            idToDepositDetails[_depositId].amountWithdrawn;
        addressToTotalAmountPaid[msg.sender] -= calculatedAmount;
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
            idToDepositDetails[_depositId].unlockTime
        ) {
            return 0;
        } else {
            return (idToDepositDetails[_depositId].unlockTime -
                (block.timestamp / 1000));
        }
    }

    // this gets the amount an address stored
    function getAmountStored(
        uint16 _depositId
    ) public view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        return idToDepositDetails[_depositId].amountDeposited;
    }

    // how long funds should be stored before being transferable
    function timeLength(
        uint16 _depositId
    ) external view onlyYoursCanBeViewed(_depositId) returns (uint256) {
        return idToDepositDetails[_depositId].timeLength;
    }

    function getTotalAmountStored() external view returns (uint256) {
        return addressToTotalAmountPaid[msg.sender];
    }

    function getDepositDetails(
        uint16 _depositId
    )
        external
        view
        onlyYoursCanBeViewed(_depositId)
        returns (DepositDetails memory)
    {
        return idToDepositDetails[_depositId];
    }
}

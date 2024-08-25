// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {
    address public owner;
    uint256 public minimumBet;
    uint256 public maximumBet;

    event BetPlaced(address indexed user, uint256 amount, bool side);
    event CoinFlipped(address indexed user, uint256 amount, bool side, bool result, uint256 winnings);
    event ContractFunded(address funder, uint256 amount);

    constructor() {
        owner = msg.sender;
        minimumBet = 0.01 ether;
        maximumBet = 1 ether;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function setBetLimits(uint256 _minimumBet, uint256 _maximumBet) external onlyOwner {
        minimumBet = _minimumBet;
        maximumBet = _maximumBet;
    }

   function placeBet(bool side) external payable {
    emit Debug("Bet placement started");
    emit Debug(string(abi.encodePacked("Bet amount: ", uintToString(msg.value))));
    emit Debug(string(abi.encodePacked("Contract balance: ", uintToString(address(this).balance))));
    
    require(msg.value >= minimumBet, "Bet amount is less than the minimum bet.");
    require(msg.value <= maximumBet, "Bet amount exceeds the maximum bet.");
    require(address(this).balance >= msg.value * 2, "Contract doesn't have enough balance to cover potential winnings.");

    emit Debug("Requirements passed");

    bool coinFlipResult = (block.timestamp % 2 == 0);
    uint256 winnings = 0;

    emit Debug(string(abi.encodePacked("Coin flip result: ", coinFlipResult ? "true" : "false")));

    if (coinFlipResult == side) {
        emit Debug("User won");
        winnings = msg.value * 2;
        (bool sent, ) = payable(msg.sender).call{value: winnings}("");
        require(sent, "Failed to send winnings");
    } else {
        emit Debug("User lost");
    }

    emit CoinFlipped(msg.sender, msg.value, side, coinFlipResult, winnings);
    emit BetPlaced(msg.sender, msg.value, side);
    emit Debug("Events emitted");
}

function uintToString(uint256 v) internal pure returns (string memory) {
    if (v == 0) return "0";
    uint256 maxlength = 100;
    bytes memory reversed = new bytes(maxlength);
    uint256 i = 0;
    while (v != 0) {
        uint256 remainder = v % 10;
        v = v / 10;
        reversed[i++] = bytes1(uint8(48 + remainder));
    }
    bytes memory s = new bytes(i);
    for (uint256 j = 0; j < i; j++) {
        s[j] = reversed[i - 1 - j];
    }
    return string(s);
}



event Debug(string message);

    function fundContract() external payable onlyOwner {
        require(msg.value > 0, "Funding amount must be greater than 0");
        emit ContractFunded(msg.sender, msg.value);
    }

    function withdrawFunds(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance in contract.");
        require(address(this).balance - amount >= maximumBet * 2, "Must leave enough balance to cover potential bets.");
        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent, "Failed to send funds");
    }

  function getContractBalance() public view returns (uint256) {
    return address(this).balance;
}
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
}
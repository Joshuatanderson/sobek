pragma solidity ^0.8.0;
contract Vulnerable {
    mapping(address => uint) public balances;

    function withdraw() public {
        uint amount = balances[msg.sender];
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0; // state update AFTER external call = reentrancy
    }
}

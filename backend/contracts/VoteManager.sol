//SPDX-License-Identifier: Unlicense
//specific solidity cersion
pragma solidity ^0.8.7;

import "hardhat/console.sol";

//importing openzeppelin contracts
import "@openzeppelin/contracts/utils/Counters.sol";




contract VoteManager {

    using Counters for Counters.Counter;
    Counters.Counter private candidatesIds;

    event candidateCreated(address indexed _address, string _name);
    event Voted(address indexed _forCandidate, address indexed _voter, uint _totalVote);
    
    struct Candidate {
        uint id;
        uint totalVote;
        string name;
        string imageHash;
        address candidateAddress;
    }

    mapping(address => Candidate) private candidates;
    mapping(uint=> address) private accounts;

    function registerCandidate(string calldata _name, string calldata _imageHash) external {
        require(msg.sender != address(0), "Sender address must be valid"); 
        candidatesIds.increment();
        uint candidateId = candidatesIds.current();
        address _address = address(msg.sender);
        Candidate memory newCandidate = Candidate(candidateId, 0, _name, _imageHash, _address);  
        candidates[_address] = newCandidate;  
        accounts[candidateId] = msg.sender;
        emit candidateCreated(_address, _name);
    }

    function vote(address _forCandidate) external {
        candidates[_forCandidate].totalVote += 1;
        emit Voted(_forCandidate, msg.sender, candidates[_forCandidate].totalVote);
    }

    function fetchCandidates() external  view  returns ( Candidate[] memory) {
    uint itemCount = candidatesIds.current();
    Candidate[] memory candidatesArray = new Candidate[](itemCount);
        for (uint i = 0; i < itemCount; i++) {
            uint currentId = i + 1;
            Candidate memory currentCandidate = candidates[accounts[currentId]];
            candidatesArray[i] = currentCandidate;
        }
    return candidatesArray;
 }


}

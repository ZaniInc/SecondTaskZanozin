// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AirDrop
 * @author ZaniInc
 * @notice This smart contract is for send free tokens to loyal
 * members of crypto-project
 */
contract AirDrop is EIP712 {
    using SafeERC20 for IERC20;

    /**
     * @dev Store balances of members
     * @return amounts of available tokens & ether
     */
    mapping(address => uint256) public balanceOfTokens;
    mapping(address => uint256) public balanceOfEther;

    /**
     * @dev Use for sign message with EIP712 standart
     * @notice 'DROP_HASH' is signature of primaryType 'Drop'
     */
    bytes32 public constant DROP_HASH =
        keccak256("Drop(address recepient,uint256 amount, uint256 deadline)");

    address private _owner;

    IERC20 public token;

    /**
     * @dev 'DepositTokens' info about success transfer from owner to SC
     * @notice used in function 'depositTokens'
     *
     * @param amount - how many tokens will deposit to contract balance
     */
    event DepositTokens(uint256 amount);

    /**
     * @dev 'DepositEther' info about success transfer from owner to SC
     * @notice used in function 'depositEther'
     *
     * @param amount - how many ether will deposit to contract balance
     */
    event DepositEther(uint256 amount);

    /**
     * @dev 'DropTokens' return how many tokens will be
     * available for member
     * @notice used in function 'dropTokens'
     *
     * @param recepient - address of receiver
     * @param amount - how many tokens will send to member
     * @param deadline - how many times member have to collect tokens
     */
    event DropTokens(address recepient, uint256 amount, uint256 deadline);

    /**
     * @dev 'DropEther' return how many ether will be
     * available for member
     * @notice used in function 'dropEther'
     *
     * @param recepient - address of receiver
     * @param amount - how many ether will send to member
     * @param deadline - how many times member have to collect ether
     */
    event DropEther(address recepient, uint256 amount, uint256 deadline);

    /**
     * @dev 'NewContractAddress' inform about new ERC20 address
     * which connect to 'AirDrop'
     * @notice used in function 'updateTokenAddress'
     *
     * @param newContract - address of new ERC20 contract
     */
    event NewContractAddress(address newContract);

    /**
     * @dev 'WithdrawEther' inform how many ether
     * return to owner balance
     * @notice used in function 'withdrawEther'
     *
     * @param to - address of owner
     * @param amount - how many ether will back to owner
     */
    event WithdrawEther(uint256 amount, address to);

    /**
     * @dev 'WithdrawTokens' inform how many tokens
     * return to owner balance
     * @notice used in function 'withdrawTokens'
     *
     * @param to - address of owner
     * @param amount - how many tokens will back to owner
     */
    event WithdrawTokens(uint256 amount, address to);

    /**
     * @dev 'ClaimToken' return to member how many tokens
     * he will receive after success transactions
     * @notice used in function 'claimToken'
     *
     * @param to - address of member
     * @param amount - how many tokens send to member
     */
    event ClaimToken(uint256 amount, address to);

    /**
     * @dev 'ClaimEther' return to member how many ethers
     * he will receive after success transactions
     * @notice used in function 'claimEther'
     *
     * @param to - address of member
     * @param amount - how many ethers send to member
     */
    event ClaimEther(uint256 amount, address to);

    /**
     * @dev modifier which contains conditions who's can call functions
     *
     * NOTE : if function have 'onlyOwner' thats mean call this function
     * can only address which contained in '_owner'
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, "Error : caller is not the owner");
        _;
    }

    /**
     * @dev Set 'token' IERC20 to interact with thrid party token
     *
     * Put address to state variable '_owner'
     *
     * @param token_ - of ERC20 contract
     */
    constructor(address token_) EIP712("AirDrop", "3") {
        require(
            token_.code.length > 0,
            "Error : Incorrect address , only contract address"
        );
        token = IERC20(token_);
        _owner = msg.sender;
    }

    /**
     * @dev send ERC20 tokens from 'owner_' balance to SC
     *
     * @param amount_ - how many tokens deposits
     *
     * NOTE : this function use wrapper of safeERC20 library
     * check 'SafeERC20.sol' for more information
     */
    function depositTokens(uint256 amount_) external onlyOwner {
        require(amount_ != 0, "Error : 'Amount' , equal to 0");
        token.safeTransferFrom(msg.sender, address(this), amount_);
        emit DepositTokens(amount_);
    }

    /**
     * @dev send ethers from 'owner_' balance to SC
     *
     * NOTE : if you send ether to 0 address , ethers will be blocked.
     */
    function depositEther() external payable onlyOwner {
        require(msg.value != 0, "Error : 'Amount' , equal to 0");
    }

    /**
     * @dev make tokens available for members to withdraw
     *
     * @param recepients_ - address of member
     * @param amount_ - how many tokens will be available
     * @param deadline_ - how long signature will be valid
     * @param v_ - can be only 27 or 28
     * @param r_ - contain info to recover signer
     * @param s_ - contain info to recover signer
     *
     * NOTE : more information 'EIP712'
     */
    function dropTokens(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external onlyOwner {
        require(
            amount_ != 0 && recepients_ != address(0) && deadline_ != 0,
            "Error :'recepients_' or 'amount_' or 'deadline_' equal to 0"
        );
        bytes32 structHash = keccak256(
            abi.encode(DROP_HASH, recepients_, amount_, deadline_)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        require(
            _owner == ECDSA.recover(digest, v_, r_, s_),
            "invalid signature"
        );
        require(
            block.timestamp < deadline_,
            "MyFunction: signed transaction expired"
        );

        balanceOfTokens[recepients_] += amount_;
        token.approve(recepients_, amount_);
        emit DropTokens(recepients_, amount_, deadline_);
    }

    /**
     * @dev make ethers available for members to withdraw
     *
     * @param recepients_ - address of member
     * @param amount_ - how many ethers will be available
     * @param deadline_ - how long signature will be valid
     * @param v_ - can be only 27 or 28
     * @param r_ - contain info to recover signer
     * @param s_ - contain info to recover signer
     *
     * NOTE : more information 'EIP712'
     */
    function dropEther(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external onlyOwner {
        require(
            amount_ != 0 && recepients_ != address(0) && deadline_ != 0,
            "Error :'recepients_' or 'amount_' or 'deadline_' equal to 0"
        );
        bytes32 structHash = keccak256(
            abi.encode(DROP_HASH, recepients_, amount_, deadline_)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        require(
            _owner == ECDSA.recover(digest, v_, r_, s_),
            "invalid signature"
        );
        require(
            block.timestamp < deadline_,
            "MyFunction: signed transaction expired"
        );

        balanceOfEther[recepients_] += amount_;
        emit DropEther(recepients_, amount_, deadline_);
    }

    /**
     * @dev Change actually ERC20
     *
     * @param token_ - address of new ERC20 which connected
     * to 'this' contract
     */
    function updateTokenAddress(address token_) external onlyOwner {
        require(
            token_.code.length > 0,
            "Error : Incorrect address , only contract address"
        );
        token = IERC20(token_);
        emit NewContractAddress(token_);
    }

    /**
     * @dev This function return tokens to 'owner'
     *
     * NOTE: withdraw all available tokens
     */
    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Error : No availabale tokens to withdraw");
        emit WithdrawTokens(balance, msg.sender);
        token.safeTransfer(msg.sender, balance);
    }

    /**
     * @dev This function return ether to 'owner'
     *
     * NOTE: withdraw all available ether
     */
    function withdrawEther() external onlyOwner {
        require(
            address(this).balance > 0,
            "Error : No availabale ether to withdraw"
        );
        emit WithdrawEther(address(this).balance, msg.sender);
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * @dev allows to claim available tokens
     * to the member
     *
     * NOTE: withdraw all available tokens , you can call
     * this function only if you have available tokens
     */
    function claimToken() external {
        address member = msg.sender;
        uint256 amountOfTokens = balanceOfTokens[member];
        require(amountOfTokens > 0, "No availabale tokens to claim");
        balanceOfTokens[member] -= amountOfTokens;
        token.safeTransfer(member, amountOfTokens);
        emit ClaimToken(amountOfTokens, member);
    }

    /**
     * @dev allows to claim available ether
     * to the member
     *
     * NOTE: withdraw all available ether , you can call
     * this function only if you have available ether
     */
    function claimEther() external {
        address member = msg.sender;
        uint256 amountOfEther = balanceOfEther[member];
        require(amountOfEther > 0, "No availabale ether to claim");
        balanceOfEther[member] -= amountOfEther;
        payable(member).transfer(amountOfEther);
        emit ClaimEther(amountOfEther, member);
    }
}

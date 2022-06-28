// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAirDrop.sol";

/**
 * @title AirDrop
 * @author ZaniInc
 * @notice This smart contract is for send free tokens to loyal
 * members of crypto-project
 */
contract AirDrop is EIP712, IAirDrop, Ownable {
    using SafeERC20 for IERC20;
    using Address for address;

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
        keccak256(
            "Drop(uint256[] amount,uint256 deadline,address[] recepient,bool ether)"
        );

    IERC20 public token;

    /**
     * @dev Set 'token' IERC20 to interact with thrid party token
     *
     * Put address to state variable '_owner'
     *
     * @param token_ - of ERC20 contract
     */
    constructor(address token_) EIP712("AirDrop", "1") {
        Address.isContract(token_);
        token = IERC20(token_);
    }

    /**
     * @dev send ERC20 tokens from 'owner_' balance to SC
     *
     * @param amount_ - how many tokens deposits
     *
     * NOTE : this function use wrapper of safeERC20 library
     * check 'SafeERC20.sol' for more information
     */
    function depositTokens(uint256 amount_) external override onlyOwner {
        require(amount_ != 0, "Error : 'Amount' , equal to 0");
        token.safeTransferFrom(msg.sender, address(this), amount_);
        emit DepositTokens(amount_);
    }

    /**
     * @dev send ethers from 'owner_' balance to SC
     *
     * NOTE : if you send ether to 0 address , ethers will be blocked.
     */
    function depositEther() external payable override onlyOwner {
        require(msg.value != 0, "Error : 'Amount' , equal to 0");
        emit DepositEther(msg.value);
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
        address[] calldata recepients_,
        uint256[] calldata amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external override onlyOwner {
        require(
            recepients_.length == amount_.length,
            "Error : arrays have different length"
        );
        bytes32 structHash = keccak256(
            abi.encode(
                DROP_HASH,
                keccak256(abi.encodePacked(amount_)),
                deadline_,
                keccak256(abi.encodePacked(recepients_)),
                false
            )
        );
        bytes32 digest = EIP712._hashTypedDataV4(structHash);

        address msgSigner = ECDSA.recover(digest, v_, r_, s_);
        require(msg.sender == msgSigner, "invalid signature");
        require(
            block.timestamp < deadline_,
            "Error : signed transaction expired"
        );

        for (uint256 i; i < recepients_.length; i++) {
            require(
                amount_[i] != 0 && recepients_[i] != address(0),
                "Error :'recepients_' or 'amount_' equal to 0"
            );
            balanceOfTokens[recepients_[i]] += amount_[i];
        }
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
        address[] calldata recepients_,
        uint256[] calldata amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external override onlyOwner {
        require(
            recepients_.length == amount_.length,
            "Error : arrays have different length"
        );
        bytes32 structHash = keccak256(
            abi.encode(
                DROP_HASH,
                keccak256(abi.encodePacked(amount_)),
                deadline_,
                keccak256(abi.encodePacked(recepients_)),
                true
            )
        );
        bytes32 digest = EIP712._hashTypedDataV4(structHash);

        address msgSigner = ECDSA.recover(digest, v_, r_, s_);
        require(msg.sender == msgSigner, "invalid signature");
        require(
            block.timestamp < deadline_,
            "Error : signed transaction expired"
        );
        for (uint256 i; i < recepients_.length; i++) {
            require(
                amount_[i] != 0 && recepients_[i] != address(0),
                "Error :'recepients_' or 'amount_' equal to 0"
            );
            balanceOfEther[recepients_[i]] += amount_[i];
        }
        emit DropEther(recepients_, amount_, deadline_);
    }

    /**
     * @dev Change actually ERC20
     *
     * @param token_ - address of new ERC20 which connected
     * to 'this' contract
     */
    function updateTokenAddress(address token_) external override onlyOwner {
        require(
            Address.isContract(token_) == true,
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
    function withdrawTokens() external override onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Error : No availabale tokens to withdraw");
        token.safeTransfer(msg.sender, balance);
        emit WithdrawTokens(msg.sender, balance);
    }

    /**
     * @dev This function return ether to 'owner'
     *
     * NOTE: withdraw all available ether
     */
    function withdrawEther() external override onlyOwner {
        require(
            address(this).balance > 0,
            "Error : No availabale ether to withdraw"
        );
        uint256 value = address(this).balance;
        Address.sendValue(payable(msg.sender), address(this).balance);
        emit WithdrawEther(msg.sender, value);
    }

    /**
     * @dev allows to claim available tokens
     * to the member
     *
     * NOTE: withdraw all available tokens , you can call
     * this function only if you have available tokens
     */
    function claimToken() external override {
        address member = msg.sender;
        uint256 balance = balanceOfTokens[member];
        require(balance > 0, "Error : No available tokens to claim");
        balanceOfTokens[member] = 0;
        token.safeTransfer(member, balance);
        emit ClaimToken(member, balance);
    }

    /**
     * @dev allows to claim available ether
     * to the member
     *
     * NOTE: withdraw all available ether , you can call
     * this function only if you have available ether
     */
    function claimEther() external override {
        address member = msg.sender;
        uint256 balance = balanceOfEther[member];
        require(balance > 0, "Error : No available ether to claim");
        balanceOfEther[member] = 0;
        Address.sendValue(payable(member), balance);
        emit ClaimEther(member, balance);
    }
}

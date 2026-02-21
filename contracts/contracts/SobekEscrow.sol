// SPDX-License-Identifier: WTFPL
pragma solidity 0.8.34;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/////////////////////////////////////////////////////////////////
//////////                CUSTOM ERRORS                //////////
/////////////////////////////////////////////////////////////////

/**
 * @dev Error that occurs when the `msg.value` is not equal to
 * `value` when an ether value is deposited into the smart contract.
 */
error ValueMismatch();

/**
 * @dev Error that occurs when the receiver address is not equal
 * to the deposit address of the winner.
 * @param receiverAddress The defined receiver address by the
 * loser address.
 * @param winnerAddress The address that won the bet.
 */
error AddressMismatch(address receiverAddress, address winnerAddress);

/// @dev Error that occurs when sending ether has failed.
error EtherTransferFail();

/// @dev Error that occurs when an escrow has already been released.
error AlreadyReleased();

/////////////////////////////////////////////////////////////////
//////////               ESCROW CONTRACT               //////////
/////////////////////////////////////////////////////////////////

/**
 * @title A simple multilateral escrow smart contract for ETH and ERC-20 tokens.
 * @dev Forked from https://github.com/pcaversaccio/escrow-contract
 */

contract SobekEscrow is AccessControl {
    using SafeERC20 for IERC20;

    uint256 public escrowCount;
    bytes32 public constant ARBITER = keccak256("ARBITER");

    address payable public immutable platformWallet;
    uint256 public immutable platformFeeBps;

    mapping(uint256 => Escrow) public escrows;

    struct Escrow {
        address payable depositor;
        address payable receiver;
        IERC20 token;
        uint256 value;
    }

    /**
     * @dev Event that is emitted when a deposit is successful.
     * @param depositor The account that sends the funds.
     * @param receiver The account that receives the funds.
     * @param token The ERC-20 token that is used for the funds.
     * @param amount The amount of funds; either ether in wei or
     * ERC-20 token amount.
     * @param registration Registration index of the escrow
     * deposit account.
     * @param details The description of the escrow context.
     */
    event Deposit(
        address indexed depositor,
        address indexed receiver,
        IERC20 token,
        uint256 amount,
        uint256 indexed registration,
        string details
    );

    /**
     * @dev Event that is emitted when a deposit is successfully
     * released to the winner address.
     * @param registration The registration index of the escrow
     * deposit account that lost the bet.
     */
    event Release(uint256 indexed registration);

    /**
     * @dev Event that is emitted when escrowed funds are released
     * directly to the receiver (e.g. auto-release after escrow period).
     * @param registration The registration index of the escrow.
     */
    event ReleaseToReceiver(uint256 indexed registration);

    /**
     * @dev Event that is emitted when the winner's stake is
     * successfully refunded.
     * @param winnerRefundRegistration The registration index of
     * the winner of the bet to which the deposits are returned.
     */
    event WinnerRefund(uint256 indexed winnerRefundRegistration);

    /**
     * @dev Event that is emitted when a platform fee is taken
     * from a released escrow.
     * @param platform The platform wallet that received the fee.
     * @param amount The fee amount taken.
     * @param registration The registration index of the escrow.
     */
    event FeeTaken(address indexed platform, uint256 amount, uint256 indexed registration);

    /**
     * @dev You can cut out 10 opcodes in the creation-time EVM bytecode
     * if you declare a constructor `payable`.
     *
     * For more in-depth information see here:
     * https://forum.openzeppelin.com/t/a-collection-of-gas-optimisation-tricks/19966/5
     */
    constructor(address _arbiter, address payable _platformWallet, uint256 _platformFeeBps) payable {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARBITER, _arbiter);
        platformWallet = _platformWallet;
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @notice Deposits ETH/ERC-20 into the escrow.
     * @param receiver The account that receives the funds.
     * @param token The ERC-20 token that is used for the funds.
     * @param value The amount of funds; either ether in wei or
     * ERC-20 token amount.
     * @param details Describes the context of escrow - stamped
     * into an event.
     */
    function deposit(
        address receiver,
        IERC20 token,
        uint256 value,
        string calldata details
    ) public payable {
        if (address(token) == address(0)) {
            /// @dev Deposits ether value into the smart contract.
            if (msg.value != value) revert ValueMismatch();
        } else {
            /// @dev Safely deposits an ERC-20 token into the smart contract.
            token.safeTransferFrom(payable(msg.sender), address(this), value);
        }

        /**
         * @notice Increments registered escrows and assigns a number
         * to the escrow deposit.
         * @dev Cannot realistically overflow.
         */
        unchecked {
            ++escrowCount;
        }
        uint256 registration = escrowCount;
        escrows[registration] = Escrow(payable(msg.sender), payable(receiver), token, value);

        emit Deposit(msg.sender, receiver, token, value, registration, details);
    }

    /**
     * @notice Releases escrowed assets to designated `receiver`.
     * @dev The function `release` is payable in order to save gas.
     * @param registration An array of registration indices of the escrow
     * deposit accounts that lost the bet.
     * @param winnerRefundRegistration The registration index of the winner
     * of the bet to which the deposits are returned.
     */
    function release(
        uint256[] calldata registration,
        uint256 winnerRefundRegistration
    ) public payable onlyRole(ARBITER) {
        Escrow storage escrowRevert = escrows[winnerRefundRegistration];
        uint256 length = registration.length;

        /**
         * @dev Loops over the array of registration indices of
         * the escrow deposit accounts that lost the bet.
         */
        for (uint256 i; i < length; ++i) {
            Escrow storage escrow = escrows[registration[i]];
            /**
             * @dev Requires that the receiver address is equal
             * to the deposit address of the winner.
             */
            if (escrow.receiver != escrowRevert.depositor)
                revert AddressMismatch(escrow.receiver, escrowRevert.depositor);

            if (address(escrow.token) == address(0)) {
                /// @dev Distributes the ether value to the winner address.
                // solhint-disable-next-line avoid-low-level-calls
                (bool success, ) = escrow.receiver.call{value: escrow.value}("");
                if (!success) revert EtherTransferFail();
            } else {
                /// @dev Safely distributes the ERC-20 token to the winner address.
                escrow.token.safeTransfer(escrow.receiver, escrow.value);
            }

            emit Release(registration[i]);
        }

        /// @dev Refunds the original winner stake.
        if (address(escrowRevert.token) == address(0)) {
            /// @dev Refunds the ether value to the winner address.
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, ) = escrowRevert.depositor.call{value: escrowRevert.value}("");
            if (!success) revert EtherTransferFail();
        } else {
            /// @dev Safely refunds the ERC-20 token to the winner address.
            escrowRevert.token.safeTransfer(escrowRevert.depositor, escrowRevert.value);
        }

        emit WinnerRefund(winnerRefundRegistration);
    }

    /**
     * @notice Releases escrowed funds directly to the receiver.
     * @dev One-sided release used for auto-release after escrow period.
     * @param registration The registration index of the escrow deposit.
     */
    function releaseToReceiver(uint256 registration) public payable onlyRole(ARBITER) {
        Escrow storage escrow = escrows[registration];
        uint256 amount = escrow.value;
        if (amount == 0) revert AlreadyReleased();

        // Zero out before external call (CEI pattern — prevents reentrancy + double-spend)
        escrow.value = 0;

        uint256 fee = (amount * platformFeeBps) / 10000;
        uint256 sellerAmount = amount - fee;

        if (address(escrow.token) == address(0)) {
            (bool success, ) = escrow.receiver.call{value: sellerAmount}("");
            if (!success) revert EtherTransferFail();
            if (fee > 0) {
                (bool feeSuccess, ) = platformWallet.call{value: fee}("");
                if (!feeSuccess) revert EtherTransferFail();
            }
        } else {
            escrow.token.safeTransfer(escrow.receiver, sellerAmount);
            if (fee > 0) {
                escrow.token.safeTransfer(platformWallet, fee);
            }
        }

        emit FeeTaken(platformWallet, fee, registration);
        emit ReleaseToReceiver(registration);
    }
}

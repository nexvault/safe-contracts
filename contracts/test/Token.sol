// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.7.0;

/**
 * @title Token interface.
 */
interface Token {
    function transfer(address _to, uint256 value) external returns (bool);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {CommodiFiVault} from "../src/CommodiFiVault.sol";

/**
 * @dev Shared deployment + actors for CommodiFi tests. Wires one of the four assets (gold)
 *      end-to-end and exposes raw deploy helpers for tests that need custom setups.
 */
abstract contract Base is Test {
    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    PriceOracle internal oracle;
    CommodiFiVault internal vault;
    RWAToken internal gold;

    // 8-decimal USD reference prices.
    uint256 internal constant GOLD_PRICE = 2_400e8; // ~$2,400 / oz

    function _deployCore() internal {
        vm.startPrank(owner);
        oracle = new PriceOracle(owner);
        vault = new CommodiFiVault(address(oracle), owner);

        gold = new RWAToken("CommodiFi Gold", "tGOLD", "Emas Antam (Gold)", "gram", "XAU", owner);
        gold.setVault(address(vault));

        vault.registerAsset(address(gold), "Precious Metal");
        oracle.setPrice(address(gold), GOLD_PRICE);
        vm.stopPrank();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracleTest is Test {
    address owner = makeAddr("owner");
    address user = makeAddr("user");
    address tokenA = makeAddr("tokenA");
    address tokenB = makeAddr("tokenB");

    PriceOracle oracle;

    function setUp() public {
        vm.prank(owner);
        oracle = new PriceOracle(owner);
    }

    function test_Decimals() public view {
        assertEq(oracle.DECIMALS(), 8);
    }

    function test_SetPrice() public {
        vm.prank(owner);
        oracle.setPrice(tokenA, 2_400e8);

        assertEq(oracle.getPrice(tokenA), 2_400e8);
        assertTrue(oracle.hasPrice(tokenA));

        (uint256 price, uint256 updatedAt) = oracle.getPriceData(tokenA);
        assertEq(price, 2_400e8);
        assertEq(updatedAt, block.timestamp);
    }

    function test_SetPrice_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit PriceOracle.PriceUpdated(tokenA, 2_400e8, block.timestamp);
        vm.prank(owner);
        oracle.setPrice(tokenA, 2_400e8);
    }

    function test_SetPrice_Updates() public {
        vm.startPrank(owner);
        oracle.setPrice(tokenA, 2_400e8);

        vm.warp(block.timestamp + 1 days);
        oracle.setPrice(tokenA, 2_500e8);
        vm.stopPrank();

        (uint256 price, uint256 updatedAt) = oracle.getPriceData(tokenA);
        assertEq(price, 2_500e8);
        assertEq(updatedAt, block.timestamp);
    }

    function test_SetPrices_Batch() public {
        address[] memory tokens = new address[](2);
        tokens[0] = tokenA;
        tokens[1] = tokenB;
        uint256[] memory prices = new uint256[](2);
        prices[0] = 2_400e8;
        prices[1] = 158e8;

        vm.prank(owner);
        oracle.setPrices(tokens, prices);

        assertEq(oracle.getPrice(tokenA), 2_400e8);
        assertEq(oracle.getPrice(tokenB), 158e8);
    }

    function test_SetPrices_RevertWhen_LengthMismatch() public {
        address[] memory tokens = new address[](2);
        uint256[] memory prices = new uint256[](1);

        vm.prank(owner);
        vm.expectRevert("PriceOracle: length mismatch");
        oracle.setPrices(tokens, prices);
    }

    function test_SetPrice_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        oracle.setPrice(tokenA, 2_400e8);
    }

    function test_SetPrice_RevertWhen_ZeroToken() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.ZeroAddress.selector);
        oracle.setPrice(address(0), 2_400e8);
    }

    function test_SetPrice_RevertWhen_ZeroPrice() public {
        vm.prank(owner);
        vm.expectRevert(PriceOracle.ZeroPrice.selector);
        oracle.setPrice(tokenA, 0);
    }

    function test_GetPrice_RevertWhen_NotSet() public {
        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PriceNotSet.selector, tokenA));
        oracle.getPrice(tokenA);
    }

    function test_HasPrice_FalseByDefault() public view {
        assertFalse(oracle.hasPrice(tokenA));
    }

    function testFuzz_SetGetPrice(uint256 price) public {
        price = bound(price, 1, type(uint256).max);
        vm.prank(owner);
        oracle.setPrice(tokenA, price);
        assertEq(oracle.getPrice(tokenA), price);
    }
}

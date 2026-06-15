// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RWATokenTest is Test {
    address owner = makeAddr("owner");
    address vault = makeAddr("vault");
    address user = makeAddr("user");

    RWAToken token;

    function setUp() public {
        vm.prank(owner);
        token = new RWAToken("CommodiFi Gold", "tGOLD", "Emas Antam (Gold)", "gram", "XAU", owner);
    }

    function test_Metadata() public view {
        assertEq(token.name(), "CommodiFi Gold");
        assertEq(token.symbol(), "tGOLD");
        assertEq(token.decimals(), 18);
        assertEq(token.assetName(), "Emas Antam (Gold)");
        assertEq(token.unit(), "gram");
        assertEq(token.referenceSymbol(), "XAU");
        assertEq(token.owner(), owner);

        (
            string memory name_,
            string memory symbol_,
            string memory assetName_,
            string memory unit_,
            string memory ref_
        ) = token.metadata();
        assertEq(name_, "CommodiFi Gold");
        assertEq(symbol_, "tGOLD");
        assertEq(assetName_, "Emas Antam (Gold)");
        assertEq(unit_, "gram");
        assertEq(ref_, "XAU");
    }

    function test_SetVault() public {
        vm.prank(owner);
        token.setVault(vault);
        assertEq(token.vault(), vault);
    }

    function test_SetVault_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit RWAToken.VaultUpdated(address(0), vault);
        vm.prank(owner);
        token.setVault(vault);
    }

    function test_SetVault_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        token.setVault(vault);
    }

    function test_SetVault_RevertWhen_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(RWAToken.ZeroAddress.selector);
        token.setVault(address(0));
    }

    function test_Mint_OnlyVault() public {
        vm.prank(owner);
        token.setVault(vault);

        vm.prank(vault);
        token.mint(user, 100e18);
        assertEq(token.balanceOf(user), 100e18);
        assertEq(token.totalSupply(), 100e18);
    }

    function test_Mint_RevertWhen_NotVault() public {
        vm.prank(owner);
        token.setVault(vault);

        // even the owner cannot mint; only the vault can.
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVault.selector, owner));
        token.mint(user, 100e18);
    }

    function test_Burn_OnlyVault() public {
        vm.prank(owner);
        token.setVault(vault);

        vm.startPrank(vault);
        token.mint(user, 100e18);
        token.burn(user, 40e18);
        vm.stopPrank();

        assertEq(token.balanceOf(user), 60e18);
        assertEq(token.totalSupply(), 60e18);
    }

    function test_Burn_RevertWhen_NotVault() public {
        vm.prank(owner);
        token.setVault(vault);
        vm.prank(vault);
        token.mint(user, 100e18);

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVault.selector, user));
        token.burn(user, 10e18);
    }

    function test_Mint_RevertWhen_VaultUnset() public {
        // vault defaults to address(0); a real caller is never the vault, so mint is impossible.
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVault.selector, user));
        token.mint(user, 1e18);
    }

    function testFuzz_MintBurn(uint256 mintAmt, uint256 burnAmt) public {
        mintAmt = bound(mintAmt, 1, type(uint128).max);
        burnAmt = bound(burnAmt, 0, mintAmt);

        vm.prank(owner);
        token.setVault(vault);

        vm.startPrank(vault);
        token.mint(user, mintAmt);
        token.burn(user, burnAmt);
        vm.stopPrank();

        assertEq(token.balanceOf(user), mintAmt - burnAmt);
        assertEq(token.totalSupply(), mintAmt - burnAmt);
    }
}

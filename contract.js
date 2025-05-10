/**
 *Submitted for verification at testnet.bscscan.com on 2025-05-05
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(msg.sender);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

contract dambi is IERC20, Ownable {
    string private _name = "fpvtoken";
    string private _symbol = "fpv";
    uint8 private _decimals = 18;
    uint256 private _totalSupply = 1000000000 * (10 ** decimals());

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => uint256) private _lastTxBlock;
    uint256 private _cooldownBlocks = 2;

    constructor () {
        _balances[owner()] = _totalSupply;
        emit Transfer(address(0), owner(), _totalSupply);
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address owner = msg.sender;
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        if (from != owner()) {
            require(_lastTxBlock[from] < block.number, "Anti-bot: wait for next block");
            _lastTxBlock[from] = block.number;
        }

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    function withdraw() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No BNB to withdraw");
        payable(owner()).transfer(contractBalance);
    }



    receive() external payable {}

    // ========== NFT Logic =============
    uint256 public nftPrice = 0.01 ether;
    uint256 public maxNFTSupply = 500;
    uint256 public totalNFTsMinted;
    mapping(uint256 => address) public nftOwners;

    string private baseTokenURI;

    function setBaseURI(string memory uri) external onlyOwner {
        baseTokenURI = uri;
    }

    function _baseURI() internal view returns (string memory) {
        return baseTokenURI;
    }

    function mintNFT() external payable {
        require(msg.value >= nftPrice, "Insufficient BNB sent");
        require(totalNFTsMinted < maxNFTSupply, "All NFTs have been minted");

        uint256 tokenId = totalNFTsMinted + 1;
        nftOwners[tokenId] = msg.sender;
        totalNFTsMinted++;

        emit NFTTransfer(address(0), msg.sender, tokenId);
        _transfer(owner(), msg.sender, 1000 * (10 ** uint256(_decimals)));
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(tokenId > 0 && tokenId <= totalNFTsMinted, "Invalid tokenId");
        return string(abi.encodePacked(_baseURI(), uint2str(tokenId), ".json"));
    }

    function airdropNFT(address to) external onlyOwner {
        require(totalNFTsMinted < maxNFTSupply, "All NFTs have been minted");
        require(to != address(0), "Invalid address");

        uint256 tokenId = totalNFTsMinted + 1;
        nftOwners[tokenId] = to;
        totalNFTsMinted++;

        emit NFTTransfer(address(0), to, tokenId);
        _transfer(owner(), to, 1000 * (10 ** uint256(_decimals)));
    }

    function bulkAirdropNFT(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            require(totalNFTsMinted < maxNFTSupply, "Max supply reached");
            require(recipients[i] != address(0), "Invalid address");

            uint256 tokenId = totalNFTsMinted + 1;
            nftOwners[tokenId] = recipients[i];
            totalNFTsMinted++;

            emit NFTTransfer(address(0), recipients[i], tokenId);
            _transfer(owner(), recipients[i], 1000 * (10 ** uint256(_decimals)));
        }
    }

    function getNFTsOwned(address user) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](totalNFTsMinted);
        uint256 count = 0;
        for (uint256 i = 1; i <= totalNFTsMinted; i++) {
            if (nftOwners[i] == user) {
                result[count] = i;
                count++;
            }
        }
        bytes memory encoded = abi.encode(result);
        assembly {
            mstore(add(encoded, 0x40), count)
        }
        return abi.decode(encoded, (uint256[]));
    }

    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        require(tokenId > 0 && tokenId <= totalNFTsMinted, "Invalid tokenId");
        return nftOwners[tokenId];
    }

    function nftBalanceOf(address ownerAddr) public view returns (uint256) {
        require(ownerAddr != address(0), "Zero address");
        uint256 count = 0;
        for (uint256 i = 1; i <= totalNFTsMinted; i++) {
            if (nftOwners[i] == ownerAddr) {
                count++;
            }
        }
        return count;
    }

    event NFTTransfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function transferNFT(address to, uint256 tokenId) external {
        require(to != address(0), "Invalid address");
        require(nftOwners[tokenId] == msg.sender, "Caller is not the owner");

        nftOwners[tokenId] = to;
        emit NFTTransfer(msg.sender, to, tokenId);
    }

    // Function to change the mint price
    function setMintPrice(uint256 newPrice) external onlyOwner {
        nftPrice = newPrice;
    }

// Airdrop ERC20 tokens to multiple recipients
function airdropTokens(address[] calldata recipients, uint256 amount) external onlyOwner {
    require(recipients.length > 0, "No recipients provided");
    for (uint256 i = 0; i < recipients.length; i++) {
        require(recipients[i] != address(0), "Invalid address");
        _transfer(owner(), recipients[i], amount);  // Transfer tokens from the owner
    }

 }
}
contract Presale {

    address public owner;
    uint256 public presalePrice; // The price of tokens during the presale, can be changed manually
    uint256 public presaleTokensAvailable; // Tokens available for presale
    uint256 private _decimals = 18; // Assuming standard token decimals (can be changed to your token's decimals)

    // Constructor to initialize the presale price and available tokens
    constructor(uint256 initialPresalePrice, uint256 initialTokens) {
        owner = msg.sender;  // Set the contract owner
        presalePrice = initialPresalePrice;  // Set the initial price
        presaleTokensAvailable = initialTokens;  // Set the initial number of tokens available
    }

    // Modifier to restrict functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // Presale function to buy tokens during the presale
    function buyPresaleTokens() external payable {
        uint256 amount = msg.value / presalePrice; // Calculate how many tokens the user can buy with the sent BNB
        require(amount > 0, "Send BNB to buy tokens");

        uint256 tokensToTransfer = amount * (10 ** uint256(_decimals)); // Adjust the amount for token decimals

        // Ensure there are enough tokens available in the presale
        require(tokensToTransfer <= presaleTokensAvailable, "Not enough tokens available for sale");

        // Transfer tokens from the owner (presale contract holder) to the buyer
        _transfer(owner, msg.sender, tokensToTransfer);

        // Update the available tokens for sale
        presaleTokensAvailable -= tokensToTransfer;
    }

    // Function to update the presale price (only callable by the contract owner)
    function setPresalePrice(uint256 newPrice) external onlyOwner {
        presalePrice = newPrice; // Update the price
    }

    // Function to withdraw any funds collected during presale (if needed)
    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance); // Transfer the contract balance to the owner
    }

    // Private transfer function to simulate token transfer (should be replaced with your own token logic)
    function _transfer(address from, address to, uint256 amount) private {
        // Your actual token transfer logic should be here
        // For example, transferring tokens from the owner to the buyer
    }
}
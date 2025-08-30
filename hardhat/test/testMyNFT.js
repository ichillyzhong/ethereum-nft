const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let myNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get test accounts
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy(owner.address);
  });

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      expect(await myNFT.name()).to.equal("MyNFT");
      expect(await myNFT.symbol()).to.equal("MNFT");
    });

    it("should set correct owner", async function () {
      expect(await myNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting NFT", function () {
    it("owner should be able to mint NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(myNFT.mintNFT(addr1.address, tokenURI))
        .to.emit(myNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("non-owner should not be able to mint NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(
        myNFT.connect(addr1).mintNFT(addr2.address, tokenURI)
      ).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
    });

    it("should be able to mint multiple NFTs", async function () {
      const tokenURI1 = "https://example.com/token/1";
      const tokenURI2 = "https://example.com/token/2";

      await myNFT.mintNFT(addr1.address, tokenURI1);
      await myNFT.mintNFT(addr2.address, tokenURI2);

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(2)).to.equal(addr2.address);
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await myNFT.tokenURI(2)).to.equal(tokenURI2);
    });

    it("tokenId should increment", async function () {
      await myNFT.mintNFT(addr1.address, "uri1");
      await myNFT.mintNFT(addr1.address, "uri2");
      await myNFT.mintNFT(addr1.address, "uri3");

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(2)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(3)).to.equal(addr1.address);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(3);
    });
  });

  describe("ERC721 functionality", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "https://example.com/token/1");
    });

    it("should support ERC721 interface", async function () {
      // ERC721 interface ID: 0x80ac58cd
      expect(await myNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("NFT holder should be able to transfer NFT", async function () {
      await expect(
        myNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.emit(myNFT, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await myNFT.ownerOf(1)).to.equal(addr2.address);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
    });

    it("should be able to approve and transfer NFT", async function () {
      await myNFT.connect(addr1).approve(addr2.address, 1);
      expect(await myNFT.getApproved(1)).to.equal(addr2.address);

      await myNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      expect(await myNFT.ownerOf(1)).to.equal(addr2.address);
    });
  });

  describe("Error handling", function () {
    it("querying non-existent token should fail", async function () {
      await expect(myNFT.ownerOf(999))
        .to.be.revertedWithCustomError(myNFT, "ERC721NonexistentToken");
    });

    it("querying non-existent tokenURI should fail", async function () {
      await expect(myNFT.tokenURI(999))
        .to.be.revertedWithCustomError(myNFT, "ERC721NonexistentToken");
    });
  });
});
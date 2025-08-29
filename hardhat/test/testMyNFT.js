const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let myNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy(owner.address);
  });

  describe("部署", function () {
    it("应该设置正确的名称和符号", async function () {
      expect(await myNFT.name()).to.equal("MyNFT");
      expect(await myNFT.symbol()).to.equal("MNFT");
    });

    it("应该设置正确的所有者", async function () {
      expect(await myNFT.owner()).to.equal(owner.address);
    });
  });

  describe("铸造NFT", function () {
    it("所有者应该能够铸造NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(myNFT.mintNFT(addr1.address, tokenURI))
        .to.emit(myNFT, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("非所有者不应该能够铸造NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      
      await expect(
        myNFT.connect(addr1).mintNFT(addr2.address, tokenURI)
      ).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
    });

    it("应该能够铸造多个NFT", async function () {
      const tokenURI1 = "https://example.com/token/1";
      const tokenURI2 = "https://example.com/token/2";

      await myNFT.mintNFT(addr1.address, tokenURI1);
      await myNFT.mintNFT(addr2.address, tokenURI2);

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(2)).to.equal(addr2.address);
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await myNFT.tokenURI(2)).to.equal(tokenURI2);
    });

    it("tokenId应该递增", async function () {
      await myNFT.mintNFT(addr1.address, "uri1");
      await myNFT.mintNFT(addr1.address, "uri2");
      await myNFT.mintNFT(addr1.address, "uri3");

      expect(await myNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(2)).to.equal(addr1.address);
      expect(await myNFT.ownerOf(3)).to.equal(addr1.address);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(3);
    });
  });

  describe("ERC721功能", function () {
    beforeEach(async function () {
      await myNFT.mintNFT(addr1.address, "https://example.com/token/1");
    });

    it("应该支持ERC721接口", async function () {
      // ERC721接口ID: 0x80ac58cd
      expect(await myNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("NFT持有者应该能够转移NFT", async function () {
      await expect(
        myNFT.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      ).to.emit(myNFT, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);

      expect(await myNFT.ownerOf(1)).to.equal(addr2.address);
      expect(await myNFT.balanceOf(addr1.address)).to.equal(0);
      expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
    });

    it("应该能够批准和转移NFT", async function () {
      await myNFT.connect(addr1).approve(addr2.address, 1);
      expect(await myNFT.getApproved(1)).to.equal(addr2.address);

      await myNFT.connect(addr2).transferFrom(addr1.address, addr2.address, 1);
      expect(await myNFT.ownerOf(1)).to.equal(addr2.address);
    });
  });

  describe("错误处理", function () {
    it("查询不存在的token应该失败", async function () {
      await expect(myNFT.ownerOf(999))
        .to.be.revertedWithCustomError(myNFT, "ERC721NonexistentToken");
    });

    it("查询不存在的tokenURI应该失败", async function () {
      await expect(myNFT.tokenURI(999))
        .to.be.revertedWithCustomError(myNFT, "ERC721NonexistentToken");
    });
  });
});
const presaleConfig = {
  carbon: {
    address: "0x26Fd2AfEc99D76d237727d8Df9c219E527cD6Bcb",
    abi: null // will be loaded from file
  },
  solar: {
    address: "0x4A53f124991F6D4a783eb2acA4e0B6F658b3dB94",
    abi: null // will be loaded from file
  },
  fpv: {
    address: "0x1cC4a0b04f0cD580c497692451579dEC7BA02aE6",
    abi: null // will be loaded from file
  }
};

const manualPrices = {
  carbon: "0.01",   // 0.01 USDT per Carbon token
  solar: "0.01",    // 0.01 USDT per Solar Wind token
  fpv: "0.001"      // 0.001 USDT per FPV token
};

const BNB_USDT_RATE = 600;

function usdtToBnb(usdtAmount) {
  return (parseFloat(usdtAmount) / BNB_USDT_RATE).toString();
}

async function loadAbis() {
  const [carbonAbi, solarAbi, fpvAbi] = await Promise.all([
    fetch('carbon-abi.json').then(res => res.json()),
    fetch('solar-abi.json').then(res => res.json()),
    fetch('fpv-abi.json').then(res => res.json())
  ]);
  presaleConfig.carbon.abi = carbonAbi;
  presaleConfig.solar.abi = solarAbi;
  presaleConfig.fpv.abi = fpvAbi;
}

// Buy token function: user pays in BNB, price shown in USDT
async function buyToken(tokenKey, amountInputId) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      presaleConfig[tokenKey].address,
      presaleConfig[tokenKey].abi,
      signer
    );
    const amount = document.getElementById(amountInputId).value;
    const usdtPrice = manualPrices[tokenKey];
    const totalUsdt = parseFloat(usdtPrice) * parseFloat(amount);
    const bnbAmount = usdtToBnb(totalUsdt);
    const bnbAmountStr = Number(bnbAmount).toFixed(18);

    document.getElementById("presaleStatus").textContent = "⏳ Sending transaction...";
    // Call buyTokens with NO arguments, only value
    const tx = await contract.buyTokens({
      value: ethers.parseEther(bnbAmountStr)
    });
    await tx.wait();
    document.getElementById("presaleStatus").textContent = "✅ Purchase successful!";
  } catch (err) {
    document.getElementById("presaleStatus").textContent = "❌ " + (err.message || "Transaction failed");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("carbonPrice").textContent = manualPrices.carbon;
  document.getElementById("solarPrice").textContent = manualPrices.solar;
  document.getElementById("fpvPrice").textContent = manualPrices.fpv;

  await loadAbis();

  document.getElementById("buyCarbonBtn").onclick = () => buyToken("carbon", "carbonAmount");
  document.getElementById("buySolarBtn").onclick = () => buyToken("solar", "solarAmount");
  document.getElementById("buyFPVBtn").onclick = () => buyToken("fpv", "fpvAmount");
});
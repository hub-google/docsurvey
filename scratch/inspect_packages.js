const GAS_URL = "https://script.google.com/macros/s/AKfycbynW2DFPnxH5RBoF-Net6aJTOwRlH1iGRSswTxHKYs_Ckp1KxkRaB2py_tergHN92mq1Q/exec";
const SECRET_TOKEN = "Antigravity_2026";

async function test() {
  try {
    const res = await fetch(`${GAS_URL}?action=getData&token=${SECRET_TOKEN}&_t=${Date.now()}`);
    const data = await res.json();
    console.log("Package Rows:", JSON.stringify(data.packageData, null, 2));
  } catch (e) {
    console.error("GAS Bridge Failed:", e);
  }
}

test();

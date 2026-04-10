const GAS_URL = "https://script.google.com/macros/s/AKfycbzld7JIDBAIcRm-kPT8MPlsnRPYCklHyWJIRZhpkLbkw5XyuZinB0NZs52qANCcXHvE/exec";
const SECRET_TOKEN = "Antigravity_2026";

async function test() {
  try {
    const res = await fetch(`${GAS_URL}?action=getData&token=${SECRET_TOKEN}`);
    const data = await res.json();
    console.log("GAS Bridge Success!");
    console.log("Login Rows:", data.loginData.length);
    console.log("Package Rows:", data.packageData.length);
    console.log("Member Rows:", data.memberData.length);
    console.log("Registration Rows:", data.registrations.length);
  } catch (e) {
    console.error("GAS Bridge Failed:", e);
  }
}

test();

const { buildModule } = require("@nomicfoundation/ignition-core");

const MyTokenModule = buildModule("MyTokenModule", (m) => {
  const initialSupply = m.getParameter("initialSupply", BigInt(1000) * BigInt(10 ** 18));

  const myToken = m.contract("MyToken", [initialSupply]);

  return { myToken };
});

module.exports = MyTokenModule;

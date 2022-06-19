let domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
];
let drop = [
    { name: "recepient", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "deadline", type: "uint256" },
];
module.exports.domain = domain;
module.exports.drop = drop;

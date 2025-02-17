import { saltNonce } from "./utils/constants";
import { ethers, deployments } from "hardhat";
import { getNXVSingleton, getFactory } from "../test/utils/setup";

async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();    // this will run all deploy scripts
    });
    await setupTests();
    // Set up the ethers signer
    const [deployer, user] = await ethers.getSigners();
    
    const factory = await getFactory();
    const singleton = await getNXVSingleton();
    const singletonAddress = await singleton.getAddress(); // Address of the singleton

    const initializer = singleton.interface.encodeFunctionData("setup", [
        [deployer.address, user.address],
        2,
        "0x542a2e3c52E8C78300906ec29786a9E8dE33C4B9", // CompatibilityFallbackHandler
    ])

    // Call the createProxyWithNonce function
    const tx = await factory.createProxyWithNonce(singletonAddress, initializer, saltNonce);
    const receipt = await tx.wait();
    // console.log('receipt:', receipt, "\n");

    // console.log('Transaction Log:', receipt?.logs, "\n");

    // console.log('Transaction Hash:', receipt?.logs.length, "\n");

    // console.log('Transaction log0:', receipt?.logs[0], "\n");

    console.log('MultiSigWallet proxy contract deployed at:', receipt?.logs[0].address, "\n");
    console.log('GasUsed:', receipt?.gasUsed.toString(), "\n");
    
    // console.log('Transaction log:', receipt?.logs[1].data, "\n");

    // Parse the event to get the proxy address
    // const event = receipt?.events.find((event: { event: string; }) => event.event === "NewMultiSigWalletCreated");
    // const proxyAddress = event.args.wallet;
    // walletProxy Address: 0x0B92A6Ee55E526690c0a31c3753AcC582e12CF45
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

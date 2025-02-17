import hre, { deployments, ethers } from "hardhat";
import { BigNumberish } from "ethers";
import { signTypedData } from "./utils/general";
import { saltNonce } from "./utils/constants";
import { getMultiSendCallOnly, getNXVWithOwners, compatFallbackHandlerDeployment } from "../test/utils/setup";
import { hexDataLength } from "@ethersproject/bytes";

// Only allow call, prohibit delegatecall, it is recommended to use this multiCallOnly contract
async function main() {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();    // this will run all deploy scripts
        const signers = await ethers.getSigners();
        const [user1, user2] = signers;
        console.log(user1.address);
        return {
            nxv: await getNXVWithOwners([user1.address, user2.address], 2, (await compatFallbackHandlerDeployment()).address),
            signers,
        }
    });

    const {nxv, signers} = await setupTests() as {nxv: any, signers: any[]};
    const walletAddress = await nxv.getAddress();

    console.log('NXVProxy will be deployed to:', walletAddress, "\n");
    
    console.log('Sending 0.0001 Ether to this MultiSigWallet contract will be deployed...', "\n");
        await signers[0].sendTransaction({
        to: walletAddress,
        value: ethers.parseEther('0.0001')
    });

    const multiSend = await getMultiSendCallOnly();

    interface Transaction {
        operation: number;
        to: string;
        value: BigNumberish;
        data: string;
      }
    
    const transactions: Transaction[] = [
        {
            operation: 0,
            to: "0x3bC227a261bCf868A2D3c347cf3eea8EdbeDCa6D",
            value: ethers.parseEther("0.00001"),
            data: '0x'
        },
        {
            operation: 0,
            to: "0x3bC227a261bCf868A2D3c347cf3eea8EdbeDCa6D",
            value: ethers.parseEther("0.00001"),
            data: '0x'
        }
    ];

    function encodeTransaction(transaction: Transaction): string {
        const encoded = ethers.solidityPacked(
            ["uint8", "address", "uint256", "uint256", "bytes"],
            [transaction.operation, transaction.to, transaction.value, hexDataLength(transaction.data), transaction.data]
            // hexDataLength(data) return the length of data in bytes, 2 hex characters for 1 byte
        );
        return encoded.slice(2);
    }

    function encodeTransactions(transactions: Transaction[]): string {
        return "0x" + transactions.map(tx => encodeTransaction(tx)).join("");
    }

    const multiData = encodeTransactions(transactions);
    console.log("multiData: ", multiData);
    const callData = multiSend.interface.encodeFunctionData(
        "multiSend",
        [multiData]
    );
    console.log(callData);

    const txData = {
        to: await multiSend.getAddress(),
        value: 0,
        data: callData,
        operation: 1,  // delegatecall
        nonce: saltNonce,
    };

    const sortedSignatures = await signTypedData(txData, walletAddress);

    const transaction = await nxv.execTransaction(
        ...Object.values(txData),
        sortedSignatures,
        // { gasPrice: ethers.utils.parseUnits('2', 'gwei') }
    );
    const receipt = await transaction.wait();
    console.log('Transaction Hash:', receipt?.hash);

    const gasUsed = receipt?.gasUsed;

    console.log('Transaction gasUsed:', gasUsed?.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

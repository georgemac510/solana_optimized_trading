import * as anchor from "@coral-xyz/anchor";  // Updated from @project-serum/anchor
import { Program } from "@coral-xyz/anchor";
import { OptimizedTrading } from "../target/types/optimized_trading";
import { expect } from "chai";
import { Buffer } from "buffer";  // Added Buffer import

describe("optimized_trading", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.OptimizedTrading as Program<OptimizedTrading>;
    const owner = provider.wallet;

    it("Initializes trading account", async () => {
        // Derive PDA for trading account
        const [tradingAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("trading"), owner.publicKey.toBuffer()],
            program.programId
        );

        // Initialize trading account
        await program.methods
            .initializeTradingAccount(bump)
            .accounts({
                tradingAccount,
                owner: owner.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        // Fetch and verify the account
        const account = await program.account.tradingAccount.fetch(tradingAccount);
        expect(account.owner.toString()).to.equal(owner.publicKey.toString());
        expect(account.totalTrades.toNumber()).to.equal(0);
    });

    it("Processes batch trades", async () => {
        const [tradingAccount] = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("trading"), owner.publicKey.toBuffer()],
            program.programId
        );

        const tradeData = [
            {
                amount: new anchor.BN(100),
                tokenMint: anchor.web3.Keypair.generate().publicKey,
            },
            {
                amount: new anchor.BN(200),
                tokenMint: anchor.web3.Keypair.generate().publicKey,
            },
        ];

        await program.methods
            .batchProcessTrades(tradeData)
            .accounts({
                tradingAccount,
                owner: owner.publicKey,
            })
            .rpc();

        const account = await program.account.tradingAccount.fetch(tradingAccount);
        expect(account.totalTrades.toNumber()).to.equal(2);
    });
});
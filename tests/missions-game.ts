import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
import { Program } from "@project-serum/anchor";
import { MissionsGame } from "../target/types/missions_game";
import * as Token from "@solana/spl-token";
import PublicKey = anchor.web3.PublicKey;
import Keypair = anchor.web3.Keypair;
import * as utils from "../test_utils/utils";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { wallet } from "./dev-wallet";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { Connection } from "@solana/web3.js";
import * as spl from "@solana/spl-token";

chai.use(chaiAsPromised);

describe("missions-game", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.MissionsGame as Program<MissionsGame>;
  const provider = utils.getProvider();
  const getProgram = () =>
    anchor.workspace.MissionsGame as Program<MissionsGame>;
  let connection = new Connection("https://api.devnet.solana.com");

  const myKeypair = provider.wallet.payer as anchor.web3.Keypair;

  // the nfts mint address
  const nftMintAddy = new PublicKey(
    "BpHoy9vkgM9873dT7N6dP7PfiLtKAbEyg8gihvpXPMdw"
  );

  // We're going to import our keypair from the wallet file
  const owner = Keypair.fromSecretKey(new Uint8Array(wallet));

  it("Deposit NFT and choose a Mission!", async () => {
    // REMEMBER!!! THE "ALLOW OWNER OFF CURVE" BOOLEAN PARAMETER!!! THIS IS TO GET OR CREATE AN ATA FROM A PDA!!!
    // const escrowPdaPubkey = utils.getOurPda("escrow", owner)[0];
    const [pda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), owner.publicKey.toBuffer()],
      program.programId
    );

    let escrowAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      pda,
      true
    );

    const fromAssociatedTokenAccountAddress =
      await anchor.utils.token.associatedAddress({
        mint: nftMintAddy,
        owner: owner.publicKey,
      });
    const toEscrowTokenAccount = await anchor.utils.token.associatedAddress({
      mint: nftMintAddy,
      owner: escrowAta.address,
    });

    const sx = await program.methods
      .depositPlay(new anchor.BN(1), 0)
      .accounts({
        mintAccount: nftMintAddy,
        fromAssociatedTokenAccount: fromAssociatedTokenAccountAddress,
        owner: owner.publicKey,
        escrowTokenAccount: escrowAta.address,
        payer: owner.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([owner])
      .rpc();

    console.log("Success!");
    console.log(`   Mint Address: ${nftMintAddy}`);
    console.log(`   Tx Signature: ${sx}`);
    console.log("Senders Wallet: ", owner.publicKey);
  });
});

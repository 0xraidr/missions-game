import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
import { Program } from "@project-serum/anchor";
import { MissionsGame } from "../target/types/missions_game";
import * as Token from "@solana/spl-token";
import * as utils from "../test_utils/utils";
import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { wallet } from "./dev-wallet";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

chai.use(chaiAsPromised);

describe("missions-game", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.MissionsGame as Program<MissionsGame>;
  const provider = utils.getProvider();
  let connection = new Connection("https://api.devnet.solana.com");

  // We're going to import our keypair from the wallet file
  const owner = Keypair.fromSecretKey(new Uint8Array(wallet));

  const vaultState = Keypair.generate();

  // the nfts mint address
  const nftMintAddy = new PublicKey(
    "B3JJXuBHtyVUmfPAnTrfXijWimWLeUQnowTzgnT7ZRaz"
  );

  const vaultAuth_seeds = [
    Buffer.from("auth"),
    vaultState.publicKey.toBuffer(),
  ];
  const vaultAuth = PublicKey.findProgramAddressSync(
    vaultAuth_seeds,
    program.programId
  )[0];

  const vault_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
  const vault = PublicKey.findProgramAddressSync(
    vault_seeds,
    program.programId
  )[0];

  it("Is initialized!", async () => {
    // try {
    const txhash = await program.methods
      .initialize()
      .accounts({
        owner: owner.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth,
        vault: vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner, vaultState])
      .rpc();
    console.log(`Success! Check out your TX here:
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    // } catch (e) {
    //   console.error(`Oops, something went wrong: ${e}`);
    // }
  });

  it("Deposit NFT and choose a Mission!", async () => {
    // REMEMBER!!! THE "ALLOW OWNER OFF CURVE" BOOLEAN PARAMETER!!! THIS IS TO GET OR CREATE AN ATA FROM A PDA!!!

    let vaultAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      vaultAuth,
      true
    );

    let ownerAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      owner.publicKey
    );

    const sx = await program.methods
      .deposit(new anchor.BN(1))
      .accounts({
        owner: owner.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        systemProgram: SystemProgram.programId,
        ownerAta: ownerAta.address,
        vaultAta: vaultAta.address,
        tokenMint: nftMintAddy,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([owner])
      .rpc();

    console.log(`"vaultAta: ", ${vaultAta.address}`);
    console.log(`"vaultPubkey: ", ${vault.toBase58()}`);
  });

  it("Confirm Addresses!", async () => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), owner.publicKey.toBytes()],
      program.programId
    );

    let vaultAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      vault,
      true
    );

    let ownerAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      owner.publicKey
    );

    let escrowAta = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      nftMintAddy,
      pda,
      true
    );
    console.log(` HODLERS PUBKEY: ${owner.publicKey}`);
    console.log(` PDA PUBKEY: ${pda.toBase58()}`);
    console.log(`"vaultAta: ", ${vaultAta.address}`);
    console.log(`"vaultPubkey: ", ${vault.toBase58()}`);
    console.log(` HOLDERS ATA: ${ownerAta.address.toBase58()}`);
  });
});

import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { wallet } from "./dev-wallet";
// import { wallet } from "./new-wallet";
import Keypair = anchor.web3.Keypair;

let nftMint = new PublicKey("BpHoy9vkgM9873dT7N6dP7PfiLtKAbEyg8gihvpXPMdw");

const owner = Keypair.fromSecretKey(new Uint8Array(wallet));

const addys = async () => {
  const fromAssociatedTokenAccountAddress =
    await anchor.utils.token.associatedAddress({
      mint: nftMint,
      owner: owner.publicKey,
    });

  console.log("ATA:", fromAssociatedTokenAccountAddress.toString());
  console.log("Signer:", owner.publicKey.toString());
};
addys();

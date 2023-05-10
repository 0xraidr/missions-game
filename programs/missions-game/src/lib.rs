use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token,
        associated_token,
    },
};

declare_id!("Fdsd3qotXNtvEY9mnYKe5iZGfQVf6UHBqxX2X5d4HWCj");

#[program]
pub mod missions_game {
    use super::*;

 // function below is to choose a mission and deposit nft to play
pub fn deposit_play(
    ctx: Context<DepositPlay>, 
    quantity: u64,
    mission_choice: u8,
) -> Result<()> {
    require!( mission_choice == 0 || mission_choice == 1, MissionError::InvalidMissionChoice);

    let mission_choice_text = match mission_choice {
        0 => "Mission 1",
        1 => "Mission 2",
        _ => "Error" //let's add error handle
    }.to_string();

    msg!("Player chose {}", mission_choice_text);
    msg!("Transferring token(s)...");
    msg!("Mint: {}", &ctx.accounts.mint_account.to_account_info().key());   
    msg!("From Token Address: {}", &ctx.accounts.from_associated_token_account.key());     
    msg!("To Token Address: {}", &ctx.accounts.escrow_token_account.key());     
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.from_associated_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        quantity,
    )?;

    msg!("Tokens transferred successfully.");

    Ok(())
}

// pub fn claim_results(
//     ctx: Context<WithdrawClaim>, 
//     quantity: u64,
// ) -> Result<()> {

//     msg!("Transferring tokens...");
//     msg!("Mint: {}", &ctx.accounts.mint_account.to_account_info().key());   
//     msg!("From Token Address: {}", &ctx.accounts.escrow_token_account.key());     
//     msg!("To Token Address: {}", &ctx.accounts.to_associated_token_account.key());     
//     token::transfer(
//         CpiContext::new_with_signer(
//             ctx.accounts.token_program.to_account_info(),
//             token::Transfer {
//                 from: ctx.accounts.escrow_token_account.to_account_info(),
//                 to: ctx.accounts.to_associated_token_account.to_account_info(),
//                 authority: ctx.accounts.owner.to_account_info(),
//             },
//             &[&[b"escrow", ctx.accounts.owner.key().as_ref(), &[*ctx.bumps.get("escrow").unwrap()]]]
// ), 
//         quantity,
//     )?;

//     // token::transfer(
//     //     CpiContext::new(
//     //         ctx.accounts.token_program.to_account_info(),
//     //         token::Transfer {
//     //             from: ctx.accounts.escrow_token_account.to_account_info(),
//     //             to: ctx.accounts.to_associated_token_account.to_account_info(),
//     //             authority: ctx.accounts.owner.to_account_info(),
//     //         },
//     //     ),
//     //     quantity,
//     // )?;

//     msg!("Tokens Withdrawn successfully.");

//     Ok(())
// }
}


#[derive(Accounts)]
pub struct DepositPlay<'info> {
    #[account(mut)]
    pub mint_account: Account<'info, token::Mint>,
    #[account(
        mut,
        // associated_token::mint = mint_account,
        // associated_token::authority = owner,
    )]
    pub from_associated_token_account: Account<'info, token::TokenAccount>,
    pub owner: SystemAccount<'info>,
    #[account(
        mut,
        // init_if_needed,
        // space = 8 + 8,
        // payer = payer,
        seeds=[b"escrow", payer.key().as_ref()], bump)]
    pub escrow_token_account: Account<'info, token::TokenAccount>,
    // pub recipient: SystemAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}

// #[derive(Accounts)]
// pub struct WithdrawClaim<'info> {
//     #[account(mut)]
//     pub mint_account: Account<'info, token::Mint>,
//     #[account(
//         mut,
//         // init_if_needed,
//         // payer = payer,
//         // space = 8 + 8,
//         seeds=[b"escrow",owner.key().as_ref()], bump
//         // associated_token::mint = mint_account,
//         // associated_token::authority = recipient,
//     )]
//     pub escrow_token_account: Account<'info, token::TokenAccount>,
//     pub owner: SystemAccount<'info>,
//     #[account(
//         init_if_needed,
//         payer = payer,
//         associated_token::mint = mint_account,
//         associated_token::authority = recipient,
//     )]
//     pub to_associated_token_account: Account<'info, token::TokenAccount>,
//     pub recipient: SystemAccount<'info>,
//     #[account(mut)]
//     pub payer: Signer<'info>,
//     pub rent: Sysvar<'info, Rent>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, token::Token>,
//     pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
// }


#[error_code] 
pub enum MissionError {
    #[msg("Choose a valid Mission!")]
    InvalidMissionChoice,
}
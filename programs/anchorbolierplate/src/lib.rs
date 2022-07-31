use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::solana_program::program::invoke;

declare_id!("J4UfqL2dj6N5mTDxH6yym9ykU1dyP5wW519Ta9obTP9m");

#[program]
pub mod anchorbolierplate {
    use super::*;
    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> Result <()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        base_account.total_votes = 0;
        Ok(()) 
    }

    pub fn tip_sol(ctx: Context<TipSol>) -> Result <()> {
        const TIP: u64 = 100000;  // lamports
        let transfer = system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.to.key(),
            TIP,
        );

        invoke(
            &transfer,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.to.to_account_info(),
            ],
        ).unwrap();

        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> Result <()> {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let item = ItemStruct {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            votes: 0,
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    // BUG: How to send reference instead of object?
    pub fn vote_efficient(ctx: Context<Vote>, item: ItemStruct) -> Result <()> {
        let mut votes = item.votes;
        votes += 1;

        let base_account = &mut ctx.accounts.base_account;
        base_account.total_votes += 1;
        Ok(())
    }

    // NOTE: Loop is inefficent.
    pub fn vote(ctx: Context<Vote>, gif_link: String) -> Result <()> {
        let base_account = &mut ctx.accounts.base_account;
        let gif_list = &mut base_account.gif_list;

        for item in gif_list {
            if gif_link == item.gif_link {
                item.votes += 1;
            }
        }

        base_account.total_votes += 1;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init,payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct VoteEfficient<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[derive(Accounts)]
pub struct TipSol<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    /// CHECK:` doc comment explaining why no checks through types are necessary.
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// custom struct
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u64,
}

#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub total_votes: u64,
    pub gif_list: Vec<ItemStruct>,
}

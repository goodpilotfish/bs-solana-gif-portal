use anchor_lang::prelude::*;

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

    pub fn update_item(ctx: Context<UpdateItem>, gif_link: String) -> Result <()> {
        let base_account = &mut ctx.accounts.base_account;
        //let gif_list = &mut ctx.accounts.base_account.gif_list;
        let gif_list = &mut base_account.gif_list;

        // find item
        for item in gif_list {
            if item.gif_link == gif_link {
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
pub struct UpdateItem<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
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

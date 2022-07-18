use anchor_lang::prelude::*;

declare_id!("8PjtLgCGb6ypxeTBB1AdD17rR5V6GDDn1xnvVQRwRMFZ");

#[program]
pub mod anchor_bolierplate {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

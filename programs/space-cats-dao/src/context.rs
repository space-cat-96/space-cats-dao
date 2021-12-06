use anchor_lang::prelude::AnchorDeserialize;
use anchor_lang::prelude::*;

use crate::account::*;

// This is a "big account" because the stored posts exceed the stack memory
// space available for regular PDA accounts.
#[derive(Accounts)]
pub struct CreateStorageAccount<'info> {
    #[account(zero)]
    pub storage_account: Loader<'info, StorageAccount>,

    #[account()]
    pub garbage_collector: Signer<'info>,

    // Admin account represents the upgrade authority on the program and is used
    // to control who can create this storage account, i.e. only the address
    // which has upgrade rights to the program itself. I'd like to enforce this
    // with a constraint here but couldn't figure out how.
    #[account()]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateAuthor<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // TODO: Change the space calculation by setting limits to the author account
    // bio and username fields.
    #[account(init, seeds = [b"author".as_ref(), author.key().as_ref()], bump = bump, payer = payer, space = 1000)]
    pub author_account: Account<'info, AuthorAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct UpdateAuthorProfile<'info> {
    #[account()]
    pub author: Signer<'info>,

    #[account(mut, seeds = [b"author".as_ref(), author.key().as_ref()], bump = bump)]
    pub author_account: Account<'info, AuthorAccount>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreatePost<'info> {
    #[account()]
    pub author: Signer<'info>,

    #[account(mut, seeds = [b"author".as_ref(), author.key().as_ref()], bump = bump)]
    pub author_account: Account<'info, AuthorAccount>,

    #[account(mut)]
    pub storage_account: Loader<'info, StorageAccount>,
}

#[derive(Accounts)]
pub struct GarbageCollect<'info> {
    // Transaction signer must match the stored garbage collector address for
    // the storage account.
    #[account(
        constraint = garbage_collector.to_account_info().key == &storage_account.load()?.garbage_collector
    )]
    pub garbage_collector: Signer<'info>,

    #[account(mut)]
    pub storage_account: Loader<'info, StorageAccount>,
}

use anchor_lang::prelude::*;
use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize};

pub mod account;
pub mod context;
pub mod test;

use crate::account::*;
use crate::context::*;

declare_id!("76cyyWGTHNmt8ruNohBDYYv86q5HZcgvwRi8GayVLjUs");

#[program]
pub mod space_cats_dao {
    use super::*;

    // Handle creating a storage account and assigning a garbage collector address.
    pub fn create_storage_account(ctx: Context<CreateStorageAccount>) -> ProgramResult {
        let storage_account = &mut ctx.accounts.storage_account.load_init()?;
        storage_account.garbage_collector = *ctx.accounts.garbage_collector.key;

        Ok(())
    }

    // Create a new author account.
    pub fn create_author(ctx: Context<CreateAuthor>, bump: u8) -> ProgramResult {
        let clock = Clock::get()?;
        let unix_timestamp = clock.unix_timestamp;
        let author = &ctx.accounts.author;
        ctx.accounts
            .author_account
            .init(*author.key, unix_timestamp, bump);

        Ok(())
    }

    // Update author's profile.
    pub fn update_author_profile(
        ctx: Context<UpdateAuthorProfile>,
        _bump: u8,
        profile: AuthorProfile,
    ) -> ProgramResult {
        ctx.accounts.author_account.update_profile(profile);

        Ok(())
    }

    // Create a new post.
    pub fn create_post(ctx: Context<CreatePost>, _bump: u8, post: String) -> ProgramResult {
        let clock = Clock::get()?;
        let unix_timestamp = clock.unix_timestamp;

        let mut storage_account = ctx.accounts.storage_account.load_mut()?;

        let src = post.as_bytes();
        let mut data = [0u8; 280];
        data[..src.len()].copy_from_slice(src);
        let post = Post {
            content: data,
            author: *ctx.accounts.author.to_account_info().key,
            timestamp: unix_timestamp,
        };

        storage_account.add_post(post);

        Ok(())
    }

    // Handle storage account garbage collection.
    pub fn garbage_collect(ctx: Context<GarbageCollect>) -> ProgramResult {
        let mut storage_account = ctx.accounts.storage_account.load_mut()?;
        storage_account.garbage_collect();

        Ok(())
    }
}

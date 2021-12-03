use anchor_lang::prelude::*;
use anchor_lang::prelude::{AnchorDeserialize, AnchorSerialize};

// Garbage collection threshold is half the capacity. Subtract 1 to adjust
// for zero index'd array.
const GARBAGE_COLLECTION_LIMIT: usize = 250 - 1;

#[account(zero_copy)]
pub struct StorageAccount {
    pub index: u64,
    // Maximum storage account capacity is 500
    pub posts: [Post; 500],
    pub garbage_collector: Pubkey,
}

impl StorageAccount {
    // Adding a new post just appends the post and increments the current
    // storage account index.
    pub fn add_post(&mut self, post: Post) {
        let i: usize = self.index as usize;
        self.posts[i] = post;
        self.index = self.index + 1;
    }

    // Handle garbage collecting the storage account. If the account contains
    // more posts than the post storage limit (which is currently set to
    // half the capacity) this method will clear the first 250 entries and
    // move any additional posts which exist to the front of the list. This
    // is necessary because on-chain memory storage capacity is limited. New
    // posts are continuously saved to Arweave off-chain, after which an
    // off-chain program triggers this garbage collection operation.
    pub fn garbage_collect(&mut self) {
        let mut shift_index: usize = 0;
        let final_index = self.index as usize;

        // Exit early if current index is less than the limit.
        if final_index < GARBAGE_COLLECTION_LIMIT {
            return;
        }

        for i in 0..self.posts.len() {
            if i <= GARBAGE_COLLECTION_LIMIT {
                // For all posts before the limit, reset them to default post
                // structs.
                self.posts[i] = Post::default();
            } else if i <= final_index {
                // For other posts, up until the final current index, shift
                // them back to the front of the list.
                let post = self.posts[i];
                self.posts[i] = Post::default();
                self.posts[shift_index] = post;
                shift_index = shift_index + 1;
            } else {
                // Otherwise break.
                break;
            }
        }

        // Reset the current storage account index.
        self.index = (shift_index - 1) as u64;
    }
}

#[zero_copy]
#[derive(Debug)]
pub struct Post {
    pub author: Pubkey,
    pub content: [u8; 280],
    pub timestamp: i64,
}

impl Post {
    pub fn default() -> Post {
        // I assume this matches the default Anchor uses for the account?
        // Not entirely sure but this works for the purposes here. Maybe
        // instead this should be a Default trait implementation...
        Post {
            timestamp: 0,
            content: [0; 280],
            author: Pubkey::default(),
        }
    }
}

#[account]
#[derive(Default, Debug)]
pub struct AuthorAccount {
    pub bump: u8,
    pub author: Pubkey,
    pub created_at: i64,
    pub bio: String,
    pub username: String,
}

#[derive(Default, Clone, AnchorDeserialize, AnchorSerialize)]
pub struct AuthorProfile {
    pub bio: Option<String>,
    pub username: Option<String>,
}

impl AuthorAccount {
    pub fn init(&mut self, author: Pubkey, joined: i64, bump: u8) {
        self.bump = bump;
        self.author = author;
        self.created_at = joined;
    }

    pub fn update_profile(&mut self, author_profile: AuthorProfile) {
        if let Some(bio) = author_profile.bio {
            self.bio = bio;
        }

        if let Some(username) = author_profile.username {
            self.username = username;
        }
    }
}

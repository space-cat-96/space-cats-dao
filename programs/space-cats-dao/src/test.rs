#[cfg(test)]
pub mod test {
    use crate::account::*;
    use anchor_lang::prelude::*;

    use std::time::{SystemTime, UNIX_EPOCH};

    // Rand crate not allowed for Rust programs. Just return a fixed string.
    fn get_random_string() -> String {
        String::from("Random post string...")
    }

    fn get_epoch_ms() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64
    }

    fn get_random_post() -> Post {
        let content = get_random_string();
        let src = content.as_bytes();
        let mut data = [0u8; 280];
        data[..src.len()].copy_from_slice(src);
        let post = Post {
            content: data,
            author: Pubkey::default(),
            timestamp: get_epoch_ms(),
        };

        post
    }

    fn add_posts_to_limit(limit: i32, storage_account: &mut StorageAccount) {
        for _ in 0..limit {
            let post = get_random_post();
            storage_account.add_post(post);
        }
    }

    // Helper to debug current posts content.
    #[allow(dead_code)]
    fn debug_print_posts(posts: [Post; 500]) {
        let mut strings: Vec<String> = Vec::new();
        for i in 0..12 {
            let x = posts[i];
            let content = x.content;
            let bytes = content.to_vec();
            let string = String::from_utf8(bytes);
            strings.push(string.unwrap());
        }

        for (i, x) in strings.iter().enumerate() {
            println!("[Post: {}] = {}", i, x);
        }
    }

    // Test the garbage collection behavior. This test creates a new storage
    // account and adds a number of posts, triggering the garbage collection
    // action periodically and verifying the resulting account index updates
    // correctly based on the posts storage size and garbage collection limit.
    #[test]
    fn test_garbage_collector() {
        let posts = [Post::default(); 500];
        let mut storage_account = StorageAccount {
            posts,
            index: 0,
            garbage_collector: Pubkey::default(),
        };
        assert_eq!(storage_account.posts.len(), 500);

        add_posts_to_limit(30, &mut storage_account);

        storage_account.garbage_collect();
        storage_account.garbage_collect();
        storage_account.garbage_collect();

        let i = storage_account.index;
        assert_eq!(i, 30);

        add_posts_to_limit(270, &mut storage_account);

        let i = storage_account.index;
        assert_eq!(i, 300);

        storage_account.garbage_collect();

        let i = storage_account.index;
        assert_eq!(i, 50);

        add_posts_to_limit(25, &mut storage_account);

        let i = storage_account.index;
        assert_eq!(i, 75);

        storage_account.garbage_collect();

        let i = storage_account.index;
        assert_eq!(i, 75);

        add_posts_to_limit(225, &mut storage_account);

        storage_account.garbage_collect();

        let i = storage_account.index;
        assert_eq!(i, 50);
    }
}

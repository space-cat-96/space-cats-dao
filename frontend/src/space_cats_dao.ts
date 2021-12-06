export type SpaceCatsDao = {
  "version": "0.0.0",
  "name": "space_cats_dao",
  "instructions": [
    {
      "name": "createStorageAccount",
      "accounts": [
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "garbageCollector",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createAuthor",
      "accounts": [
        {
          "name": "author",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateAuthorProfile",
      "accounts": [
        {
          "name": "author",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "profile",
          "type": {
            "defined": "AuthorProfile"
          }
        }
      ]
    },
    {
      "name": "createPost",
      "accounts": [
        {
          "name": "author",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "post",
          "type": "string"
        }
      ]
    },
    {
      "name": "garbageCollect",
      "accounts": [
        {
          "name": "garbageCollector",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "storageAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "posts",
            "type": {
              "array": [
                {
                  "defined": "Post"
                },
                500
              ]
            }
          },
          {
            "name": "garbageCollector",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "authorAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "author",
            "type": "publicKey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Post",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "publicKey"
          },
          {
            "name": "content",
            "type": {
              "array": [
                "u8",
                280
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "AuthorProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bio",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "username",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InvalidUpgradeAuthority",
      "msg": "Only the program upgrade authority can set the storage account."
    }
  ]
};

export const IDL: SpaceCatsDao = {
  "version": "0.0.0",
  "name": "space_cats_dao",
  "instructions": [
    {
      "name": "createStorageAccount",
      "accounts": [
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "garbageCollector",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "createAuthor",
      "accounts": [
        {
          "name": "author",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateAuthorProfile",
      "accounts": [
        {
          "name": "author",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "profile",
          "type": {
            "defined": "AuthorProfile"
          }
        }
      ]
    },
    {
      "name": "createPost",
      "accounts": [
        {
          "name": "author",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "authorAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "post",
          "type": "string"
        }
      ]
    },
    {
      "name": "garbageCollect",
      "accounts": [
        {
          "name": "garbageCollector",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "storageAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "storageAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "posts",
            "type": {
              "array": [
                {
                  "defined": "Post"
                },
                500
              ]
            }
          },
          {
            "name": "garbageCollector",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "authorAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "author",
            "type": "publicKey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "username",
            "type": "string"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Post",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "publicKey"
          },
          {
            "name": "content",
            "type": {
              "array": [
                "u8",
                280
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "AuthorProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bio",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "username",
            "type": {
              "option": "string"
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InvalidUpgradeAuthority",
      "msg": "Only the program upgrade authority can set the storage account."
    }
  ]
};

import React, {
  ChangeEvent,
  FC,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import io, { Socket } from "socket.io-client";
import styled from "styled-components";
import { List } from "react-virtualized";
import { WalletMultiButton } from "@solana/wallet-adapter-ant-design";
import Jazzicon from "react-jazzicon";
import { useWallet } from "@solana/wallet-adapter-react";
import programUtil, { ArweavePost } from "../tools/web3";
import { Input, Button, notification } from "antd";
import { ProgramType, useConnection, useProgram } from "../context/connection";
import { PublicKey } from "@solana/web3.js";
import { CopyOutlined } from "@ant-design/icons";
import {
  addressToNumberForIcon,
  copyText,
  formatPublicKey,
  toDateString,
} from "../tools/utils";

const { TextArea } = Input;

export const Posts: FC = () => {
  const ws = useRef<Socket>(
    // io("ws://localhost:8787", { reconnectionAttempts: 3 })
    io("wss://space-cats-dao-backend.com", { reconnectionAttempts: 3 })
  );
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [posts, setPosts] = useState<ArweavePost[]>([]);
  const [authorAccountExists, setAuthorAccountExists] =
    useState<boolean>(false);

  useEffect(() => {
    const listenerExists = ws.current.hasListeners("post");
    if (listenerExists) {
      ws.current.removeListener("post");
    }

    ws.current.on("post", (data: ArweavePost) => {
      const updatedPosts = [data].concat(...posts.slice());
      setPosts(updatedPosts);
    });
  }, [posts]);

  useEffect(() => {
    if (connected === false) {
      setAuthorAccountExists(false);
    }
  }, [connected]);

  const handleFetchCurrentPosts = async (program: ProgramType | null) => {
    const state = await programUtil.fetchPostHistory();
    setPosts(state);
  };

  useMemo(() => {
    handleFetchCurrentPosts(program);
  }, [program]);

  const handleFetchAuthorStateAccount = async (
    program: ProgramType | null,
    author: PublicKey | null
  ) => {
    if (program && author) {
      const accountState = await programUtil.getAuthorAccountState(
        program,
        author
      );
      if (accountState) {
        setAuthorAccountExists(true);
      }
    }
  };

  useMemo(() => {
    handleFetchAuthorStateAccount(program, publicKey);
  }, [program, publicKey]);

  const handleCreateAuthorAccount = async () => {
    if (program && publicKey) {
      notification.info({
        message: "Creating account...",
        placement: "bottomRight",
      });
      await programUtil.createAuthor(
        program,
        connection,
        publicKey,
        sendTransaction
      );
      handleFetchAuthorStateAccount(program, publicKey);
      notification.success({
        message: "Account created!",
        placement: "bottomRight",
      });
    }
  };

  const handleCreatePost = async (post: string) => {
    if (program && publicKey) {
      notification.info({
        message: "Creating new post...",
        placement: "bottomRight",
      });
      await programUtil.createPost(
        program,
        connection,
        publicKey,
        post,
        sendTransaction
      );
      notification.success({
        message: "Post created!",
        placement: "bottomRight",
      });
      await handleFetchCurrentPosts(program);
    }
  };

  return (
    <PostsContainer>
      {connected ? (
        !authorAccountExists ? (
          <WalletBox>
            <p>Create an account to post. Account data is stored on-chain.</p>
            <Button type="primary" onClick={handleCreateAuthorAccount}>
              Create Account
            </Button>
          </WalletBox>
        ) : (
          <TextareaContainer handleCreatePost={handleCreatePost} />
        )
      ) : (
        <WalletBox>
          <p>Connect your wallet to get started.</p>
          <WalletMultiButton type="primary" />
        </WalletBox>
      )}
      <PostsList posts={posts} />
    </PostsContainer>
  );
};

interface PostsListProps {
  posts: ArweavePost[];
}

const PostsList: FC<PostsListProps> = (props: PostsListProps) => {
  const rowRenderer = ({ index, key, style }: any) => {
    const x = props.posts[index];
    return (
      <div key={key} style={style}>
        <Card style={{ height: 201 }}>
          <AuthorBioRow>
            <AuthorBio
              onClick={() => {
                copyText(x.author.toString());
                notification.success({
                  message: "Address copied",
                  placement: "bottomRight",
                });
              }}
            >
              <Jazzicon
                diameter={25}
                seed={addressToNumberForIcon(x.author.toString())}
              />
              <Author>{formatPublicKey(new PublicKey(x.author))}</Author>
              <Button
                type="text"
                size="small"
                style={{ marginLeft: 2 }}
                icon={<CopyOutlined />}
              />
            </AuthorBio>
            <Timestamp>{toDateString(x.timestamp)}</Timestamp>
          </AuthorBioRow>
          <Content>{x.content}</Content>
        </Card>
      </div>
    );
  };

  return (
    <List
      rowCount={props.posts.length}
      width={500}
      height={585}
      rowHeight={205}
      overscanRowCount={25}
      rowRenderer={rowRenderer}
    />
  );
};

interface IProps {
  handleCreatePost: (post: string) => void;
}

const TextareaContainer: FC<IProps> = (props: IProps) => {
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [post, setPost] = useState("");

  const handleSetPost = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setPost(event.target.value);
  };

  const handleCreatePost = () => {
    props.handleCreatePost(post);
    setPost("");
  };

  return (
    <InputContainer>
      <TitleText>
        It's very cheap to transact on Solana. Go ahead, give it a try and post
        a new message.
      </TitleText>
      <StyledTextarea
        rows={textareaFocused || post !== "" ? 3 : 1}
        onFocus={() => setTextareaFocused(true)}
        onBlur={() => setTextareaFocused(false)}
        value={post}
        onChange={handleSetPost}
        placeholder="Write the uncensored future..."
      />
      <PostButtonRow>
        <Limit>{post.length}/169</Limit>
        <div>
          <Button
            type="primary"
            style={{ marginLeft: 2 }}
            onClick={handleCreatePost}
          >
            Post Message
          </Button>
        </div>
      </PostButtonRow>
    </InputContainer>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

const PostsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 508px;
  margin: auto;
  padding-top: 65px;
  padding-bottom: 25px;
`;

const AuthorBioRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const AuthorBio = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;

  &:hover {
    cursor: pointer;

    p {
      color: #8d85fa;
    }
  }
`;

const Card = styled.div`
  display: flex;
  margin-bottom: 4px;
  padding: 18px;
  width: 500px;
  justify-content: center;
  flex-direction: column;
  text-align: left;
  background: rgba(5, 5, 5, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);

  :hover {
    background: rgba(5, 5, 5, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
`;

const StyledTextarea = styled(TextArea)`
  ::placeholder {
    font-weight: 200;
  }
`;

const Content = styled.p`
  margin: 2px;
  margin-top: 16px;
  font-size: 18px;
`;

const Author = styled.p`
  margin: 2px;
  margin-left: 6px;
  width: 150px;
  font-weight: 100;
  font-size: 14px;
`;

const Timestamp = styled.p`
  margin: 2px;
  margin-left: 6px;
  font-weight: 100;
  font-size: 12px;
`;

const PostButtonRow = styled.div`
  margin-top: 2px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Limit = styled.p`
  font-weight: 100;
  font-size: 13px;
`;

const TitleText = styled.p`
  font-weight: 200;
  font-size: 14px;
  margin: 0;
  margin-left: 2px;
  margin-bottom: 8px;
`;

const WalletBox = styled(Card)`
  margin-top: 15px;
  margin-bottom: 8px;
  width: 500px;
`;

const InputContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 8px;
  width: 500px;
`;

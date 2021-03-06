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
import { AutoSizer, List } from "react-virtualized";
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
import { SERVER_CONFIG } from "../tools/constants";

const { TextArea } = Input;

export const Posts: FC = () => {
  const ws = useRef<Socket>(
    io(`${SERVER_CONFIG.socket}`, { reconnectionAttempts: 3 })
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

  const handleFetchCurrentPosts = async () => {
    const state = await programUtil.fetchPostHistory();
    setPosts(state);
  };

  useEffect(() => {
    handleFetchCurrentPosts();
  }, []);

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
      await handleFetchCurrentPosts();
    }
  };

  return (
    <PostsContainer>
      <div>
        <TitleTextContainer>
          <TitleText>
            This app is running on the Solana Devnet and Arweave TestWeave
            network. Messages are posted to Solana and then written to Arweave
            for long-term storage. An off-chain backend service handles writing
            data to Arweave and indexing post history. View the project{" "}
            <a
              target="blank"
              href="https://github.com/space-cat-96/space-cats-dao"
            >
              source code here
            </a>
            .
          </TitleText>
        </TitleTextContainer>
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
        <Parent>
          <PostsList posts={posts} />
        </Parent>
      </div>
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
      <div key={key} style={{ ...style }}>
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
    <AutoSizer>
      {({ height, width }) => {
        return (
          <List
            rowCount={props.posts.length}
            width={width}
            height={height}
            rowHeight={205}
            overscanRowCount={25}
            rowRenderer={rowRenderer}
          />
        );
      }}
    </AutoSizer>
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
      <StyledTextarea
        rows={textareaFocused || post !== "" ? 3 : 1}
        onFocus={() => setTextareaFocused(true)}
        onBlur={() => setTextareaFocused(false)}
        value={post}
        onChange={handleSetPost}
        placeholder="Add your own thoughts to the hundreds of random Latin posts below..."
      />
      <PostButtonRow>
        <Limit />
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
  margin: auto;
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

  @media (max-width: 480px) {
    width: 95vw;
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

const TitleTextContainer = styled.div`
  margin: auto;
  margin-top: 4px;
  margin-bottom: 4px;
  width: 500px;

  @media (max-width: 480px) {
    width: 95vw;
  }
`;

const TitleText = styled.p`
  font-weight: 200;
  font-size: 14px;
  margin: 0;
  margin-left: 2px;
  margin-bottom: 8px;

  a {
    color: rgba(93, 82, 252, 0.75);
  }
`;

const WalletBox = styled(Card)`
  margin: auto;
  margin-top: 15px;
  margin-bottom: 8px;
`;

const InputContainer = styled.div`
  margin: auto;
  margin-top: 15px;
  margin-bottom: 8px;
  width: 500px;

  @media (max-width: 480px) {
    width: 95vw;
  }
`;

const Parent = styled.div`
  flex: 1;
  height: 100vh;
`;

import React, { FC } from "react";
import { Container, ContentCard, Paragraph, Title } from "./Components";

export const About: FC = () => {
  return (
    <Container>
      <ContentCard>
        <Title>About</Title>
        <Paragraph>
          Share your thoughts, tag others, and earn rewards. Sleep peacefully at
          night knowing you will never be censorship, suspended, or shutdown.
          Powered by Solana.
        </Paragraph>
        <Paragraph>
          The protocol is owned and governed by the community. To earn
          governance tokens, users must participate by creating content and
          engaging with others. Token holders can then earn protocol revenue by
          staking.
        </Paragraph>
      </ContentCard>
    </Container>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

import React, { FC } from "react";
import { Container, ContentCard, Paragraph, Title } from "./Components";

export const Stake: FC = () => {
  return (
    <Container>
      <ContentCard>
        <Title>Stake</Title>
        <Paragraph>
          Stake your protocols tokens here to earn protocol revenue. Users pay
          small fees to create posts or like other posts. The protocol collects
          these fees and returns them to protocol token owners who stake.
        </Paragraph>
        <Paragraph>
          Support for staking is <b>coming soon</b>!
        </Paragraph>
      </ContentCard>
    </Container>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

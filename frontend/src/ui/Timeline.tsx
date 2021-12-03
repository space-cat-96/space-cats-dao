import React, { FC } from "react";
import { Container, ContentCard, Paragraph, Title } from "./Components";

const P = Paragraph;

export const Timeline: FC = () => {
  return (
    <Container>
      <ContentCard>
        <Title>Project Timeline</Title>
        <P>1. Find a good name.</P>
        <P>2. Find a good logo.</P>
        <P>3. Bootstrap community.</P>
        <P>4. Write post data to Arweave.</P>
        <P>5. Create read/indexer service to read data from Arweave.</P>
        <P>6. Add NFT avatar support.</P>
        <P>7. Create NFT campaign.</P>
        <P>8. Define economic model.</P>
        <P>9. Create token and staking module.</P>
        <P>10. Decentralize read/indexer service.</P>
      </ContentCard>
    </Container>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

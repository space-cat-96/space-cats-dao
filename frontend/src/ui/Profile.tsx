import React, { FC } from "react";
import { Container, ContentCard, Paragraph, Title } from "./Components";

export const Profile: FC = () => {
  return (
    <Container>
      <ContentCard>
        <Title>Profile</Title>
        <Paragraph>
          Your profile is represented by your public key address. Store
          additional metadata such as username and bio here. This metadata is
          stored on chain.
        </Paragraph>
      </ContentCard>
    </Container>
  );
};

/** ===========================================================================
 * Styles
 * ============================================================================
 */

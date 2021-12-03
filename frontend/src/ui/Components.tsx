import styled from "styled-components";
import { Card, Typography } from "antd";

/** ===========================================================================
 * UI Components
 * ============================================================================
 */

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 525px;
  height: 100%;
  margin: auto;
  padding-top: 75px;
  padding-bottom: 25px;
`;

export const ContentCard = styled(Card)`
  width: 500px;
`;

export const Title = styled(Typography.Title)``;

export const Paragraph = styled(Typography.Paragraph)``;

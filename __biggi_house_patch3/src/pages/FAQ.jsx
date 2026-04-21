import styled from "styled-components";
import Container from "../components/Container";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
`;

const Header = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 32px;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  max-width: 640px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 20px;
`;

const Question = styled.h3`
  font-size: 16px;
  margin-bottom: 8px;
`;

const Answer = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
  line-height: 1.6;
`;

const Cta = styled.div`
  margin-top: 30px;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const CtaTitle = styled.h3`
  font-size: 20px;
`;

const CtaButton = styled.a`
  background: #fff;
  color: ${({ theme }) => theme.colors.primary};
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 600;
`;

export default function FAQ() {
  const items = [
    {
      q: "How do houses work?",
      a: "Each house has a minimum weekly contribution (House 1 starts at \u20A6100 up to House 10 at \u20A61000). When you join a house, your BiggiHouse wallet is deducted and your membership is recorded.",
    },
    {
      q: "What do I need before I can join a house?",
      a: "You need an active subscription and enough BiggiHouse wallet balance to pay the house minimum contribution.",
    },
    {
      q: "How are payouts handled?",
      a: "Payouts are weekly. Default payout time is Sunday 10:00pm and your dashboard shows the next payout time and latest activity.",
    },
    {
      q: "Can I join more than one house?",
      a: "Yes. You can join multiple houses to scale your savings goals.",
    },
    {
      q: "Is BiggiHouse wallet the same as Biggi Data wallet?",
      a: "No. BiggiHouse has its own wallet and transaction history. Biggi Data has a separate wallet for data purchases and other services.",
    },
    {
      q: "Can I use the same account on Biggi Data and BiggiHouse?",
      a: "Accounts are managed by a shared backend, but access is controlled per app. By default, BiggiHouse users are private users and may not be allowed to sign in on Biggi Data unless their account is enabled for it.",
    },
    {
      q: "Is BiggiHouse powered by Biggi Data?",
      a: "Yes. BiggiHouse shares the Biggi ecosystem backend services, while keeping its own wallet and house memberships.",
    },
    {
      q: "What is the Weekly Card Game?",
      a: "It is a weekly prediction game where you pick 3 letters (A-Z). No tickets are required, but you must have at least 1 data purchase this week before you can submit. Results come out every Sunday.",
    },
  ];

  return (
    <Wrapper>
      <Header>
        <Title>Frequently Asked Questions</Title>
        <Sub>
          Everything you need to know about BiggiHouse houses, subscription,
          weekly payouts, and house pooling.
        </Sub>
      </Header>
      <Grid>
        {items.map((item) => (
          <Card key={item.q}>
            <Question>{item.q}</Question>
            <Answer>{item.a}</Answer>
          </Card>
        ))}
      </Grid>
      <Cta>
        <div>
          <CtaTitle>Still have questions?</CtaTitle>
          <p style={{ opacity: 0.85 }}>
            Reach out and our support team will respond quickly.
          </p>
        </div>
        <CtaButton href="mailto:support@biggihouse.com">Contact support</CtaButton>
      </Cta>
    </Wrapper>
  );
}

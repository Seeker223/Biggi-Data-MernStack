import styled from "styled-components";
import { useState } from "react";
import Container from "../components/Container";
import { Link, useNavigate } from "react-router-dom";
import biggiLogo from "../assets/biggiHouse2.png";
import { useAuth } from "../utils/AuthContext";
import { registerUser } from "../services/api";

const Wrapper = styled(Container)`
  padding: 60px 0;
  display: flex;
  justify-content: center;
`;

const Card = styled.div`
  width: min(460px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const Logo = styled.img`
  width: 68px;
  height: 68px;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-size: 26px;
  margin-bottom: 8px;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 22px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Input = styled.input`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fdfdff;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  margin-top: 10px;
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const ButtonLink = styled(Link)`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  text-align: center;
  display: inline-block;
`;

const ButtonStack = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 12px;
`;

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    birthDate: "",
    state: "",
    nin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.phoneNumber ||
      !form.birthDate ||
      !form.state ||
      !form.nin
    ) {
      setError(
        "Username, email, password, phone number, state, birth date, and NIN are required."
      );
      return;
    }
    setLoading(true);
    registerUser({
      username: form.username,
      email: form.email,
      password: form.password,
      phoneNumber: form.phoneNumber,
      birthDate: form.birthDate,
      state: form.state,
      nin: form.nin,
    })
      .then((data) => {
        if (data.requiresVerification) {
          navigate("/verify-email", { state: { email: data.email } });
          return;
        }
        login(data.user, data.token, data.refreshToken);
        navigate("/dashboard");
      })
      .catch((err) => {
        setError(err.message || "Unable to create account.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Wrapper>
      <Card>
        <Logo src={biggiLogo} alt="biggiHouse logo" />
        <Title>Create your account</Title>
        <Sub>Start your savings journey with BiggiHouse.</Sub>
        <form onSubmit={handleSubmit}>
        <Row>
          <Field>
            <Label>First name</Label>
            <Input
              name="firstName"
              placeholder="Ada"
              value={form.firstName}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <Label>Last name</Label>
            <Input
              name="lastName"
              placeholder="Obi"
              value={form.lastName}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Field>
          <Label>Username</Label>
          <Input
            name="username"
            placeholder="biggi_user"
            value={form.username}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <Label>Email address</Label>
          <Input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <Label>Phone number</Label>
          <Input
            name="phoneNumber"
            placeholder="08012345678"
            value={form.phoneNumber}
            onChange={handleChange}
          />
        </Field>
        <Row>
          <Field>
            <Label>State</Label>
            <Input
              name="state"
              placeholder="Lagos"
              value={form.state}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <Label>Birth date</Label>
            <Input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Row>
          <Field>
            <Label>NIN</Label>
            <Input
              name="nin"
              placeholder="11-digit NIN"
              value={form.nin}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Field>
          <Label>Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
          />
        </Field>
          {error && (
            <p style={{ color: "#c02626", fontSize: "13px" }}>{error}</p>
          )}
          <ButtonStack>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            <ButtonLink to="/login">Login</ButtonLink>
          </ButtonStack>
        </form>
      </Card>
    </Wrapper>
  );
}

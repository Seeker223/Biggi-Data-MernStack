import styled from "styled-components";
import { useState } from "react";
import Container from "../components/Container";
import { Link, useNavigate } from "react-router-dom";
import biggiLogo from "../assets/biggiHouse2.png";
import { useAuth } from "../utils/AuthContext";
import { loginUser } from "../services/api";

const Wrapper = styled(Container)`
  padding: 60px 0;
  display: flex;
  justify-content: center;

  @media (max-width: 640px) {
    padding: 24px 0 40px;
    width: min(100%, 92%);
  }
`;

const Card = styled.div`
  width: min(420px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.soft};

  @media (max-width: 640px) {
    padding: 24px 18px;
    border-radius: 22px;
  }
`;

const Logo = styled.img`
  width: 64px;
  height: 64px;
  margin-bottom: 10px;

  @media (max-width: 640px) {
    width: 56px;
    height: 56px;
  }
`;

const Title = styled.h1`
  font-size: 26px;
  margin-bottom: 8px;

  @media (max-width: 640px) {
    font-size: 22px;
  }
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 22px;
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
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fdfdff;
  font-size: 16px;
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

const FooterText = styled.p`
  margin-top: 16px;
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
`;

const RememberRow = styled.label`
  display: flex;
  gap: 8px;
  align-items: center;
  color: ${({ theme }) => theme.colors.ink};
  font-size: 14px;
`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (!form.identifier || !form.password) {
      setError("Please enter email/username and password.");
      return;
    }
    setLoading(true);
    loginUser({
      email: form.identifier,
      password: form.password,
      rememberMe: form.rememberMe,
    })
      .then((data) => {
        login(data.user, data.token, data.refreshToken);
        navigate("/");
      })
      .catch(async (err) => {
        if (err.requiresVerification) {
          navigate("/verify-email", { state: { email: err.email } });
          return;
        }
        setError(err.message || "Invalid email or password.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Wrapper>
      <Card>
        <Logo src={biggiLogo} alt="biggiHouse logo" />
        <Title>Welcome back</Title>
        <Sub>Sign in to continue your savings cycle.</Sub>
        <form onSubmit={handleSubmit}>
          <Field>
            <Label>Email or username</Label>
            <Input
              type="text"
              name="identifier"
              placeholder="you@example.com"
              value={form.identifier}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
            />
          </Field>
          <Field style={{ marginBottom: "6px" }}>
            <RememberRow>
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))
                }
              />
              Remember me
            </RememberRow>
          </Field>
          {error && (
            <p style={{ color: "#c02626", fontSize: "13px" }}>{error}</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
        <FooterText>
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </FooterText>
        <FooterText style={{ marginTop: "8px" }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </FooterText>
      </Card>
    </Wrapper>
  );
}

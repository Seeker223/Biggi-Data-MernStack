import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Container from "../components/Container";
import { useAuth } from "../utils/AuthContext";
import { getAuthToken } from "../utils/auth";
import {
  createBiggiHouseAdminHouse,
  deleteBiggiHouseAdminHouse,
  deleteBiggiHouseAdminMembership,
  getBiggiHouseAdminHouses,
  getBiggiHouseAdminMemberships,
  getBiggiHouseAdminOverview,
  getBiggiHouseAdminUsers,
  updateBiggiHouseAdminHouse,
  updateBiggiHouseAdminUser,
} from "../services/api";

const Page = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  padding: 22px 0 64px;
`;

const Shell = styled(Container)`
  max-width: 1100px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin: 6px 0 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
`;

const Sub = styled.div`
  margin-top: 6px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Pill = styled.span`
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: 800;
  font-size: 13px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 14px;
`;

const Tab = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) => ($active ? theme.gradients.brand : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#111827")};
  font-weight: 900;
  padding: 10px 14px;
  border-radius: 999px;
  cursor: pointer;
`;

const Panel = styled.div`
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.ink};
`;

const Tools = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  outline: none;
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
`;

const Primary = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
`;

const Ghost = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 900;
  cursor: pointer;
`;

const Danger = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: rgba(220, 38, 38, 0.08);
  color: #991b1b;
  font-weight: 900;
  cursor: pointer;
`;

const Grid = styled.div`
  display: grid;
  gap: 14px;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (min-width: 860px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Stat = styled.div`
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 14px;
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 900;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const StatValue = styled.div`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 1000;
  font-size: 20px;
`;

const TableWrap = styled.div`
  overflow: auto;
  margin-top: 12px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;

  th,
  td {
    padding: 12px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    text-align: left;
    font-size: 14px;
  }

  th {
    background: rgba(15, 23, 42, 0.02);
    color: ${({ theme }) => theme.colors.muted};
    font-weight: 900;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    position: sticky;
    top: 0;
  }
`;

const formatMoney = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function CPanel() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const token = useMemo(() => getAuthToken(), []);

  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [houses, setHouses] = useState([]);
  const [newHouse, setNewHouse] = useState({ number: "", minimum: "" });
  const [memberships, setMemberships] = useState([]);
  const [membershipHouseId, setMembershipHouseId] = useState("");

  const load = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e?.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !token) return;
    load(async () => {
      const data = await getBiggiHouseAdminOverview(token);
      setOverview(data);
    });
  }, [isAdmin, token]);

  useEffect(() => {
    if (!isAdmin || !token) return;
    if (tab === "overview") {
      load(async () => setOverview(await getBiggiHouseAdminOverview(token)));
      return;
    }
    if (tab === "users") {
      load(async () => setUsers((await getBiggiHouseAdminUsers(token, { q: userQuery })).users || []));
      return;
    }
    if (tab === "houses") {
      load(async () => setHouses(await getBiggiHouseAdminHouses(token)));
      return;
    }
    if (tab === "memberships") {
      load(async () => {
        const data = await getBiggiHouseAdminMemberships(token, { houseId: membershipHouseId || undefined });
        setMemberships(data.memberships || []);
      });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!isAdmin) {
    return (
      <Page>
        <Shell>
          <Panel>
            <PanelHeader>Restricted</PanelHeader>
            <Sub>Only admin users can access the C-Panel.</Sub>
          </Panel>
        </Shell>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <Header>
          <div>
            <Title>C-Panel</Title>
            <Sub>Admin workspace for BiggiHouse (overview + CRUD).</Sub>
          </div>
          <Pill>Role: Admin</Pill>
        </Header>

        <Tabs>
          <Tab $active={tab === "overview"} onClick={() => setTab("overview")} type="button">
            Overview
          </Tab>
          <Tab $active={tab === "users"} onClick={() => setTab("users")} type="button">
            Users
          </Tab>
          <Tab $active={tab === "houses"} onClick={() => setTab("houses")} type="button">
            Houses
          </Tab>
          <Tab $active={tab === "memberships"} onClick={() => setTab("memberships")} type="button">
            Memberships
          </Tab>
        </Tabs>

        {error && (
          <Panel style={{ borderColor: "rgba(220,38,38,.25)", background: "rgba(220,38,38,.05)" }}>
            <PanelHeader style={{ color: "#991b1b" }}>Error</PanelHeader>
            <Sub style={{ color: "#991b1b" }}>{error}</Sub>
          </Panel>
        )}

        {tab === "overview" && (
          <Grid>
            <Cards>
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatValue>{overview?.users?.total ?? "—"}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Verified</StatLabel>
                <StatValue>{overview?.users?.verified ?? "—"}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Merchants</StatLabel>
                <StatValue>{overview?.users?.merchants ?? "—"}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Wallet Total</StatLabel>
                <StatValue>{formatMoney(overview?.wallet?.totalBalance ?? 0)}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Houses</StatLabel>
                <StatValue>{overview?.houses?.total ?? "—"}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Active Houses</StatLabel>
                <StatValue>{overview?.houses?.active ?? "—"}</StatValue>
              </Stat>
              <Stat>
                <StatLabel>Memberships</StatLabel>
                <StatValue>{overview?.houses?.memberships ?? "—"}</StatValue>
              </Stat>
            </Cards>
            <Panel>
              <PanelHeader>
                <span>Notes</span>
                <Ghost type="button" disabled={busy} onClick={() => load(async () => setOverview(await getBiggiHouseAdminOverview(token)))}>
                  Refresh
                </Ghost>
              </PanelHeader>
              <Sub>
                BiggiHouse wallet is independent. House-join eligibility depends on weekly Biggi Data purchases tied to
                the user&apos;s phone number.
              </Sub>
            </Panel>
          </Grid>
        )}

        {tab === "users" && (
          <Panel>
            <PanelHeader>
              <span>Users</span>
              <Tools>
                <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search..." />
                <Primary type="button" disabled={busy} onClick={() => load(async () => setUsers((await getBiggiHouseAdminUsers(token, { q: userQuery })).users || []))}>
                  Search
                </Primary>
                <Ghost type="button" disabled={busy} onClick={() => load(async () => setUsers((await getBiggiHouseAdminUsers(token, { q: userQuery })).users || []))}>
                  Refresh
                </Ghost>
              </Tools>
            </PanelHeader>
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Verified</th>
                    <th>User Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{u.username || "—"}</div>
                        <div style={{ color: "#5b6475", fontSize: 12 }}>{u.email}</div>
                      </td>
                      <td>{u.phoneNumber || "—"}</td>
                      <td>{u.isVerified ? "Yes" : "No"}</td>
                      <td>{u.userRole || "private"}</td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Ghost
                          type="button"
                          onClick={() =>
                            load(async () => {
                              const next = await updateBiggiHouseAdminUser(u.id, { isVerified: !u.isVerified }, token);
                              setUsers((prev) => prev.map((x) => (x.id === u.id ? next : x)));
                            })
                          }
                        >
                          Toggle Verify
                        </Ghost>
                        <Ghost
                          type="button"
                          onClick={() => {
                            const phoneNumber = window.prompt("Set phone number:", u.phoneNumber || "");
                            if (phoneNumber === null) return;
                            load(async () => {
                              const next = await updateBiggiHouseAdminUser(u.id, { phoneNumber }, token);
                              setUsers((prev) => prev.map((x) => (x.id === u.id ? next : x)));
                            });
                          }}
                        >
                          Edit Phone
                        </Ghost>
                        <Ghost
                          type="button"
                          onClick={() => {
                            const userRole = window.prompt("Set userRole (private/merchant):", u.userRole || "private");
                            if (userRole === null) return;
                            load(async () => {
                              const next = await updateBiggiHouseAdminUser(u.id, { userRole }, token);
                              setUsers((prev) => prev.map((x) => (x.id === u.id ? next : x)));
                            });
                          }}
                        >
                          Set Role
                        </Ghost>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ color: "#5b6475" }}>
                        No users.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        )}

        {tab === "houses" && (
          <Panel>
            <PanelHeader>
              <span>Houses</span>
              <Tools>
                <Input
                  value={newHouse.number}
                  onChange={(e) => setNewHouse((p) => ({ ...p, number: e.target.value }))}
                  placeholder="House # (1..10)"
                />
                <Input
                  value={newHouse.minimum}
                  onChange={(e) => setNewHouse((p) => ({ ...p, minimum: e.target.value }))}
                  placeholder="Minimum (NGN)"
                />
                <Primary
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    load(async () => {
                      await createBiggiHouseAdminHouse(
                        { number: Number(newHouse.number), minimum: Number(newHouse.minimum), active: true },
                        token
                      );
                      setNewHouse({ number: "", minimum: "" });
                      setHouses(await getBiggiHouseAdminHouses(token));
                    })
                  }
                >
                  Create
                </Primary>
                <Ghost type="button" disabled={busy} onClick={() => load(async () => setHouses(await getBiggiHouseAdminHouses(token)))}>
                  Refresh
                </Ghost>
              </Tools>
            </PanelHeader>

            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>House</th>
                    <th>Minimum</th>
                    <th>Members</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 900 }}>House {h.number}</td>
                      <td>{formatMoney(h.minimum)}</td>
                      <td>{h.members}</td>
                      <td>{h.active ? "Yes" : "No"}</td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Ghost
                          type="button"
                          onClick={() => {
                            const minimum = window.prompt("Set minimum (NGN):", String(h.minimum || 0));
                            if (minimum === null) return;
                            load(async () => {
                              const next = await updateBiggiHouseAdminHouse(h.id, { minimum: Number(minimum) }, token);
                              setHouses((prev) => prev.map((x) => (x.id === h.id ? { ...x, ...next } : x)));
                            });
                          }}
                        >
                          Edit Minimum
                        </Ghost>
                        <Ghost
                          type="button"
                          onClick={() =>
                            load(async () => {
                              const next = await updateBiggiHouseAdminHouse(h.id, { active: !h.active }, token);
                              setHouses((prev) => prev.map((x) => (x.id === h.id ? { ...x, ...next } : x)));
                            })
                          }
                        >
                          Toggle Active
                        </Ghost>
                        <Danger
                          type="button"
                          onClick={() => {
                            if (!window.confirm("Delete this house? If it has members, it will be deactivated.")) return;
                            load(async () => {
                              await deleteBiggiHouseAdminHouse(h.id, token);
                              setHouses(await getBiggiHouseAdminHouses(token));
                            });
                          }}
                        >
                          Delete
                        </Danger>
                      </td>
                    </tr>
                  ))}
                  {houses.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ color: "#5b6475" }}>
                        No houses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        )}

        {tab === "memberships" && (
          <Panel>
            <PanelHeader>
              <span>Memberships</span>
              <Tools>
                <Select value={membershipHouseId} onChange={(e) => setMembershipHouseId(e.target.value)}>
                  <option value="">All houses</option>
                  {houses
                    .slice()
                    .sort((a, b) => a.number - b.number)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        House {h.number}
                      </option>
                    ))}
                </Select>
                <Primary
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    load(async () => {
                      const data = await getBiggiHouseAdminMemberships(token, { houseId: membershipHouseId || undefined });
                      setMemberships(data.memberships || []);
                    })
                  }
                >
                  Apply
                </Primary>
              </Tools>
            </PanelHeader>

            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>House</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{m.user?.username || "—"}</div>
                        <div style={{ color: "#5b6475", fontSize: 12 }}>{m.user?.email || ""}</div>
                      </td>
                      <td>{m.house ? `House ${m.house.number}` : "—"}</td>
                      <td style={{ color: "#5b6475" }}>{m.joinedAt ? new Date(m.joinedAt).toLocaleString() : "—"}</td>
                      <td>
                        <Danger
                          type="button"
                          onClick={() => {
                            if (!window.confirm("Remove this membership?")) return;
                            load(async () => {
                              await deleteBiggiHouseAdminMembership(m.id, token);
                              const data = await getBiggiHouseAdminMemberships(token, { houseId: membershipHouseId || undefined });
                              setMemberships(data.memberships || []);
                            });
                          }}
                        >
                          Remove
                        </Danger>
                      </td>
                    </tr>
                  ))}
                  {memberships.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ color: "#5b6475" }}>
                        No memberships.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        )}

        <Sub style={{ marginTop: 14 }}>
          {busy ? "Working..." : " "}
        </Sub>
      </Shell>
    </Page>
  );
}

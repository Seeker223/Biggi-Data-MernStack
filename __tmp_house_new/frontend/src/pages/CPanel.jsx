import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Container from "../components/Container";
import { useAuth } from "../utils/AuthContext";
import { getAuthToken } from "../utils/auth";
import {
  adjustBiggiHouseAdminUserWallet,
  createBiggiHouseAdminHouse,
  deleteBiggiHouseAdminHouse,
  deleteBiggiHouseAdminMembership,
  getBiggiHouseAdminHouses,
  getBiggiHouseAdminMemberships,
  getBiggiHouseAdminWinners,
  getBiggiHouseAdminOverview,
  getBiggiHouseAdminUsers,
  getBiggiHousePublicConfig,
  triggerBiggiHouseWinnerPayouts,
  triggerBiggiHouseWinnerSelection,
  updateBiggiHouseAdminConfig,
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
  const [config, setConfig] = useState(null);
  const [users, setUsers] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [houses, setHouses] = useState([]);
  const [newHouse, setNewHouse] = useState({ number: "", minimum: "" });
  const [memberships, setMemberships] = useState([]);
  const [membershipHouseId, setMembershipHouseId] = useState("");
  const [winners, setWinners] = useState([]);
  const [winnerFilters, setWinnerFilters] = useState({ houseId: "", status: "" });
  const [winnerPage, setWinnerPage] = useState(1);
  const [winnerTotalPages, setWinnerTotalPages] = useState(1);

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
    if (tab === "config") {
      load(async () => setConfig(await getBiggiHousePublicConfig()));
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

  useEffect(() => {
    if (!isAdmin || !token || tab !== "winners") return;

    load(async () => {
      if (houses.length === 0) {
        setHouses(await getBiggiHouseAdminHouses(token));
      }

      const data = await getBiggiHouseAdminWinners(token, {
        houseId: winnerFilters.houseId || undefined,
        status: winnerFilters.status || undefined,
        page: winnerPage,
        limit: 50,
      });

      setWinners(data.winners || []);
      setWinnerTotalPages(data.pagination?.pages || 1);
    });
  }, [tab, winnerFilters, winnerPage, houses.length, isAdmin, token]);

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
          <Tab $active={tab === "config"} onClick={() => setTab("config")} type="button">
            Config
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
          <Tab $active={tab === "winners"} onClick={() => setTab("winners")} type="button">
            Winners
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
                BiggiHouse wallet is independent. Users need an active weekly subscription and enough wallet balance to join houses. Monthly Card Game is controlled from the Config tab.
              </Sub>
            </Panel>
          </Grid>
        )}

        {tab === "config" && (
          <Panel>
            <PanelHeader>
              <span>Platform Config</span>
              <Tools>
                <Ghost
                  type="button"
                  disabled={busy}
                  onClick={() => load(async () => setConfig(await getBiggiHousePublicConfig()))}
                >
                  Refresh
                </Ghost>
                <Primary
                  type="button"
                  disabled={busy || !config}
                  onClick={() =>
                    load(async () => {
                      const next = await updateBiggiHouseAdminConfig(
                        {
                          weeklyPayout: config?.weeklyPayout,
                          features: config?.features,
                          game: config?.game,
                        },
                        token
                      );
                      setConfig(next);
                    })
                  }
                >
                  Save
                </Primary>
              </Tools>
            </PanelHeader>

            <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Monthly Card Game</div>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(config?.features?.monthlyCardGameEnabled)}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...(p || {}),
                        features: {
                          ...(p?.features || {}),
                          monthlyCardGameEnabled: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span>Enable game</span>
                </label>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(config?.game?.requireDataPurchase)}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...(p || {}),
                        game: { ...(p?.game || {}), requireDataPurchase: e.target.checked },
                      }))
                    }
                  />
                  <span>Require at least 1 data purchase before play</span>
                </label>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Weekly Payout Time</div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  }}
                >
                  <Input
                    value={String(config?.weeklyPayout?.dayOfWeek ?? 0)}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...(p || {}),
                        weeklyPayout: {
                          ...(p?.weeklyPayout || {}),
                          dayOfWeek: Number(e.target.value || 0),
                        },
                      }))
                    }
                    placeholder="Day (0=Sun)"
                  />
                  <Input
                    value={String(config?.weeklyPayout?.hour ?? 22)}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...(p || {}),
                        weeklyPayout: {
                          ...(p?.weeklyPayout || {}),
                          hour: Number(e.target.value || 0),
                        },
                      }))
                    }
                    placeholder="Hour (0-23)"
                  />
                  <Input
                    value={String(config?.weeklyPayout?.minute ?? 0)}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...(p || {}),
                        weeklyPayout: {
                          ...(p?.weeklyPayout || {}),
                          minute: Number(e.target.value || 0),
                        },
                      }))
                    }
                    placeholder="Minute"
                  />
                </div>
                <Sub>Default: Sunday (0) at 22:00.</Sub>
              </div>
            </div>
          </Panel>
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
                    <th>Wallet</th>
                    <th>Subscription</th>
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
                      <td style={{ fontWeight: 900 }}>{formatMoney(u.walletBalance ?? 0)}</td>
                      <td>
                        {u.subscription?.active ? (
                          <div style={{ fontWeight: 900, color: "#065f46" }}>Active</div>
                        ) : (
                          <div style={{ fontWeight: 900, color: "#991b1b" }}>Inactive</div>
                        )}
                        {u.subscription?.renewalDate ? (
                          <div style={{ color: "#5b6475", fontSize: 12 }}>
                            Renew: {new Date(u.subscription.renewalDate).toLocaleDateString()}
                          </div>
                        ) : null}
                      </td>
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
                            const raw = window.prompt("Wallet credit amount (NGN):", "0");
                            if (raw === null) return;
                            const amount = Number(raw);
                            if (!Number.isFinite(amount) || amount <= 0) return;
                            load(async () => {
                              const wallet = await adjustBiggiHouseAdminUserWallet(u.id, { amount }, token);
                              setUsers((prev) =>
                                prev.map((x) =>
                                  x.id === u.id ? { ...x, walletBalance: wallet.balance } : x
                                )
                              );
                            });
                          }}
                        >
                          Credit Wallet
                        </Ghost>
                        <Ghost
                          type="button"
                          onClick={() => {
                            const raw = window.prompt("Wallet debit amount (NGN):", "0");
                            if (raw === null) return;
                            const amount = Number(raw);
                            if (!Number.isFinite(amount) || amount <= 0) return;
                            load(async () => {
                              const wallet = await adjustBiggiHouseAdminUserWallet(u.id, { amount: -amount }, token);
                              setUsers((prev) =>
                                prev.map((x) =>
                                  x.id === u.id ? { ...x, walletBalance: wallet.balance } : x
                                )
                              );
                            });
                          }}
                        >
                          Debit Wallet
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
                      <td colSpan="7" style={{ color: "#5b6475" }}>
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

        {tab === "winners" && (
          <Panel>
            <PanelHeader>
              <span>Winners</span>
              <Tools>
                <Select value={winnerFilters.houseId} onChange={(e) => setWinnerFilters((prev) => ({ ...prev, houseId: e.target.value }))}>
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
                <Select value={winnerFilters.status} onChange={(e) => setWinnerFilters((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
                <Primary
                  type="button"
                  disabled={busy}
                  onClick={() => setWinnerPage(1)}
                >
                  Apply
                </Primary>
                <Ghost
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    load(async () => {
                      const data = await getBiggiHouseAdminWinners(token, {
                        houseId: winnerFilters.houseId || undefined,
                        status: winnerFilters.status || undefined,
                        page: winnerPage,
                        limit: 50,
                      });
                      setWinners(data.winners || []);
                      setWinnerTotalPages(data.pagination?.pages || 1);
                    })
                  }
                >
                  Refresh
                </Ghost>
              </Tools>
            </PanelHeader>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <Primary
                type="button"
                disabled={busy}
                onClick={() =>
                  load(async () => {
                    await triggerBiggiHouseWinnerSelection(token);
                    const data = await getBiggiHouseAdminWinners(token, {
                      houseId: winnerFilters.houseId || undefined,
                      status: winnerFilters.status || undefined,
                      page: winnerPage,
                      limit: 50,
                    });
                    setWinners(data.winners || []);
                    setWinnerTotalPages(data.pagination?.pages || 1);
                  })
                }
              >
                Select Winners
              </Primary>
              <Danger
                type="button"
                disabled={busy}
                onClick={() =>
                  load(async () => {
                    await triggerBiggiHouseWinnerPayouts(token);
                    const data = await getBiggiHouseAdminWinners(token, {
                      houseId: winnerFilters.houseId || undefined,
                      status: winnerFilters.status || undefined,
                      page: winnerPage,
                      limit: 50,
                    });
                    setWinners(data.winners || []);
                    setWinnerTotalPages(data.pagination?.pages || 1);
                  })
                }
              >
                Process Payouts
              </Danger>
            </div>

            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <th>House</th>
                    <th>Winner</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Week</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((winner) => (
                    <tr key={winner.id}>
                      <td>{winner.house ? `House ${winner.house.number}` : "—"}</td>
                      <td>{winner.user?.username || winner.user?.email || "—"}</td>
                      <td>{winner.user?.phoneNumber || "—"}</td>
                      <td>{winner.status || "—"}</td>
                      <td>{formatMoney(winner.amount || 0)}</td>
                      <td>
                        {winner.weekStart && winner.weekEnd
                          ? `${new Date(winner.weekStart).toLocaleDateString()} - ${new Date(winner.weekEnd).toLocaleDateString()}`
                          : "—"}
                      </td>
                      <td>{winner.paidAt ? new Date(winner.paidAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                  {winners.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ color: "#5b6475" }}>
                        No winners found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>

            {winnerTotalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                <span>
                  Page {winnerPage} of {winnerTotalPages}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Ghost
                    type="button"
                    disabled={busy || winnerPage <= 1}
                    onClick={() => setWinnerPage((page) => Math.max(1, page - 1))}
                  >
                    Prev
                  </Ghost>
                  <Ghost
                    type="button"
                    disabled={busy || winnerPage >= winnerTotalPages}
                    onClick={() => setWinnerPage((page) => Math.min(winnerTotalPages, page + 1))}
                  >
                    Next
                  </Ghost>
                </div>
              </div>
            )}
          </Panel>
        )}

        <Sub style={{ marginTop: 14 }}>
          {busy ? "Working..." : " "}
        </Sub>
      </Shell>
    </Page>
  );
}

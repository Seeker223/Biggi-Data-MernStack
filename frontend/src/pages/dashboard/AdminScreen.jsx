import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Shield,
  Users,
  Wallet,
  Trophy,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminDashboard,
  updateAdminUser,
} from "../../services/api";

const naira = (v) => `₦${Number(v || 0).toLocaleString()}`;
const dateFmt = (v) => (v ? new Date(v).toLocaleString() : "—");

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  phoneNumber: "",
  birthDate: "",
  state: "",
  role: "user",
  userRole: "private",
  isVerified: true,
  mainBalance: 0,
  rewardBalance: 0,
  totalDeposits: 0,
  dataBundleCount: 0,
  tickets: 0,
};

const AdminScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState("");
  const [verified, setVerified] = useState("");
  const [userAge, setUserAge] = useState("new");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = useMemo(() => String(user?.role || "").toLowerCase() === "admin", [user?.role]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminDashboard({
        page,
        limit: 20,
        historyLimit: 8,
        search: search.trim() || undefined,
        role: role || undefined,
        userRole: userRole || undefined,
        verified: verified || undefined,
        userAge: userAge || undefined,
      });
      setData(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [page, role, search, userRole, verified, userAge]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin, loadData]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openCreate = () => {
    setFormMode("create");
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (entry) => {
    setFormMode("edit");
    setFormError("");
    setForm({
      id: entry.id,
      username: entry.personal?.username || "",
      email: entry.personal?.email || "",
      password: "",
      phoneNumber: entry.personal?.phoneNumber || "",
      birthDate: entry.personal?.birthDate
        ? new Date(entry.personal.birthDate).toISOString().slice(0, 10)
        : "",
      state: entry.personal?.state || "",
      role: entry.personal?.role || "user",
      userRole: entry.personal?.userRole || "private",
      isVerified: Boolean(entry.personal?.isVerified),
      mainBalance: Number(entry.balances?.mainBalance || 0),
      rewardBalance: Number(entry.balances?.rewardBalance || 0),
      totalDeposits: Number(entry.balances?.totalDeposits || 0),
      dataBundleCount: Number(entry.balances?.dataBundleCount || 0),
      tickets: Number(entry.balances?.tickets || 0),
    });
    setFormOpen(true);
  };

  const submitForm = async () => {
    try {
      setFormLoading(true);
      setFormError("");
      if (!form.username || !form.email || !form.phoneNumber || !form.birthDate || !form.state) {
        setFormError("Username, email, phone, birth date and state are required.");
        return;
      }

      const payload = {
        username: form.username,
        email: form.email,
        phoneNumber: form.phoneNumber,
        birthDate: form.birthDate,
        state: form.state,
        role: form.role,
        userRole: form.userRole,
        isVerified: Boolean(form.isVerified),
        mainBalance: Number(form.mainBalance || 0),
        rewardBalance: Number(form.rewardBalance || 0),
        totalDeposits: Number(form.totalDeposits || 0),
        dataBundleCount: Number(form.dataBundleCount || 0),
        tickets: Number(form.tickets || 0),
      };

      if (formMode === "create") {
        if (!form.password || String(form.password).length < 6) {
          setFormError("Password must be at least 6 characters.");
          return;
        }
        payload.password = form.password;
        await createAdminUser(payload);
      } else {
        if (form.password) payload.password = form.password;
        await updateAdminUser(form.id, payload);
      }

      setFormOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save user.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (entry) => {
    const ok = window.confirm(`Delete user "${entry.personal?.username}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteAdminUser(entry.id);
      if (selectedUser?.id === entry.id) setSelectedUser(null);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user.");
    }
  };

  if (!isAdmin) {
    return (
      <Page>
        <Container>
          <Header>
            <BackButton onClick={() => navigate("/")}>
              <ArrowLeft size={18} />
            </BackButton>
            <Title>Admin Dashboard</Title>
          </Header>
          <UnauthorizedCard>
            <Shield size={28} />
            <h3>Access denied</h3>
            <p>Only users with admin role can access this screen.</p>
          </UnauthorizedCard>
          <FloatingBottomNav />
        </Container>
      </Page>
    );
  }

  const summary = data?.summary || {};
  const users = data?.users || [];
  const topBuyers = data?.rankings?.topBuyers || [];
  const topWinners = data?.rankings?.topGameWinners || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <Page>
      <Container>
        <Header>
          <BackButton onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
          </BackButton>
          <Title>Admin Dashboard</Title>
          <RefreshButton onClick={loadData} disabled={loading} title="Refresh">
            <RefreshCw size={18} />
          </RefreshButton>
        </Header>

        <FilterCard>
          <SearchRow>
            <Search size={16} />
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username, email, phone, referral..."
            />
          </SearchRow>
          <FilterRow>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
            <Select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
              <option value="">All user roles</option>
              <option value="private">Private</option>
              <option value="merchant">Merchant</option>
            </Select>
            <Select value={verified} onChange={(e) => setVerified(e.target.value)}>
              <option value="">All verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </Select>
            <Select value={userAge} onChange={(e) => setUserAge(e.target.value)}>
              <option value="new">New users first</option>
              <option value="old">Old users first</option>
            </Select>
          </FilterRow>
          <ActionRow>
            <ApplyButton
              onClick={() => {
                setPage(1);
                loadData();
              }}
              disabled={loading}
            >
              Apply Filters
            </ApplyButton>
            <CreateButton onClick={openCreate}>
              <Plus size={16} />
              Create User
            </CreateButton>
          </ActionRow>
        </FilterCard>

        {error ? <ErrorBox>{error}</ErrorBox> : null}

        {loading ? (
          <LoadingBox>Loading dashboard data...</LoadingBox>
        ) : (
          <>
            <SectionTitle>Overview</SectionTitle>
            <SummaryGrid>
              <SummaryCard>
                <Users size={18} />
                <h4>Total Users</h4>
                <strong>{summary.usersCount || 0}</strong>
                <small>Admins: {summary.adminCount || 0}</small>
              </SummaryCard>
              <SummaryCard>
                <Shield size={18} />
                <h4>Roles</h4>
                <strong>
                  Private {summary.privateCount || 0} / Merchant {summary.merchantCount || 0}
                </strong>
                <small>Verified: {summary.verifiedCount || 0}</small>
              </SummaryCard>
              <SummaryCard>
                <Wallet size={18} />
                <h4>Total Balances</h4>
                <strong>{naira(summary.totalBalance)}</strong>
                <small>Main {naira(summary.totalMainBalance)} | Reward {naira(summary.totalRewardBalance)}</small>
              </SummaryCard>
              <SummaryCard>
                <Trophy size={18} />
                <h4>Games</h4>
                <strong>{summary.totalWins || 0} wins</strong>
                <small>Prize Won: {naira(summary.totalPrizeWon)}</small>
              </SummaryCard>
            </SummaryGrid>

            <SectionTitle>Top Buyer Ranks (Top 100)</SectionTitle>
            <RankList>
              {topBuyers.slice(0, 20).map((item) => (
                <RankItem key={`buyer-${item.userId}`}>
                  <span>#{item.rank} {item.username}</span>
                  <span>{item.dataBundleCount} buys</span>
                </RankItem>
              ))}
            </RankList>

            <SectionTitle>Top Game Winner Ranks (Top 100)</SectionTitle>
            <RankList>
              {topWinners.slice(0, 20).map((item) => (
                <RankItem key={`winner-${item.userId}`}>
                  <span>#{item.rank} {item.username}</span>
                  <span>{item.totalWins} wins</span>
                </RankItem>
              ))}
            </RankList>

            <SectionTitle>Users ({users.length})</SectionTitle>
            <UsersWrap>
              {users.map((entry) => (
                <UserCard key={entry.id}>
                  <UserTop>
                    <strong>{entry.personal?.username}</strong>
                    <Tag>{entry.personal?.role || "user"}</Tag>
                  </UserTop>
                  <UserMeta>{entry.personal?.email}</UserMeta>
                  <UserMeta>State: {entry.personal?.state || "—"}</UserMeta>
                  <UserMeta>
                    Balances: {naira(entry.balances?.mainBalance)} main / {naira(entry.balances?.rewardBalance)} reward
                  </UserMeta>
                  <UserMeta>
                    BuyData: {entry.balances?.dataBundleCount || 0} | Tickets: {entry.balances?.tickets || 0}
                  </UserMeta>
                  <UserMeta>
                    Game W/L: {entry.games?.totalGameWins || 0}/{entry.games?.totalGameLosses || 0}
                  </UserMeta>
                  <DetailButton onClick={() => setSelectedUser(entry)}>View Full Details</DetailButton>
                  <UserActions>
                    <EditSmall onClick={() => openEdit(entry)}>
                      <Pencil size={14} /> Edit
                    </EditSmall>
                    <DeleteSmall onClick={() => handleDeleteUser(entry)}>
                      <Trash2 size={14} /> Delete
                    </DeleteSmall>
                  </UserActions>
                </UserCard>
              ))}
            </UsersWrap>

            <Pager>
              <PagerBtn
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </PagerBtn>
              <PageLabel>
                Page {pagination.page || 1} of {pagination.totalPages || 1}
              </PageLabel>
              <PagerBtn
                disabled={pagination.page >= (pagination.totalPages || 1) || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </PagerBtn>
            </Pager>
          </>
        )}
      </Container>

      {selectedUser ? (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h3>{selectedUser.personal?.username}</h3>
              <button onClick={() => setSelectedUser(null)}>
                <X size={16} />
              </button>
            </ModalHead>
            <ModalActions>
              <EditSmall onClick={() => openEdit(selectedUser)}>
                <Pencil size={14} /> Edit
              </EditSmall>
              <DeleteSmall onClick={() => handleDeleteUser(selectedUser)}>
                <Trash2 size={14} /> Delete
              </DeleteSmall>
            </ModalActions>

            <ModalSection>
              <h4>Personal Info</h4>
              <p>Email: {selectedUser.personal?.email}</p>
              <p>Phone: {selectedUser.personal?.phoneNumber || "—"}</p>
              <p>State: {selectedUser.personal?.state || "—"}</p>
              <p>Role: {selectedUser.personal?.role || "user"} / {selectedUser.personal?.userRole || "—"}</p>
              <p>Verified: {selectedUser.personal?.isVerified ? "Yes" : "No"}</p>
              <p>Last Login: {dateFmt(selectedUser.personal?.lastLogin)}</p>
            </ModalSection>

            <ModalSection>
              <h4>Balances</h4>
              <p>Main: {naira(selectedUser.balances?.mainBalance)}</p>
              <p>Reward: {naira(selectedUser.balances?.rewardBalance)}</p>
              <p>Total: {naira(selectedUser.balances?.totalBalance)}</p>
              <p>Total Deposits: {naira(selectedUser.balances?.totalDeposits)}</p>
            </ModalSection>

            <ModalSection>
              <h4>Game Stats</h4>
              <p>Total Wins: {selectedUser.games?.totalGameWins || 0}</p>
              <p>Total Losses: {selectedUser.games?.totalGameLosses || 0}</p>
              <p>Total Prize Won: {naira(selectedUser.games?.totalPrizeWon)}</p>
            </ModalSection>

            <ModalSection>
              <h4>History Snapshots</h4>
              <p>Deposits: {(selectedUser.history?.deposits || []).length}</p>
              <p>Withdrawals: {(selectedUser.history?.withdrawals || []).length}</p>
              <p>BuyData Purchases: {(selectedUser.history?.purchases || []).length}</p>
              <p>Redeems: {(selectedUser.history?.redeems || []).length}</p>
            </ModalSection>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      {formOpen ? (
        <ModalOverlay onClick={() => setFormOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h3>{formMode === "create" ? "Create User" : "Edit User"}</h3>
              <button onClick={() => setFormOpen(false)}>
                <X size={16} />
              </button>
            </ModalHead>
            {formError ? <ErrorBox>{formError}</ErrorBox> : null}
            <FormGrid>
              <Field>
                <label>Username</label>
                <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
              </Field>
              <Field>
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </Field>
              <Field>
                <label>Phone Number</label>
                <input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
              </Field>
              <Field>
                <label>Birth Date</label>
                <input type="date" value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} />
              </Field>
              <Field>
                <label>State</label>
                <input value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
              </Field>
              <Field>
                <label>Password {formMode === "edit" ? "(optional)" : ""}</label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </Field>
              <Field>
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field>
                <label>User Role</label>
                <select value={form.userRole} onChange={(e) => setForm((p) => ({ ...p, userRole: e.target.value }))}>
                  <option value="private">Private</option>
                  <option value="merchant">Merchant</option>
                </select>
              </Field>
              <Field>
                <label>Verified</label>
                <select
                  value={form.isVerified ? "true" : "false"}
                  onChange={(e) => setForm((p) => ({ ...p, isVerified: e.target.value === "true" }))}
                >
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </Field>
              <Field>
                <label>Main Balance</label>
                <input type="number" value={form.mainBalance} onChange={(e) => setForm((p) => ({ ...p, mainBalance: e.target.value }))} />
              </Field>
              <Field>
                <label>Reward Balance</label>
                <input type="number" value={form.rewardBalance} onChange={(e) => setForm((p) => ({ ...p, rewardBalance: e.target.value }))} />
              </Field>
              <Field>
                <label>Total Deposits</label>
                <input type="number" value={form.totalDeposits} onChange={(e) => setForm((p) => ({ ...p, totalDeposits: e.target.value }))} />
              </Field>
              <Field>
                <label>Data Bundle Count</label>
                <input type="number" value={form.dataBundleCount} onChange={(e) => setForm((p) => ({ ...p, dataBundleCount: e.target.value }))} />
              </Field>
              <Field>
                <label>Tickets</label>
                <input type="number" value={form.tickets} onChange={(e) => setForm((p) => ({ ...p, tickets: e.target.value }))} />
              </Field>
            </FormGrid>
            <ActionRow>
              <ApplyButton disabled={formLoading} onClick={submitForm}>
                {formLoading ? "Saving..." : formMode === "create" ? "Create User" : "Update User"}
              </ApplyButton>
            </ActionRow>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      <FloatingBottomNav />
    </Page>
  );
};

export default AdminScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 12px 170px;
  display: flex;
  justify-content: center;
  font-family: "Plus Jakarta Sans", "Manrope", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
`;

const Container = styled.div`
  width: 100%;
  max-width: 480px;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
`;

const BackButton = styled.button`
  border: 1px solid #ececec;
  background: #fff;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const RefreshButton = styled(BackButton)``;

const Title = styled.h1`
  margin: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: #121212;
`;

const FilterCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 10px;
`;

const SearchRow = styled.div`
  border: 1px solid #ececec;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  height: 38px;
  font-size: 14px;
  font-weight: 500;
  color: #1d1d1d;
  min-width: 0;
`;

const FilterRow = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (max-width: 390px) {
    grid-template-columns: 1fr;
  }
`;

const Select = styled.select`
  border: 1px solid #ececec;
  border-radius: 10px;
  height: 38px;
  padding: 0 8px;
  background: #fff;
  min-width: 0;
`;

const ActionRow = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (max-width: 390px) {
    grid-template-columns: 1fr;
  }
`;

const ApplyButton = styled.button`
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CreateButton = styled.button`
  border: 1px solid #111;
  border-radius: 10px;
  background: #fff;
  color: #111;
  font-weight: 700;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
`;

const SectionTitle = styled.h2`
  margin: 14px 0 8px;
  font-size: 17px;
  font-weight: 750;
  letter-spacing: 0.01em;
  color: #191919;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (max-width: 390px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 4px;
  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.01em;
    color: #3a3a3a;
  }
  strong {
    font-size: 17px;
    font-weight: 800;
    color: #111;
  }
  small {
    color: #666;
    font-size: 12px;
    font-weight: 500;
  }
`;

const RankList = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
`;

const RankItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  font-weight: 560;
  color: #202020;
  &:last-child {
    border-bottom: none;
  }
`;

const UsersWrap = styled.div`
  display: grid;
  gap: 8px;
`;

const UserCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 10px;
`;

const UserTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Tag = styled.span`
  background: #fff5eb;
  color: #b85b00;
  border: 1px solid #ffd4ad;
  border-radius: 999px;
  font-size: 12px;
  padding: 2px 8px;
`;

const UserMeta = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: #2c2c2c;
  font-weight: 520;
`;

const DetailButton = styled.button`
  margin-top: 8px;
  width: 100%;
  border: none;
  border-radius: 10px;
  height: 38px;
  cursor: pointer;
  background: #111;
  color: #fff;
  font-weight: 700;
`;

const UserActions = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const EditSmall = styled.button`
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const DeleteSmall = styled.button`
  height: 36px;
  border-radius: 10px;
  border: 1px solid #ffd1d1;
  background: #fff5f5;
  color: #c21f1f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const Pager = styled.div`
  margin-top: 10px;
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  align-items: center;
`;

const PagerBtn = styled.button`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  height: 38px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageLabel = styled.span`
  font-size: 13px;
  color: #444;
  font-weight: 600;
`;

const UnauthorizedCard = styled.div`
  margin-top: 12px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 18px 14px;
  text-align: center;
  h3 {
    margin: 10px 0 4px;
    font-weight: 800;
    letter-spacing: 0.01em;
  }
  p {
    margin: 0;
    color: #555;
    font-weight: 520;
  }
`;

const LoadingBox = styled.div`
  margin-top: 12px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;

const ErrorBox = styled.div`
  margin-top: 10px;
  background: #fff2f2;
  color: #9a1111;
  border: 1px solid #ffd1d1;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 12px;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #ececec;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.01em;
  }
  button {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid #ececec;
    background: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
`;

const ModalActions = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ModalSection = styled.div`
  margin-top: 10px;
  background: #fafafa;
  border: 1px solid #efefef;
  border-radius: 10px;
  padding: 10px;
  h4 {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 760;
    color: #161616;
  }
  p {
    margin: 4px 0;
    font-size: 13px;
    font-weight: 520;
    color: #2a2a2a;
  }
`;

const FormGrid = styled.div`
  margin-top: 10px;
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 4px;
  label {
    font-size: 12px;
    color: #4d4d4d;
    font-weight: 650;
  }
  input,
  select {
    height: 36px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 550;
    color: #191919;
    min-width: 0;
  }
`;

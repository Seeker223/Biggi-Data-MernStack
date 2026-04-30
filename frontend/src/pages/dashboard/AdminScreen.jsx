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
  Percent,
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
  getAdminUsers,
  updateAdminUser,
  adminSyncProviderCatalog,
  adminResetProviderCatalog,
  createAdminPlan,
  deleteAdminPlan,
  getAdminPlans,
  getAdminProfitSummary,
  getAdminProfitSweepSettings,
  getAdminProfitSweeps,
  runAdminProfitSweepNow,
  updateAdminPlan,
  updateAdminProfitSweepSettings,
  getAdminDepositFeeSettings,
  updateAdminDepositFeeSettings,
  getAdminDepositFeeLedger,
  deleteAdminDepositFeeLedger,
} from "../../services/api";
import { Alert } from "../../utils/alert";

const naira = (v) => `N${Number(v || 0).toLocaleString()}`;
const dateFmt = (v) => (v ? new Date(v).toLocaleString() : "-");

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

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Abuja",
  "Zamfara",
];

const AdminScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [section, setSection] = useState("users"); // users | plans
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState("");
  const [verified, setVerified] = useState("");
  const [userAge, setUserAge] = useState("new");
  const [stateFilter, setStateFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    role: "",
    userRole: "",
    verified: "",
    userAge: "new",
    stateFilter: "",
  });
  const [page, setPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersData, setUsersData] = useState({ users: [], pagination: { page: 1, totalPages: 1 } });
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [insightsData, setInsightsData] = useState({ summary: {}, rankings: {}, stateBreakdown: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Plans admin state
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [plans, setPlans] = useState([]);
  const [planQ, setPlanQ] = useState("");
  const [planNetwork, setPlanNetwork] = useState("");
  const [planCategory, setPlanCategory] = useState("");
  const [planActive, setPlanActive] = useState("true");
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [planFormMode, setPlanFormMode] = useState("create"); // create | edit
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [planFormError, setPlanFormError] = useState("");
  const [planForm, setPlanForm] = useState({
    plan_id: "",
    zenipoint_code: "",
    name: "",
    network: "",
    category: "",
    validity: "30 days",
    provider_amount: "",
    markup: 100,
    active: true,
  });

  // Profit sweep (admin)
  const [profitSummary, setProfitSummary] = useState(null);
  const [profitSettings, setProfitSettings] = useState(null);
  const [profitSweeps, setProfitSweeps] = useState([]);
  const [profitOpen, setProfitOpen] = useState(false);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitError, setProfitError] = useState("");

  // Deposit fee (admin)
  const [depositFeeOpen, setDepositFeeOpen] = useState(false);
  const [depositFeeSettings, setDepositFeeSettings] = useState(null);
  const [depositFeeLedger, setDepositFeeLedger] = useState([]);
  const [depositFeePage, setDepositFeePage] = useState(1);
  const [depositFeePages, setDepositFeePages] = useState(1);
  const [depositFeeLoading, setDepositFeeLoading] = useState(false);
  const [depositFeeError, setDepositFeeError] = useState("");
  const [openReferral, setOpenReferral] = useState(null);
  const [referralSearch, setReferralSearch] = useState("");
  const [referralShowAll, setReferralShowAll] = useState(() => ({}));
  const [referralPage, setReferralPage] = useState(1);
  const referralPageSize = 5;

  const isAdmin = useMemo(() => String(user?.role || "").toLowerCase() === "admin", [user?.role]);
  const myUserId = useMemo(() => String(user?.id || user?._id || ""), [user?.id, user?._id]);

  useEffect(() => {
    // Avoid accidental bulk actions across filter/page changes.
    setSelectedUserIds(new Set());
  }, [page, appliedFilters, section]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      // Use the lightweight users endpoint for the list (dashboard is heavy and can time out in production).
      // We still normalize into the same UI shape so cards show live balances/tickets/etc.
      const res = await getAdminUsers({
        page,
        limit: 20,
        search: appliedFilters.search?.trim() || undefined,
        role: appliedFilters.role || undefined,
        userRole: appliedFilters.userRole || undefined,
        verified: appliedFilters.verified || undefined,
        userAge: appliedFilters.userAge || undefined,
        state: appliedFilters.stateFilter || undefined,
      });
      const payload = res?.data || {};
      const rawUsers = Array.isArray(payload.users) ? payload.users : [];
      const normalizedUsers = rawUsers.map((u) => ({
        id: u._id || u.id,
        personal: {
          username: u.username,
          email: u.email,
          phoneNumber: u.phoneNumber,
          state: u.state,
          birthDate: u.birthDate,
          photo: u.photo,
          isVerified: Boolean(u.isVerified),
          verifiedAt: u.verifiedAt,
          role: u.role,
          userRole: u.userRole,
          referralCode: u.referralCode,
          referredByCode: u.referredByCode,
          referredUsersCount: Array.isArray(u.referralRewardedUsers)
            ? u.referralRewardedUsers.length
            : 0,
          lastLogin: u.lastLogin,
          lastLogout: u.lastLogout,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
        balances: {
          mainBalance: Number(u.mainBalance || 0),
          previousMainBalance: null,
          rewardBalance: Number(u.rewardBalance || 0),
          totalDeposits: Number(u.totalDeposits || 0),
          dataBundleCount: Number(u.dataBundleCount || 0),
          tickets: Number(u.tickets || 0),
        },
        games: {
          totalGameWins: Number(u.totalWins || 0),
          totalGameLosses: 0,
          totalGamePlays: Array.isArray(u.dailyNumberDraw) ? u.dailyNumberDraw.length : 0,
        },
      }));
      setUsersData({
        users: normalizedUsers,
        pagination: payload.pagination || { page, totalPages: 1 },
      });
    } catch (err) {
      setUsersError(err?.response?.data?.message || "Failed to load users list.");
    } finally {
      setUsersLoading(false);
    }
  }, [page, appliedFilters]);

  const loadInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      setInsightsError("");
      const res = await getAdminDashboard({
        historyLimit: 8,
        search: appliedFilters.search?.trim() || undefined,
        role: appliedFilters.role || undefined,
        userRole: appliedFilters.userRole || undefined,
        verified: appliedFilters.verified || undefined,
        userAge: appliedFilters.userAge || undefined,
        state: appliedFilters.stateFilter || undefined,
      });
      const payload = res?.data || {};
      setInsightsData({
        summary: payload.summary || {},
        rankings: payload.rankings || {},
        stateBreakdown: payload.stateBreakdown || [],
      });
      setInsightsLoaded(true);
    } catch (err) {
      setInsightsError(err?.response?.data?.message || "Insights are taking too long to load.");
    } finally {
      setInsightsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    if (!isAdmin) return;
    if (section === "users") loadUsers();
  }, [isAdmin, loadUsers, section]);

  useEffect(() => {
    if (!isAdmin) return;
    if (section === "users") loadInsights();
  }, [isAdmin, loadInsights, section]);

  const loadPlans = useCallback(async () => {
    try {
      setPlanLoading(true);
      setPlanError("");
      const params = {
        q: planQ.trim() || undefined,
        network: planNetwork || undefined,
        category: planCategory || undefined,
        active: planActive === "" ? undefined : planActive,
      };
      const res = await getAdminPlans(params);
      setPlans(Array.isArray(res?.data?.plans) ? res.data.plans : []);
    } catch (err) {
      setPlanError(err?.response?.data?.msg || err?.response?.data?.message || "Failed to load plans.");
    } finally {
      setPlanLoading(false);
    }
  }, [planActive, planCategory, planNetwork, planQ]);

  const loadProfit = useCallback(async () => {
    try {
      setProfitLoading(true);
      setProfitError("");
      const [sumRes, settingsRes, sweepsRes] = await Promise.all([
        getAdminProfitSummary(),
        getAdminProfitSweepSettings(),
        getAdminProfitSweeps(),
      ]);
      setProfitSummary(sumRes?.data?.summary || null);
      const rawSettings = settingsRes?.data?.settings || null;
      // Frontend-safe defaults in case older settings were saved empty.
      const normalizedSettings = rawSettings
        ? {
            ...rawSettings,
            cron: rawSettings.cron || "55 23 * * *",
            timezone: rawSettings.timezone || "Africa/Lagos",
            narration: rawSettings.narration || "BiggiData profit sweep",
            minAmount:
              rawSettings.minAmount === null || rawSettings.minAmount === undefined
                ? 5000
                : rawSettings.minAmount,
            currency: rawSettings.currency || "NGN",
          }
        : null;
      setProfitSettings(normalizedSettings);
      setProfitSweeps(Array.isArray(sweepsRes?.data?.sweeps) ? sweepsRes.data.sweeps : []);
    } catch (err) {
      setProfitError(err?.response?.data?.msg || err?.response?.data?.message || "Failed to load profit data.");
    } finally {
      setProfitLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (section === "plans") loadPlans();
  }, [isAdmin, loadPlans, section]);

  useEffect(() => {
    if (!isAdmin) return;
    if (section === "plans") loadProfit();
  }, [isAdmin, loadProfit, section]);

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
      await loadUsers();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save user.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (entry) => {
    const ok = await Alert.confirm({
      tone: "error",
      title: "Delete User",
      message: `Delete user "${entry.personal?.username}"?\n\nThis cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await deleteAdminUser(entry.id);
      if (selectedUser?.id === entry.id) setSelectedUser(null);
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.id);
        return next;
      });
      await loadUsers();
    } catch (err) {
      setUsersError(err?.response?.data?.message || "Failed to delete user.");
    }
  };

  const toggleSelectUser = (id) => {
    if (!id) return;
    if (String(id) === myUserId) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (users = []) => {
    const ids = (users || [])
      .map((u) => u?.id)
      .filter((id) => id && String(id) !== myUserId);
    if (!ids.length) return;
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeleteSelectedUsers = async () => {
    const ids = Array.from(selectedUserIds || []);
    if (!ids.length) return;

    const ok = await Alert.confirm({
      tone: "error",
      title: "Delete Selected Users",
      message: `Delete ${ids.length} selected user${ids.length === 1 ? "" : "s"}?\n\nThis cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      setBulkDeleting(true);
      const results = await Promise.allSettled(ids.map((id) => deleteAdminUser(id)));
      const failed = results.filter((r) => r.status === "rejected").length;

      setSelectedUserIds(new Set());
      if (selectedUser?.id && ids.includes(selectedUser.id)) setSelectedUser(null);
      await loadUsers();

      if (failed) {
        Alert.alert({
          tone: "warning",
          title: "Some Deletes Failed",
          message: `${failed} of ${ids.length} user(s) could not be deleted. Please refresh and try again.`,
        });
      } else {
        Alert.alert({ tone: "success", title: "Deleted", message: "Selected users deleted successfully." });
      }
    } catch (err) {
      Alert.alert({
        tone: "error",
        title: "Delete Failed",
        message: err?.response?.data?.message || "Failed to delete selected users.",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const resetPlanForm = () => {
    setPlanFormError("");
    setPlanForm({
      plan_id: "",
      zenipoint_code: "",
      name: "",
      network: "",
      category: "",
      validity: "30 days",
      provider_amount: "",
      markup: 100,
      active: true,
    });
  };

  const openPlanCreate = () => {
    setPlanFormMode("create");
    resetPlanForm();
    setPlanFormOpen(true);
  };

  const openPlanEdit = (p) => {
    setPlanFormMode("edit");
    setPlanFormError("");
    setPlanForm({
      plan_id: p.plan_id || "",
      zenipoint_code: p.zenipoint_code || "",
      name: p.name || "",
      network: p.network || "",
      category: p.category || "",
      validity: p.validity || "30 days",
      provider_amount: p.provider_amount ?? "",
      markup: p.markup ?? 100,
      active: Boolean(p.active),
    });
    setPlanFormOpen(true);
  };

  const submitPlanForm = async () => {
    try {
      setPlanFormLoading(true);
      setPlanFormError("");
      const payload = {
        plan_id: String(planForm.plan_id || "").trim(),
        zenipoint_code: String(planForm.zenipoint_code || "").trim(),
        name: String(planForm.name || "").trim(),
        network: String(planForm.network || "").trim(),
        category: String(planForm.category || "").trim(),
        validity: String(planForm.validity || "").trim(),
        provider_amount: Number(planForm.provider_amount),
        markup: Number(planForm.markup),
        active: Boolean(planForm.active),
      };

      if (!payload.plan_id || !payload.zenipoint_code || !payload.name || !payload.network || !payload.category) {
        setPlanFormError("Plan ID, plan code, name, network and category are required.");
        return;
      }
      if (!Number.isFinite(payload.provider_amount)) {
        setPlanFormError("Zenipoint price must be a valid number.");
        return;
      }
      if (!Number.isFinite(payload.markup)) {
        setPlanFormError("Profit (markup) must be a valid number.");
        return;
      }

      if (planFormMode === "create") {
        await createAdminPlan(payload);
      } else {
        await updateAdminPlan(payload.plan_id, payload);
      }
      setPlanFormOpen(false);
      await loadPlans();
    } catch (err) {
      setPlanFormError(err?.response?.data?.msg || err?.response?.data?.message || "Failed to save plan.");
    } finally {
      setPlanFormLoading(false);
    }
  };

  const handleDeletePlan = async (p) => {
    const ok = await Alert.confirm({
      tone: "warning",
      title: "Deactivate Plan",
      message: `Deactivate plan "${p?.plan_id}"?`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      const id = String(p?.plan_id || "").trim();
      if (!id) return;
      await deleteAdminPlan(id);
      await loadPlans();
    } catch (err) {
      setPlanError(err?.response?.data?.msg || err?.response?.data?.message || "Failed to deactivate plan.");
    }
  };

  const handleSyncCatalog = async () => {
    const ok = await Alert.confirm({
      tone: "warning",
      title: "Sync Provider Catalog",
      message: "Sync plans from provider catalog?\n\nThis will disable any plans not in the catalog.",
      confirmText: "Sync",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      setPlanLoading(true);
      setPlanError("");
      await adminSyncProviderCatalog();
      await loadPlans();
    } catch (err) {
      setPlanError(err?.response?.data?.msg || err?.response?.data?.message || "Sync failed.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleResetCatalog = async () => {
    const ok = await Alert.confirm({
      tone: "error",
      title: "Hard Reset Plans",
      message:
        "HARD RESET plans to provider catalog?\n\nThis will DELETE legacy plans from the database and replace with the latest list only.",
      confirmText: "Hard Reset",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      setPlanLoading(true);
      setPlanError("");
      await adminResetProviderCatalog();
      await loadPlans();
    } catch (err) {
      setPlanError(err?.response?.data?.msg || err?.response?.data?.message || "Reset failed.");
    } finally {
      setPlanLoading(false);
    }
  };

  const openProfit = async () => {
    setProfitOpen(true);
    await loadProfit();
  };

  const saveProfitSettings = async () => {
    try {
      setProfitLoading(true);
      setProfitError("");
      await updateAdminProfitSweepSettings(profitSettings || {});
      await loadProfit();
    } catch (err) {
      setProfitError(err?.response?.data?.msg || err?.response?.data?.message || "Failed to save settings.");
    } finally {
      setProfitLoading(false);
    }
  };

  const runSweepNow = async () => {
    const ok = await Alert.confirm({
      tone: "warning",
      title: "Run Profit Sweep",
      message: "Run profit sweep now?",
      confirmText: "Run Now",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      setProfitLoading(true);
      setProfitError("");
      await runAdminProfitSweepNow(false);
      await loadProfit();
    } catch (err) {
      setProfitError(err?.response?.data?.msg || err?.response?.data?.message || "Sweep failed.");
    } finally {
      setProfitLoading(false);
    }
  };

  const loadDepositFees = async (pageOverride = depositFeePage) => {
    try {
      setDepositFeeLoading(true);
      setDepositFeeError("");
      const [settingsRes, ledgerRes] = await Promise.all([
        getAdminDepositFeeSettings(),
        getAdminDepositFeeLedger({ page: pageOverride, limit: 20 }),
      ]);
      const rawSettings = settingsRes?.data?.settings || null;
      const normalizedSettings = rawSettings
        ? {
            ...rawSettings,
            flatFee: rawSettings.flatFee ?? 0,
            percentFee: rawSettings.percentFee ?? 0,
            minFee: rawSettings.minFee ?? "",
            maxFee: rawSettings.maxFee ?? "",
          }
        : null;
      setDepositFeeSettings(normalizedSettings);
      setDepositFeeLedger(ledgerRes?.data?.entries || []);
      setDepositFeePage(ledgerRes?.data?.pagination?.page || pageOverride);
      setDepositFeePages(ledgerRes?.data?.pagination?.totalPages || 1);
    } catch (err) {
      setDepositFeeError(err?.response?.data?.message || "Failed to load deposit fee details.");
    } finally {
      setDepositFeeLoading(false);
    }
  };

  const openDepositFees = async () => {
    setDepositFeeOpen(true);
    await loadDepositFees(1);
  };

  const normalizeDepositFeePayload = (settings) => ({
    ...(settings || {}),
    flatFee: Number(settings?.flatFee || 0),
    percentFee: Number(settings?.percentFee || 0),
    minFee:
      settings?.minFee === "" || settings?.minFee === null || settings?.minFee === undefined
        ? 0
        : Number(settings?.minFee || 0),
    maxFee:
      settings?.maxFee === "" || settings?.maxFee === null || settings?.maxFee === undefined
        ? 0
        : Number(settings?.maxFee || 0),
  });

  const saveDepositFeeSettings = async (override) => {
    try {
      setDepositFeeLoading(true);
      setDepositFeeError("");
      const isEventLike = Boolean(override?.preventDefault || override?.currentTarget || override?.nativeEvent);
      const base = (isEventLike ? null : override) || depositFeeSettings || {};
      const payload = normalizeDepositFeePayload(base);
      await updateAdminDepositFeeSettings(payload);
      if (override) setDepositFeeSettings(payload);
      await loadDepositFees(depositFeePage || 1);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.message ||
        "Failed to save deposit fee settings.";
      setDepositFeeError(status ? `(${status}) ${msg}` : msg);
    } finally {
      setDepositFeeLoading(false);
    }
  };

  const resetDepositFeeDefaults = () => {
    const next = normalizeDepositFeePayload({
      ...(depositFeeSettings || {}),
      enabled: true,
      flatFee: 5,
      percentFee: 0,
      minFee: 0,
      maxFee: 0,
    });
    return saveDepositFeeSettings(next);
  };

  const clearDepositFeeMinMax = () => {
    const next = normalizeDepositFeePayload({
      ...(depositFeeSettings || {}),
      minFee: 0,
      maxFee: 0,
    });
    return saveDepositFeeSettings(next);
  };

  const deleteDepositFeeEntry = async (entry) => {
    const ok = await Alert.confirm({
      tone: "warning",
      title: "Delete Fee Entry",
      message: "Delete this deposit fee ledger entry? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await deleteAdminDepositFeeLedger(entry?._id);
      await loadDepositFees(depositFeePage || 1);
    } catch (err) {
      setDepositFeeError(err?.response?.data?.message || "Failed to delete ledger entry.");
    }
  };

  const goDepositFeePage = (nextPage) => {
    const safePage = Math.min(Math.max(1, Number(nextPage || 1)), Number(depositFeePages || 1));
    setDepositFeePage(safePage);
    loadDepositFees(safePage);
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

  const summary = insightsData?.summary || {};
  const users = usersData?.users || [];
  const topBuyers = insightsData?.rankings?.topBuyers || [];
  const topWinners = insightsData?.rankings?.topGameWinners || [];
  const referralLeaderboard = insightsData?.rankings?.referralLeaderboard || [];
  const filteredReferralLeaderboard = referralLeaderboard.filter((entry) => {
    const query = String(referralSearch || "").trim().toLowerCase();
    if (!query) return true;
    const referrer = entry?.referrer || {};
    const haystack = [
      referrer?.username,
      referrer?.email,
      entry?.referralCode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
  const referralTotalPages = Math.max(
    1,
    Math.ceil(filteredReferralLeaderboard.length / referralPageSize)
  );
  const referralPageSafe = Math.min(Math.max(1, referralPage), referralTotalPages);
  const pagedReferrals = filteredReferralLeaderboard.slice(
    (referralPageSafe - 1) * referralPageSize,
    referralPageSafe * referralPageSize
  );
  const stateBreakdown = insightsData?.stateBreakdown || [];
  const pagination = usersData?.pagination || { page: 1, totalPages: 1 };
  const userTotal = Number(summary.usersCount || 0);
  const privatePct = userTotal ? Math.round((Number(summary.privateCount || 0) / userTotal) * 100) : 0;
  const merchantPct = userTotal ? Math.round((Number(summary.merchantCount || 0) / userTotal) * 100) : 0;
  const verifiedPct = userTotal ? Math.round((Number(summary.verifiedCount || 0) / userTotal) * 100) : 0;
  const mainBal = Number(summary.totalMainBalance || 0);
  const rewardBal = Number(summary.totalRewardBalance || 0);
  const balanceTotal = mainBal + rewardBal;
  const mainPct = balanceTotal ? Math.round((mainBal / balanceTotal) * 100) : 0;
  const rewardPct = balanceTotal ? Math.round((rewardBal / balanceTotal) * 100) : 0;
  const buyerMax = Number(topBuyers?.[0]?.dataBundleCount || 1);
  const winnerMax = Number(topWinners?.[0]?.totalWins || 1);
  const selectedMembershipLabel =
    selectedUser &&
    (Number(selectedUser?.balances?.dataBundleCount || 0) > 0 ||
      String(selectedUser?.personal?.userRole || "").toLowerCase() === "merchant")
      ? "Biggi House"
      : "Standard";

  return (
    <Page>
      <Container>
        <Header>
          <BackButton onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
          </BackButton>
          <Title>Admin Dashboard</Title>
          <RefreshButton
            onClick={() => {
              if (section === "users") {
                loadUsers();
                loadInsights();
              } else {
                loadPlans();
              }
            }}
            disabled={section === "users" ? usersLoading : planLoading}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </RefreshButton>
        </Header>

        <SectionSwitch>
          <SwitchBtn $active={section === "users"} onClick={() => setSection("users")}>
            <Users size={16} /> Users
          </SwitchBtn>
          <SwitchBtn $active={section === "plans"} onClick={() => setSection("plans")}>
            <Wallet size={16} /> Plans
          </SwitchBtn>
        </SectionSwitch>

        {section === "users" ? (
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
                <option value="">All memberships</option>
                <option value="private">Standard</option>
                <option value="merchant">Biggi House</option>
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
              <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                <option value="">All states</option>
                {NIGERIA_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </FilterRow>
            <ActionRow>
              <ApplyButton
                onClick={() => {
                  setPage(1);
                  setAppliedFilters({
                    search,
                    role,
                    userRole,
                    verified,
                    userAge,
                    stateFilter,
                  });
                }}
                disabled={usersLoading}
              >
                Apply Filters
              </ApplyButton>
              <CreateButton onClick={openCreate}>
                <Plus size={16} />
                Create User
              </CreateButton>
            </ActionRow>
          </FilterCard>
        ) : (
          <FilterCard>
            <SearchRow>
              <Search size={16} />
              <SearchInput
                value={planQ}
                onChange={(e) => setPlanQ(e.target.value)}
                placeholder="Search by plan id, plan code, name..."
              />
            </SearchRow>
            <FilterRow>
              <Select value={planNetwork} onChange={(e) => setPlanNetwork(e.target.value)}>
                <option value="">All networks</option>
                <option value="mtn">MTN</option>
                <option value="glo">GLO</option>
                <option value="airtel">Airtel</option>
                <option value="etisalat">9Mobile</option>
              </Select>
              <Select value={planCategory} onChange={(e) => setPlanCategory(e.target.value)}>
                <option value="">All categories</option>
                <option value="SME">SME</option>
                <option value="SME2">SME2</option>
                <option value="CG">CG</option>
                <option value="DATA">DATA</option>
              </Select>
              <Select value={planActive} onChange={(e) => setPlanActive(e.target.value)}>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
                <option value="">All</option>
              </Select>
            </FilterRow>
            <ActionRow>
              <ApplyButton onClick={loadPlans} disabled={planLoading}>
                Apply Filters
              </ApplyButton>
              <CreateButton onClick={openPlanCreate}>
                <Plus size={16} />
                Create Plan
              </CreateButton>
              <SoftButton onClick={handleSyncCatalog} disabled={planLoading}>
                <RefreshCw size={16} />
                Sync Catalog
              </SoftButton>
              <DangerButton onClick={handleResetCatalog} disabled={planLoading} title="Delete legacy plans and replace with provider catalog only">
                <Trash2 size={16} />
                Reset Plans
              </DangerButton>
              <SoftButton onClick={openProfit} disabled={profitLoading}>
                <Wallet size={16} />
                Profit Sweep
              </SoftButton>
              <SoftButton onClick={openDepositFees} disabled={depositFeeLoading}>
                <Percent size={16} />
                Deposit Fees
              </SoftButton>
            </ActionRow>
          </FilterCard>
        )}

        {section === "users" && usersError ? <ErrorBox>{usersError}</ErrorBox> : null}
        {section === "users" && insightsError ? <ErrorBox>{insightsError}</ErrorBox> : null}
        {section === "plans" && planError ? <ErrorBox>{planError}</ErrorBox> : null}

        {section === "users" ? (
          <>
            {insightsLoading ? <LoadingBox>Loading insights...</LoadingBox> : null}
            {insightsLoaded && !insightsLoading ? (
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
                  <h4>Membership</h4>
                  <strong>
                    Standard {summary.privateCount || 0} / Biggi House {summary.merchantCount || 0}
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

              <SectionTitle>Visual Insights</SectionTitle>
              <VisualGrid>
                <ChartCard>
                  <ChartTitle>Membership Mix</ChartTitle>
                  <Donut
                    $private={privatePct}
                    $merchant={merchantPct}
                    title={`Standard ${privatePct}% | Biggi House ${merchantPct}%`}
                  >
                    <span>{userTotal}</span>
                    <small>Users</small>
                  </Donut>
                  <LegendRow>
                    <LegendDot $color="#ff7a00" />
                    <p>Standard: {summary.privateCount || 0} ({privatePct}%)</p>
                  </LegendRow>
                  <LegendRow>
                    <LegendDot $color="#1778f2" />
                    <p>Biggi House: {summary.merchantCount || 0} ({merchantPct}%)</p>
                  </LegendRow>
                </ChartCard>

                <ChartCard>
                  <ChartTitle>Wallet Distribution</ChartTitle>
                  <MetricLine>
                    <span>Main Balance</span>
                    <strong>{naira(mainBal)}</strong>
                  </MetricLine>
                  <ProgressTrack>
                    <ProgressFill $width={mainPct} $color="#111" />
                  </ProgressTrack>
                  <MetricLine>
                  <span>Reward Balance</span>
                  <strong>{naira(rewardBal)}</strong>
                </MetricLine>
                <ProgressTrack>
                  <ProgressFill $width={rewardPct} $color="#ff7a00" />
                </ProgressTrack>
                <MetricLine>
                  <span>Total</span>
                  <strong>{naira(balanceTotal)}</strong>
                </MetricLine>
              </ChartCard>

              <ChartCard>
                <ChartTitle>Verification Health</ChartTitle>
                <BigPercent>{verifiedPct}%</BigPercent>
                <ProgressTrack>
                  <ProgressFill $width={verifiedPct} $color="#10b981" />
                </ProgressTrack>
                <MetricLine>
                  <span>Verified</span>
                  <strong>{summary.verifiedCount || 0}</strong>
                </MetricLine>
                <MetricLine>
                  <span>Unverified</span>
                  <strong>{summary.unverifiedCount || 0}</strong>
                </MetricLine>
              </ChartCard>
            </VisualGrid>

            <SectionTitle>Top Referrals</SectionTitle>
            <ReferralSearchRow>
              <ReferralSearchInput
                value={referralSearch}
                onChange={(e) => setReferralSearch(e.target.value)}
                placeholder="Search by username, email, or referral code..."
              />
            </ReferralSearchRow>
            <ReferralCard>
              {pagedReferrals.length ? (
                pagedReferrals.map((entry) => {
                  const referrer = entry?.referrer;
                  const isOpen = String(openReferral || "") === String(entry?.referralCode || "");
                  const refCode = String(entry?.referralCode || "");
                  const showAll = Boolean(referralShowAll?.[refCode]);
                  const referrals = Array.isArray(entry?.referrals) ? entry.referrals : [];
                  const visibleReferrals = showAll ? referrals : referrals.slice(0, 10);
                  return (
                    <ReferralRow key={`ref-${entry?.referralCode || entry?.rank}`}>
                      <ReferralHeader
                        type="button"
                        onClick={() =>
                          setOpenReferral(isOpen ? null : String(entry?.referralCode || ""))
                        }
                      >
                        <div>
                          <strong>
                            #{entry?.rank}{" "}
                            {referrer?.username || referrer?.email || entry?.referralCode || "Unknown"}
                          </strong>
                          <ReferralMeta>
                            Code: {entry?.referralCode || "N/A"} •{" "}
                            {entry?.referralsTotal || 0} referrals
                          </ReferralMeta>
                        </div>
                        <ReferralBadge $open={isOpen}>{isOpen ? "Hide" : "View"}</ReferralBadge>
                      </ReferralHeader>

                      {isOpen ? (
                        <ReferralDetails>
                          {referrals.length ? (
                            <ReferralList>
                              {visibleReferrals.map((ref) => (
                                <ReferralItem key={`ref-user-${ref?._id}`}>
                                  <div>
                                    <strong>{ref?.username || ref?.email || "User"}</strong>
                                    <ReferralItemMeta>{ref?.email || "—"}</ReferralItemMeta>
                                  </div>
                                  <ReferralItemMeta>{dateFmt(ref?.createdAt)}</ReferralItemMeta>
                                </ReferralItem>
                              ))}
                              {referrals.length > 10 ? (
                                <ReferralToggle
                                  type="button"
                                  onClick={() =>
                                    setReferralShowAll((prev) => ({
                                      ...(prev || {}),
                                      [refCode]: !showAll,
                                    }))
                                  }
                                >
                                  {showAll ? "Show fewer" : `Show all (${referrals.length})`}
                                </ReferralToggle>
                              ) : null}
                            </ReferralList>
                          ) : (
                            <UserMeta>No referrals found for this code.</UserMeta>
                          )}
                        </ReferralDetails>
                      ) : null}
                    </ReferralRow>
                  );
                })
              ) : (
                <UserMeta>No referral leaderboard data yet.</UserMeta>
              )}
            </ReferralCard>
            {filteredReferralLeaderboard.length > referralPageSize ? (
              <ReferralPager>
                <PagerBtn
                  disabled={referralPageSafe <= 1}
                  onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </PagerBtn>
                <PageLabel>
                  Page {referralPageSafe} of {referralTotalPages}
                </PageLabel>
                <PagerBtn
                  disabled={referralPageSafe >= referralTotalPages}
                  onClick={() =>
                    setReferralPage((p) => Math.min(referralTotalPages, p + 1))
                  }
                >
                  Next
                </PagerBtn>
              </ReferralPager>
            ) : null}

            <SectionTitle>Top Buyer Ranks (Top 100)</SectionTitle>
            <RankList>
              {topBuyers.slice(0, 20).map((item) => (
                <RankItem key={`buyer-${item.userId}`}>
                  <span>#{item.rank} {item.username}</span>
                  <span>{item.dataBundleCount} buys</span>
                </RankItem>
              ))}
            </RankList>
            <BarChartCard>
              <ChartTitle>Top Buyers Graph (Top 8)</ChartTitle>
              {topBuyers.slice(0, 8).map((item) => (
                <BarRow key={`buyers-graph-${item.userId}`}>
                  <BarLabel>#{item.rank} {item.username}</BarLabel>
                  <BarTrack>
                    <BarFill $width={Math.max(5, Math.round((Number(item.dataBundleCount || 0) / buyerMax) * 100))} $color="#ff7a00" />
                  </BarTrack>
                  <BarValue>{item.dataBundleCount}</BarValue>
                </BarRow>
              ))}
            </BarChartCard>

            <SectionTitle>Top Game Winner Ranks (Top 100)</SectionTitle>
            <RankList>
              {topWinners.slice(0, 20).map((item) => (
                <RankItem key={`winner-${item.userId}`}>
                  <span>#{item.rank} {item.username}</span>
                  <span>{item.totalWins} wins</span>
                </RankItem>
              ))}
            </RankList>
            <BarChartCard>
              <ChartTitle>Top Winners Graph (Top 8)</ChartTitle>
              {topWinners.slice(0, 8).map((item) => (
                <BarRow key={`winners-graph-${item.userId}`}>
                  <BarLabel>#{item.rank} {item.username}</BarLabel>
                  <BarTrack>
                    <BarFill $width={Math.max(5, Math.round((Number(item.totalWins || 0) / winnerMax) * 100))} $color="#1778f2" />
                  </BarTrack>
                  <BarValue>{item.totalWins}</BarValue>
                </BarRow>
              ))}
            </BarChartCard>

            <BarChartCard>
              <ChartTitle>State Distribution (Top 10)</ChartTitle>
              {stateBreakdown.length ? (
                stateBreakdown.slice(0, 10).map((item) => (
                  <BarRow key={`state-graph-${item.state}`}>
                    <BarLabel>{item.state}</BarLabel>
                    <BarTrack>
                      <BarFill
                        $width={Math.max(
                          5,
                          Math.round(
                            (Number(item.count || 0) / Math.max(1, Number(stateBreakdown?.[0]?.count || 0))) * 100
                          )
                        )}
                        $color="#7c3aed"
                      />
                    </BarTrack>
                    <BarValue>{item.count}</BarValue>
                  </BarRow>
                ))
              ) : (
                <UserMeta>No state data available for current filters.</UserMeta>
              )}
            </BarChartCard>
              </>
            ) : null}

            {usersLoading && users.length === 0 ? (
              <LoadingBox>Loading users...</LoadingBox>
            ) : (
              <>
            <UsersHeaderRow>
              <SectionTitle>Users ({users.length})</SectionTitle>
              <BulkRow>
                <BulkBtn type="button" onClick={() => toggleSelectAllOnPage(users)} disabled={usersLoading || !users.length}>
                  {users
                    .map((u) => u?.id)
                    .filter((id) => id && String(id) !== myUserId)
                    .every((id) => selectedUserIds.has(id))
                    ? "Unselect All"
                    : "Select All"}
                </BulkBtn>
                <BulkDangerBtn
                  type="button"
                  onClick={() => handleDeleteSelectedUsers()}
                  disabled={bulkDeleting || usersLoading || selectedUserIds.size === 0}
                >
                  Delete Selected ({selectedUserIds.size})
                </BulkDangerBtn>
              </BulkRow>
            </UsersHeaderRow>
            <UsersWrap>
              {users.map((entry) => (
                <UserCard key={entry.id}>
                  <UserTop>
                    <UserTopLeft>
                      <SelectBox
                        type="checkbox"
                        checked={selectedUserIds.has(entry.id)}
                        disabled={String(entry.id) === myUserId}
                        onChange={() => toggleSelectUser(entry.id)}
                        aria-label={`Select ${entry.personal?.username || "user"}`}
                      />
                      <strong>{entry.personal?.username}</strong>
                    </UserTopLeft>
                    <Tag>{entry.personal?.role || "user"}</Tag>
                  </UserTop>
                  <UserMeta>{entry.personal?.email}</UserMeta>
                  <UserMeta>State: {entry.personal?.state || "-"}</UserMeta>
                  <UserMeta>
                    Balances: {naira(entry.balances?.mainBalance)} main (prev{" "}
                    {Number.isFinite(Number(entry.balances?.previousMainBalance))
                      ? naira(entry.balances?.previousMainBalance)
                      : "—"}
                    ) / {naira(entry.balances?.rewardBalance)} reward
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
                    <DeleteSmall onClick={() => handleDeleteUser(entry)} disabled={String(entry.id) === myUserId}>
                      <Trash2 size={14} /> Delete
                    </DeleteSmall>
                  </UserActions>
                </UserCard>
              ))}
            </UsersWrap>

              <Pager>
              <PagerBtn
                disabled={pagination.page <= 1 || usersLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </PagerBtn>
              <PageLabel>
                Page {pagination.page || 1} of {pagination.totalPages || 1}
              </PageLabel>
              <PagerBtn
                disabled={pagination.page >= (pagination.totalPages || 1) || usersLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </PagerBtn>
              </Pager>
              </>
            )}
          </>
        ) : null}

        {section === "plans" ? (
          planLoading ? (
            <LoadingBox>Loading plans...</LoadingBox>
          ) : (
            <>
              {profitSummary ? (
                <>
                  <SectionTitle>Profit Snapshot</SectionTitle>
                  <SummaryGrid>
                    <SummaryCard>
                      <Wallet size={18} />
                      <h4>Profit Balance (Flutterwave)</h4>
                      <strong>{naira(profitSummary.pending?.profit)}</strong>
                      <small>Pending (unswept): {profitSummary.pending?.count || 0} entries</small>
                    </SummaryCard>
                    <SummaryCard>
                      <Trophy size={18} />
                      <h4>Total Profit (All Time)</h4>
                      <strong>{naira(profitSummary.total?.profit)}</strong>
                      <small>Swept: {naira(profitSummary.swept?.profit)}</small>
                    </SummaryCard>
                  </SummaryGrid>
                </>
              ) : null}

              <SectionTitle>Plans ({plans.length})</SectionTitle>
              <PlansTable>
                <PlansHead>
                  <span>Network</span>
                  <span>Category</span>
                  <span>Plan</span>
                  <span>Plan Code</span>
                  <span>Zeniprice + Profit</span>
                  <span>BiggiData Price</span>
                  <span>Actions</span>
                </PlansHead>
                {plans.map((p) => {
                  const provider = Number(p.provider_amount ?? 0);
                  const markup = Number(p.markup ?? 100);
                  const total = Number(p.amount ?? provider + markup);
                  return (
                    <PlansRow key={p.plan_id}>
                      <span>{String(p.network || "").toUpperCase()}</span>
                      <span>{p.category}</span>
                      <PlanCell>
                        <strong>{p.name}</strong>
                        <small>{p.validity || "30 days"}</small>
                        <small>ID: {p.plan_id}</small>
                      </PlanCell>
                      <span>{p.zenipoint_code || p.plan_id}</span>
                      <span>{naira(provider)} + {naira(markup)}</span>
                      <span>
                        <strong>{naira(total)}</strong>
                      </span>
                      <RowActions>
                        <EditSmall onClick={() => openPlanEdit(p)}>
                          <Pencil size={14} /> Edit
                        </EditSmall>
                        <DeleteSmall onClick={() => handleDeletePlan(p)}>
                          <Trash2 size={14} /> Deactivate
                        </DeleteSmall>
                      </RowActions>
                    </PlansRow>
                  );
                })}
              </PlansTable>
            </>
          )
        ) : null}
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

            <DetailVisualWrap>
              <ChartTitle>User Snapshot</ChartTitle>
              <MiniStats>
                <MiniStat>
                  <strong>{naira(selectedUser.balances?.totalBalance)}</strong>
                  <span>Total Balance</span>
                </MiniStat>
                <MiniStat>
                  <strong>{selectedUser.games?.totalGameWins || 0}</strong>
                  <span>Total Wins</span>
                </MiniStat>
                <MiniStat>
                  <strong>{selectedUser.games?.totalGameLosses || 0}</strong>
                  <span>Total Losses</span>
                </MiniStat>
              </MiniStats>

              <MetricLine>
                <span>Main Balance</span>
                <strong>{naira(selectedUser.balances?.mainBalance)}</strong>
              </MetricLine>
              <MetricLine>
                <span>Previous Main</span>
                <strong>
                  {Number.isFinite(Number(selectedUser.balances?.previousMainBalance))
                    ? naira(selectedUser.balances?.previousMainBalance)
                    : "—"}
                </strong>
              </MetricLine>
              <ProgressTrack>
                <ProgressFill
                  $width={Math.max(
                    8,
                    Math.min(
                      100,
                      (Number(selectedUser.balances?.mainBalance || 0) /
                        Math.max(1, Number(selectedUser.balances?.totalBalance || 0))) *
                        100
                    )
                  )}
                  $color="#111"
                />
              </ProgressTrack>
              <MetricLine>
                <span>Reward Balance</span>
                <strong>{naira(selectedUser.balances?.rewardBalance)}</strong>
              </MetricLine>
              <ProgressTrack>
                <ProgressFill
                  $width={Math.max(
                    8,
                    Math.min(
                      100,
                      (Number(selectedUser.balances?.rewardBalance || 0) /
                        Math.max(1, Number(selectedUser.balances?.totalBalance || 0))) *
                        100
                    )
                  )}
                  $color="#ff7a00"
                />
              </ProgressTrack>

              <ChartTitle style={{ marginTop: 10 }}>Game Performance</ChartTitle>
              <BarRow>
                <BarLabel>Wins</BarLabel>
                <BarTrack>
                  <BarFill
                    $width={Math.max(
                      8,
                      Math.min(
                        100,
                        (Number(selectedUser.games?.totalGameWins || 0) /
                          Math.max(
                            1,
                            Number(selectedUser.games?.totalGameWins || 0) +
                              Number(selectedUser.games?.totalGameLosses || 0)
                          )) *
                          100
                      )
                    )}
                    $color="#10b981"
                  />
                </BarTrack>
                <BarValue>{selectedUser.games?.totalGameWins || 0}</BarValue>
              </BarRow>
              <BarRow>
                <BarLabel>Losses</BarLabel>
                <BarTrack>
                  <BarFill
                    $width={Math.max(
                      8,
                      Math.min(
                        100,
                        (Number(selectedUser.games?.totalGameLosses || 0) /
                          Math.max(
                            1,
                            Number(selectedUser.games?.totalGameWins || 0) +
                              Number(selectedUser.games?.totalGameLosses || 0)
                          )) *
                          100
                      )
                    )}
                    $color="#ef4444"
                  />
                </BarTrack>
                <BarValue>{selectedUser.games?.totalGameLosses || 0}</BarValue>
              </BarRow>
            </DetailVisualWrap>

            <ModalSection>
              <h4>Personal Info</h4>
              <p>Email: {selectedUser.personal?.email}</p>
              <p>Phone: {selectedUser.personal?.phoneNumber || "-"}</p>
              <p>State: {selectedUser.personal?.state || "-"}</p>
              <p>Role: {selectedUser.personal?.role || "user"}</p>
              <p>Membership: {selectedMembershipLabel}</p>
              <p>Data purchases (subscription): {selectedUser.balances?.dataBundleCount || 0}</p>
              <p>Verified: {selectedUser.personal?.isVerified ? "Yes" : "No"}</p>
              <p>Last Login: {dateFmt(selectedUser.personal?.lastLogin)}</p>
            </ModalSection>

            <ModalSection>
              <h4>Balances</h4>
              <p>Main: {naira(selectedUser.balances?.mainBalance)}</p>
              <p>
                Previous Main:{" "}
                {Number.isFinite(Number(selectedUser.balances?.previousMainBalance))
                  ? naira(selectedUser.balances?.previousMainBalance)
                  : "—"}
              </p>
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
            <EditVisualWrap>
              <VisualPillRow>
                <VisualPill $tone="dark">{form.role === "admin" ? "Admin Account" : "User Account"}</VisualPill>
                <VisualPill $tone={form.userRole === "merchant" ? "blue" : "orange"}>
                  {form.userRole === "merchant" ? "Biggi House" : "Standard"}
                </VisualPill>
                <VisualPill $tone={form.isVerified ? "green" : "red"}>
                  {form.isVerified ? "Verified" : "Unverified"}
                </VisualPill>
              </VisualPillRow>
              <MetricLine>
                <span>Main Balance</span>
                <strong>{naira(form.mainBalance)}</strong>
              </MetricLine>
              <ProgressTrack>
                <ProgressFill
                  $width={Math.max(
                    8,
                    Math.min(
                      100,
                      Number(form.mainBalance || 0) /
                        Math.max(1, Number(form.mainBalance || 0) + Number(form.rewardBalance || 0)) *
                        100
                    )
                  )}
                  $color="#111"
                />
              </ProgressTrack>
              <MetricLine>
                <span>Reward Balance</span>
                <strong>{naira(form.rewardBalance)}</strong>
              </MetricLine>
              <ProgressTrack>
                <ProgressFill
                  $width={Math.max(
                    8,
                    Math.min(
                      100,
                      Number(form.rewardBalance || 0) /
                        Math.max(1, Number(form.mainBalance || 0) + Number(form.rewardBalance || 0)) *
                        100
                    )
                  )}
                  $color="#ff7a00"
                />
              </ProgressTrack>
              <MiniStats>
                <MiniStat>
                  <strong>{Number(form.tickets || 0)}</strong>
                  <span>Tickets</span>
                </MiniStat>
                <MiniStat>
                  <strong>{Number(form.dataBundleCount || 0)}</strong>
                  <span>Data Buys</span>
                </MiniStat>
                <MiniStat>
                  <strong>{naira(form.totalDeposits || 0)}</strong>
                  <span>Total Deposits</span>
                </MiniStat>
              </MiniStats>
            </EditVisualWrap>
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
                <label>Membership</label>
                <select value={form.userRole} onChange={(e) => setForm((p) => ({ ...p, userRole: e.target.value }))}>
                  <option value="private">Standard</option>
                  <option value="merchant">Biggi House</option>
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

      {planFormOpen ? (
        <ModalOverlay onClick={() => setPlanFormOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h3>{planFormMode === "create" ? "Create Plan" : "Edit Plan"}</h3>
              <button onClick={() => setPlanFormOpen(false)}>
                <X size={16} />
              </button>
            </ModalHead>

            {planFormError ? <ErrorBox>{planFormError}</ErrorBox> : null}

            <EditVisualWrap>
              <VisualPillRow>
                <VisualPill $tone="dark">{String(planForm.network || "").toUpperCase() || "NETWORK"}</VisualPill>
                <VisualPill $tone="blue">{planForm.category || "CATEGORY"}</VisualPill>
                <VisualPill $tone={planForm.active ? "green" : "red"}>{planForm.active ? "Active" : "Inactive"}</VisualPill>
              </VisualPillRow>
              <MetricLine>
                <span>Zenipoint Price + Profit</span>
                <strong>
                  {naira(Number(planForm.provider_amount || 0))} + {naira(Number(planForm.markup || 0))}
                </strong>
              </MetricLine>
              <MetricLine>
                <span>BiggiData Price</span>
                <strong>
                  {naira(Number(planForm.provider_amount || 0) + Number(planForm.markup || 0))}
                </strong>
              </MetricLine>
            </EditVisualWrap>

            <FormGrid>
              <Field>
                <label>Network</label>
                <select value={planForm.network} onChange={(e) => setPlanForm((s) => ({ ...s, network: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="mtn">mtn</option>
                  <option value="glo">glo</option>
                  <option value="airtel">airtel</option>
                  <option value="etisalat">etisalat</option>
                </select>
              </Field>
              <Field>
                <label>Category</label>
                <input value={planForm.category} onChange={(e) => setPlanForm((s) => ({ ...s, category: e.target.value }))} placeholder="SME / SME2 / CG" />
              </Field>
              <Field>
                <label>Plan ID</label>
                <input
                  value={planForm.plan_id}
                  onChange={(e) => setPlanForm((s) => ({ ...s, plan_id: e.target.value }))}
                  placeholder="mtnsme_1"
                  disabled={planFormMode === "edit"}
                />
              </Field>
              <Field>
                <label>Plan Code (Zenipoint)</label>
                <input value={planForm.zenipoint_code} onChange={(e) => setPlanForm((s) => ({ ...s, zenipoint_code: e.target.value }))} placeholder="mtnsme_1" />
              </Field>
              <Field>
                <label>Name</label>
                <input value={planForm.name} onChange={(e) => setPlanForm((s) => ({ ...s, name: e.target.value }))} placeholder="MTN SME 1GB" />
              </Field>
              <Field>
                <label>Validity</label>
                <input value={planForm.validity} onChange={(e) => setPlanForm((s) => ({ ...s, validity: e.target.value }))} placeholder="30 days" />
              </Field>
              <Field>
                <label>Zenipoint Price</label>
                <input value={planForm.provider_amount} onChange={(e) => setPlanForm((s) => ({ ...s, provider_amount: e.target.value }))} placeholder="530" />
              </Field>
              <Field>
                <label>Profit (Markup)</label>
                <input value={planForm.markup} onChange={(e) => setPlanForm((s) => ({ ...s, markup: e.target.value }))} placeholder="100" />
              </Field>
              <Field>
                <label>Active</label>
                <select value={planForm.active ? "true" : "false"} onChange={(e) => setPlanForm((s) => ({ ...s, active: e.target.value === "true" }))}>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </Field>
            </FormGrid>

            <ActionRow>
              <CancelBtn onClick={() => setPlanFormOpen(false)} disabled={planFormLoading}>
                Cancel
              </CancelBtn>
              <ApplyButton onClick={submitPlanForm} disabled={planFormLoading}>
                {planFormLoading ? "Saving..." : "Save Plan"}
              </ApplyButton>
            </ActionRow>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      {profitOpen ? (
        <ModalOverlay onClick={() => setProfitOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h3>Profit Sweep</h3>
              <button onClick={() => setProfitOpen(false)}>
                <X size={16} />
              </button>
            </ModalHead>

            {profitError ? <ErrorBox>{profitError}</ErrorBox> : null}
            {profitLoading ? <LoadingBox>Loading profit data...</LoadingBox> : null}

            {profitSummary ? (
              <ModalSection>
                <h4>Summary</h4>
                <p>Pending (unswept): {naira(profitSummary.pending?.profit)} ({profitSummary.pending?.count || 0} entries)</p>
                <p>Swept: {naira(profitSummary.swept?.profit)} ({profitSummary.swept?.count || 0} entries)</p>
                <p>Total: {naira(profitSummary.total?.profit)} ({profitSummary.total?.count || 0} entries)</p>
              </ModalSection>
            ) : null}

            {profitSummary ? (
              <ModalSection>
                <h4>Profit Balance (Flutterwave)</h4>
                <p>
                  Available profit currently sitting in Flutterwave:{" "}
                  <strong>{naira(profitSummary.pending?.profit)}</strong>
                </p>
                <p>
                  This is the amount that will remain in Flutterwave if Profit Sweep is disabled.
                </p>
              </ModalSection>
            ) : null}

            <ModalSection>
              <h4>How to View in Flutterwave</h4>
              <p>1. Open your Flutterwave Dashboard.</p>
              <p>2. Go to Balances / Available Balance to see your current funds.</p>
              <p>3. If you run Profit Sweep, check Transfers to see the payout entry.</p>
            </ModalSection>

            {profitSettings ? (
              <>
                <ModalSection>
                  <h4>Auto Sweep Settings</h4>
                  <p>Auto sweep moves profit to your dedicated bank account using Flutterwave Transfers.</p>
                </ModalSection>
                <FormGrid>
                  <Field>
                    <label>Enabled</label>
                    <select
                      value={profitSettings.enabled ? "true" : "false"}
                      onChange={(e) =>
                        setProfitSettings((s) => ({ ...(s || {}), enabled: e.target.value === "true" }))
                      }
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </Field>
                  <Field>
                    <label>Minimum Amount</label>
                    <input
                      value={profitSettings.minAmount ?? 0}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), minAmount: Number(e.target.value) }))}
                      type="number"
                    />
                  </Field>
                  <Field>
                    <label>Bank Code</label>
                    <input
                      value={profitSettings.bankCode || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), bankCode: e.target.value }))}
                      placeholder="e.g. 044"
                    />
                  </Field>
                  <Field>
                    <label>Account Number</label>
                    <input
                      value={profitSettings.accountNumber || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), accountNumber: e.target.value }))}
                      placeholder="0123456789"
                    />
                  </Field>
                  <Field>
                    <label>Account Name (optional)</label>
                    <input
                      value={profitSettings.accountName || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), accountName: e.target.value }))}
                    />
                  </Field>
                  <Field>
                    <label>Cron</label>
                    <input
                      value={profitSettings.cron || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), cron: e.target.value }))}
                      placeholder="55 23 * * *"
                    />
                  </Field>
                  <Field>
                    <label>Timezone</label>
                    <input
                      value={profitSettings.timezone || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), timezone: e.target.value }))}
                      placeholder="Africa/Lagos"
                    />
                  </Field>
                  <Field>
                    <label>Narration</label>
                    <input
                      value={profitSettings.narration || ""}
                      onChange={(e) => setProfitSettings((s) => ({ ...(s || {}), narration: e.target.value }))}
                      placeholder="BiggiData profit sweep"
                    />
                  </Field>
                </FormGrid>
                <ActionRow>
                  <ApplyButton onClick={saveProfitSettings} disabled={profitLoading}>
                    {profitLoading ? "Saving..." : "Save Settings"}
                  </ApplyButton>
                  <SoftButton onClick={runSweepNow} disabled={profitLoading}>
                    Run Sweep Now
                  </SoftButton>
                </ActionRow>
              </>
            ) : null}

            {profitSweeps?.length ? (
              <ModalSection>
                <h4>Recent Sweeps</h4>
                {profitSweeps.slice(0, 8).map((s) => (
                  <p key={s.reference}>
                    {dateFmt(s.createdAt)} - {naira(s.amount)} - {String(s.status || "").toUpperCase()}
                  </p>
                ))}
              </ModalSection>
            ) : null}
          </ModalCard>
        </ModalOverlay>
      ) : null}

      {depositFeeOpen ? (
        <ModalOverlay onClick={() => setDepositFeeOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h3>Deposit Fee Profit</h3>
              <button onClick={() => setDepositFeeOpen(false)}>
                <X size={16} />
              </button>
            </ModalHead>

            {depositFeeError ? <ErrorBox>{depositFeeError}</ErrorBox> : null}
            {depositFeeLoading ? <LoadingBox>Loading deposit fees...</LoadingBox> : null}

            <ModalSection>
              <h4>Summary</h4>
              <p>Entries (page): {depositFeeLedger.length}</p>
              <p>Page: {depositFeePage} of {depositFeePages}</p>
              <p>
                Total (page): {naira(depositFeeLedger.reduce((sum, entry) => sum + Number(entry?.amount || 0), 0))}
              </p>
            </ModalSection>

            {depositFeeSettings ? (
              <>
                <ModalSection>
                  <h4>Deposit Fee Settings</h4>
                  <p>Deposit service charges are treated as profit and swept with other earnings.</p>
                </ModalSection>
                <FormGrid>
                  <Field>
                    <label>Enabled</label>
                    <select
                      value={depositFeeSettings.enabled ? "true" : "false"}
                      onChange={(e) =>
                        setDepositFeeSettings((s) => ({ ...(s || {}), enabled: e.target.value === "true" }))
                      }
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </Field>
                  <Field>
                    <label>Flat Fee (N)</label>
                    <input
                      type="number"
                      value={depositFeeSettings.flatFee ?? 0}
                      onChange={(e) =>
                        setDepositFeeSettings((s) => ({ ...(s || {}), flatFee: Number(e.target.value) }))
                      }
                      placeholder="5"
                    />
                  </Field>
                  <Field>
                    <label>Percent Fee (%)</label>
                    <input
                      type="number"
                      value={depositFeeSettings.percentFee ?? 0}
                      onChange={(e) =>
                        setDepositFeeSettings((s) => ({ ...(s || {}), percentFee: Number(e.target.value) }))
                      }
                      placeholder="0"
                    />
                  </Field>
                  <Field>
                    <label>Min Fee (N)</label>
                    <input
                      type="number"
                      value={depositFeeSettings.minFee ?? ""}
                      onChange={(e) =>
                        setDepositFeeSettings((s) => ({
                          ...(s || {}),
                          minFee: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                    />
                  </Field>
                  <Field>
                    <label>Max Fee (N)</label>
                    <input
                      type="number"
                      value={depositFeeSettings.maxFee ?? ""}
                      onChange={(e) =>
                        setDepositFeeSettings((s) => ({
                          ...(s || {}),
                          maxFee: e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                    />
                  </Field>
                </FormGrid>
                <ActionRow>
                  <ApplyButton onClick={() => saveDepositFeeSettings()} disabled={depositFeeLoading}>
                    {depositFeeLoading ? "Saving..." : "Save Settings"}
                  </ApplyButton>
                  <SoftButton onClick={() => loadDepositFees(depositFeePage || 1)} disabled={depositFeeLoading}>
                    Refresh Ledger
                  </SoftButton>
                  <SoftButton onClick={clearDepositFeeMinMax} disabled={depositFeeLoading}>
                    Clear Min/Max
                  </SoftButton>
                  <SoftButton onClick={resetDepositFeeDefaults} disabled={depositFeeLoading}>
                    Reset Defaults
                  </SoftButton>
                </ActionRow>
              </>
            ) : null}

            <ModalSection>
              <h4>Deposit Fee Ledger</h4>
              {depositFeeLedger.length ? (
                depositFeeLedger.map((entry) => {
                  const metaUser =
                    entry?.meta?.username ||
                    entry?.meta?.userId ||
                    entry?.userId ||
                    entry?.user ||
                    "Unknown user";
                  return (
                    <LedgerRow key={entry?._id || entry?.reference}>
                      <LedgerMeta>
                        <strong>
                          {naira(entry?.amount)} | {String(entry?.status || "pending").toUpperCase()}
                        </strong>
                        <small>
                          {metaUser} - {dateFmt(entry?.createdAt)}
                        </small>
                        <small>Ref: {entry?.reference || entry?._id}</small>
                      </LedgerMeta>
                      <DeleteSmall onClick={() => deleteDepositFeeEntry(entry)}>
                        <Trash2 size={12} /> Delete
                      </DeleteSmall>
                    </LedgerRow>
                  );
                })
              ) : (
                <p>No deposit fee entries yet.</p>
              )}
            </ModalSection>

            <Pager>
              <PagerBtn
                disabled={depositFeePage <= 1 || depositFeeLoading}
                onClick={() => goDepositFeePage(depositFeePage - 1)}
              >
                Previous
              </PagerBtn>
              <PageLabel>
                Page {depositFeePage} of {depositFeePages}
              </PageLabel>
              <PagerBtn
                disabled={depositFeePage >= depositFeePages || depositFeeLoading}
                onClick={() => goDepositFeePage(depositFeePage + 1)}
              >
                Next
              </PagerBtn>
            </Pager>
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
  max-width: 1120px;
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

const SectionSwitch = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 6px 0 10px;
`;

const SwitchBtn = styled.button`
  height: 42px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#ff7a00" : "#ececec")};
  background: ${(p) => (p.$active ? "#fff5ec" : "#fff")};
  color: #111;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

const SoftButton = styled.button`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #111;
  color: #fff;
  font-weight: 750;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  border: 1px solid #ffd1d1;
  border-radius: 10px;
  background: #fff5f5;
  color: #c21f1f;
  font-weight: 800;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  width: 100%;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #111;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
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

const VisualGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 12px;
`;

const BarChartCard = styled(ChartCard)`
  margin-top: 8px;
`;

const ChartTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 760;
  color: #171717;
`;

const Donut = styled.div`
  width: 120px;
  height: 120px;
  margin: 0 auto 10px;
  border-radius: 50%;
  background: ${({ $private, $merchant }) =>
    `conic-gradient(#ff7a00 0 ${$private}%, #1778f2 ${$private}% ${$private + $merchant}%, #ececec ${$private + $merchant}% 100%)`};
  display: grid;
  place-items: center;
  position: relative;
  &:before {
    content: "";
    position: absolute;
    width: 74px;
    height: 74px;
    border-radius: 50%;
    background: #fff;
  }
  span, small {
    position: relative;
    z-index: 1;
  }
  span {
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
  }
  small {
    margin-top: -2px;
    font-size: 11px;
    color: #666;
    font-weight: 600;
  }
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  p {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }
`;

const LegendDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const MetricLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 5px;
  gap: 8px;
  span {
    font-size: 12px;
    color: #555;
    font-weight: 600;
  }
  strong {
    font-size: 13px;
    color: #121212;
    font-weight: 760;
  }
`;

const BigPercent = styled.div`
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: #111;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #eceff3;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  width: ${({ $width }) => Math.max(0, Math.min(100, Number($width || 0)))}%;
  height: 100%;
  background: ${({ $color }) => $color || "#111"};
  border-radius: inherit;
  transition: width 260ms ease;
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(80px, 130px) 1fr auto;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
`;

const BarLabel = styled.span`
  font-size: 12px;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BarTrack = styled.div`
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #eceff3;
  overflow: hidden;
`;

const BarFill = styled.div`
  width: ${({ $width }) => Math.max(0, Math.min(100, Number($width || 0)))}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ $color }) => $color || "#111"};
`;

const BarValue = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #1d1d1d;
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

const ReferralCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 6px;
`;

const ReferralSearchRow = styled.div`
  margin: 0 0 8px;
  display: flex;
`;

const ReferralSearchInput = styled.input`
  width: 100%;
  border: 1px solid #ececec;
  border-radius: 10px;
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
`;

const ReferralRow = styled.div`
  border-bottom: 1px solid #f1f1f1;
  &:last-child {
    border-bottom: none;
  }
`;

const ReferralHeader = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  cursor: pointer;
`;

const ReferralMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #666;
`;

const ReferralBadge = styled.span`
  background: ${(p) => (p.$open ? "#111" : "#ff7a00")};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
`;

const ReferralDetails = styled.div`
  padding: 0 12px 12px;
`;

const ReferralList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReferralItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 8px 10px;
  background: #fafafa;
  font-size: 13px;
`;

const ReferralToggle = styled.button`
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #ff7a00;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
`;

const ReferralItemMeta = styled.div`
  font-size: 12px;
  color: #777;
`;

const ReferralPager = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 4px 0;
  gap: 8px;
`;

const UsersWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const UsersHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 8px;
  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const BulkRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  @media (max-width: 620px) {
    justify-content: flex-start;
  }
`;

const BulkBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  font-weight: 800;
  color: #111;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const BulkDangerBtn = styled(BulkBtn)`
  border-color: #ffd0d0;
  background: #fff2f2;
  color: #a12a2a;
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

const UserTopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SelectBox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #ff7a00;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
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

const PlansTable = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  overflow: hidden;
`;

const PlansHead = styled.div`
  display: grid;
  grid-template-columns: 0.7fr 0.7fr 1.4fr 1fr 1.1fr 1fr 1.2fr;
  gap: 8px;
  padding: 12px 12px;
  background: #fafafa;
  border-bottom: 1px solid #efefef;
  span {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #444;
  }
  @media (max-width: 520px) {
    display: none;
  }
`;

const PlansRow = styled.div`
  display: grid;
  grid-template-columns: 0.7fr 0.7fr 1.4fr 1fr 1.1fr 1fr 1.2fr;
  gap: 8px;
  padding: 12px 12px;
  border-bottom: 1px solid #f1f1f1;
  align-items: center;
  font-size: 12px;
  color: #111;
  &:last-child {
    border-bottom: none;
  }
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PlanCell = styled.div`
  min-width: 0;
  strong {
    display: block;
    font-size: 13px;
    font-weight: 820;
    color: #111;
    line-height: 1.15;
  }
  small {
    display: block;
    color: #666;
    font-weight: 650;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const RowActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  @media (max-width: 520px) {
    grid-template-columns: 1fr 1fr;
  }
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
  max-width: 520px;
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

const LedgerRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ececec;
  align-items: center;
  &:last-child {
    border-bottom: none;
  }
`;

const LedgerMeta = styled.div`
  display: grid;
  gap: 2px;
  strong {
    font-size: 13px;
    font-weight: 760;
    color: #111;
  }
  small {
    font-size: 12px;
    color: #555;
    font-weight: 560;
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

const EditVisualWrap = styled.div`
  margin-top: 10px;
  border: 1px solid #ececec;
  background: #fafafa;
  border-radius: 12px;
  padding: 10px;
`;

const DetailVisualWrap = styled(EditVisualWrap)`
  margin-top: 10px;
`;

const VisualPillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const VisualPill = styled.span`
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid;
  ${({ $tone }) => {
    if ($tone === "green") return "background:#eafaf2;color:#136a41;border-color:#b8ebd1;";
    if ($tone === "red") return "background:#fff2f2;color:#a12a2a;border-color:#ffd0d0;";
    if ($tone === "blue") return "background:#eef5ff;color:#1f5fbf;border-color:#cfe0ff;";
    if ($tone === "dark") return "background:#111;color:#fff;border-color:#111;";
    return "background:#fff5eb;color:#b85b00;border-color:#ffd4ad;";
  }}
`;

const MiniStats = styled.div`
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const MiniStat = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 8px;
  strong {
    display: block;
    font-size: 13px;
    color: #111;
    font-weight: 760;
  }
  span {
    font-size: 11px;
    color: #666;
    font-weight: 600;
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

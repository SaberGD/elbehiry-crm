import {
  canManageStaff,
  canEditStaff,
  canViewPayroll,
  canManageOrganization,
  assignableRoles,
} from "../lib/access";
import {
  positionNames,
  positionRoles,
  isDirector,
  specialties,
  type Specialty,
} from "../lib/permissions";
import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useLanguage } from "../context/LanguageContext";
import { UserRole, User, FinancialRecord } from "../types/crm";
import {
  UserCheck2,
  Plus,
  Search,
  Building2,
  DollarSign,
  Briefcase,
  Layers,
  History,
  Lock,
  Edit2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export const StaffUsersPage: React.FC = () => {
  const {
    effectiveUser,
    users,
    branches,
    teams,
    companies,
    governorates,
    departmentEntities,
    jobPositions,
    addUser,
    updateUser,
    toggleUserActive,
    addDepartmentEntity,
    addJobPosition,
    updateUserSalaryInfo,
  } = useCRM();

  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    "employees" | "departments" | "financials"
  >("employees");

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingSalaryHistoryUser, setViewingSalaryHistoryUser] =
    useState<User | null>(null);

  // Form states for Add/Edit Employee
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("sales");
  const [supervisedBranchIds, setSupervisedBranchIds] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>("sales_agent");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [governorateId, setGovernorateId] = useState(governorates[0]?.id || "");
  const [branchId, setBranchId] = useState(branches[0]?.id || "");
  const [teamId, setTeamId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobPositionId, setJobPositionId] = useState("");
  const [directManagerId, setDirectManagerId] = useState("");

  // Financial fields inside employee form
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [commissionRate, setCommissionRate] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [salaryNotes, setSalaryNotes] = useState("");

  // Department & Job Position modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");

  const [showJobModal, setShowJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDeptId, setNewJobDeptId] = useState(
    departmentEntities[0]?.id || "",
  );

  const isAuthorizedForFinancials = canViewPayroll(effectiveUser);

  const openAddEmployeeModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("sales_agent");
    setSpecialty("sales");
    setSupervisedBranchIds([]);
    setCompanyId(companies[0]?.id || "");
    setGovernorateId(governorates[0]?.id || "");
    setBranchId(branches[0]?.id || "");
    setTeamId("");
    setDepartmentId("");
    setJobPositionId("");
    setDirectManagerId("");
    setBaseSalary(5000);
    setCommissionRate(3);
    setBonus(0);
    setDeductions(0);
    setEffectiveDate(new Date().toISOString().split("T")[0]);
    setSalaryNotes("اعتماد مالي مبدئي عند إنشاء الحساب");
    setShowAddModal(true);
  };

  const openEditEmployeeModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone);
    setRole(u.role);
    setSpecialty(u.specialty || "sales");
    setSupervisedBranchIds(u.supervisedBranchIds || []);
    setCompanyId(u.companyId || companies[0]?.id || "");
    setGovernorateId(u.governorateId || governorates[0]?.id || "");
    setBranchId(u.branchId || branches[0]?.id || "");
    setTeamId(u.teamId || "");
    setDepartmentId(u.departmentId || "");
    setJobPositionId(u.jobPositionId || "");
    setDirectManagerId(u.directManagerId || "");

    if (u.salaryInfo) {
      setBaseSalary(u.salaryInfo.baseSalary || 0);
      setCommissionRate(u.salaryInfo.commissionRate || 0);
      setBonus(u.salaryInfo.bonus || 0);
      setDeductions(u.salaryInfo.deductions || 0);
      setEffectiveDate(
        u.salaryInfo.effectiveDate || new Date().toISOString().split("T")[0],
      );
      setSalaryNotes("تعديل البيانات الحالية");
    } else {
      setBaseSalary(0);
      setCommissionRate(0);
      setBonus(0);
      setDeductions(0);
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      setSalaryNotes("");
    }

    setShowAddModal(true);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const companyObj = companies.find((c) => c.id === companyId);
    const govObj = governorates.find((g) => g.id === governorateId);
    const branchObj = branches.find((b) => b.id === branchId);
    const teamObj = teams.find((t) => t.id === teamId);
    const deptObj = departmentEntities.find((d) => d.id === departmentId);
    const posObj = jobPositions.find((p) => p.id === jobPositionId);
    const managerObj = users.find((u) => u.id === directManagerId);

    if (editingUser) {
      updateUser(editingUser.id, {
        name,
        email,
        phone,
        role,
        ...(isDirector(effectiveUser)
          ? {
              specialty: role === "supervisor" ? specialty : undefined,
              supervisedBranchIds: ["supervisor", "regional_manager"].includes(
                role,
              )
                ? supervisedBranchIds
                : undefined,
            }
          : {}),
        companyId,
        companyName: companyObj?.name,
        governorateId,
        governorateName: govObj?.name,
        branchId,
        branchName: branchObj?.name,
        teamId,
        teamName: teamObj?.name,
        departmentId,
        departmentName: deptObj?.name,
        jobPositionId,
        jobPositionTitle: posObj?.title,
        directManagerId,
        directManagerName: managerObj?.name,
      });

      if (isAuthorizedForFinancials && baseSalary >= 0) {
        updateUserSalaryInfo(editingUser.id, {
          baseSalary,
          commissionRate,
          bonus,
          deductions,
          effectiveDate,
          notes: salaryNotes,
        });
      }
    } else {
      const newUser = addUser({
        name,
        email,
        phone,
        role,
        ...(isDirector(effectiveUser)
          ? {
              specialty: role === "supervisor" ? specialty : undefined,
              supervisedBranchIds: ["supervisor", "regional_manager"].includes(
                role,
              )
                ? supervisedBranchIds
                : undefined,
            }
          : {}),
        companyId,
        companyName: companyObj?.name,
        governorateId,
        governorateName: govObj?.name,
        branchId,
        branchName: branchObj?.name,
        teamId,
        teamName: teamObj?.name,
        departmentId,
        departmentName: deptObj?.name,
        jobPositionId,
        jobPositionTitle: posObj?.title,
        directManagerId,
        directManagerName: managerObj?.name,
        active: true,
      });

      if (isAuthorizedForFinancials && newUser && baseSalary >= 0) {
        updateUserSalaryInfo(newUser.id, {
          baseSalary,
          commissionRate,
          bonus,
          deductions,
          effectiveDate,
          notes: salaryNotes,
        });
      }
    }

    setShowAddModal(false);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    addDepartmentEntity({
      name: newDeptName,
      code: newDeptCode || `DEPT-${Date.now().toString().slice(-4)}`,
      description: newDeptDesc,
      active: true,
    });
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptDesc("");
    setShowDeptModal(false);
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDeptId) return;
    const deptObj = departmentEntities.find((d) => d.id === newJobDeptId);
    addJobPosition({
      title: newJobTitle,
      departmentId: newJobDeptId,
      departmentName: deptObj?.name,
      active: true,
    });
    setNewJobTitle("");
    setShowJobModal(false);
  };

  const filteredUsers = users.filter((u) => {
    // RBAC scoping
    if (
      effectiveUser.role === "branch_manager" &&
      u.branchId !== effectiveUser.branchId
    ) {
      return false;
    }

    if (selectedBranchFilter && u.branchId !== selectedBranchFilter)
      return false;
    if (selectedRoleFilter && u.role !== selectedRoleFilter) return false;
    if (selectedDeptFilter && u.departmentId !== selectedDeptFilter)
      return false;
    if (statusFilter === "active" && !u.active) return false;
    if (statusFilter === "inactive" && u.active) return false;

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    return matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <UserCheck2 className="w-6 h-6 text-[#dc424b]" />
            <span>إدارة أطقم العمل والهيكل المؤسسي (EL.BEHERY)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة الموظفين، الأدوار القيادية، الأقسام والوظائف، المسميات،
            والمسيرات المالية والعمولات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageStaff(effectiveUser) && (
            <button
              onClick={openAddEmployeeModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#292928] dark:hover:bg-[#343431] rounded-xl text-xs font-bold transition-all border border-slate-600/30 dark:border-white/15 shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#dc424b]" />
              <span>إضافة موظف جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "employees"
              ? "bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <UserCheck2 className="w-4 h-4 text-[#dc424b]" />
          <span>سجل الموظفين والأطقم ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "departments"
              ? "bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#dc424b]" />
          <span>هيكل الأقسام والوظائف ({departmentEntities.length})</span>
        </button>

        {isAuthorizedForFinancials && (
          <button
            onClick={() => setActiveTab("financials")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "financials"
                ? "bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <DollarSign className="w-4 h-4 text-[#dc424b]" />
            <span>المسيرات المالية والعمولات</span>
          </button>
        )}
      </div>

      {/* TAB 1: EMPLOYEES LIST */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-2xl shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 dir-ltr:pr-3 dir-ltr:pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              >
                <option value="">جميع الفروع ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              >
                <option value="">جميع الأدوار الوظيفية</option>
                {positionRoles.map((r) => (
                  <option key={r} value={r}>
                    {positionNames[r]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              >
                <option value="">جميع الأقسام</option>
                {departmentEntities.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">مفعل فقط</option>
                <option value="inactive">معطل فقط</option>
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right dir-ltr:text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">اسم الموظف</th>
                    <th className="p-3.5">الدور الوظيفي</th>
                    <th className="p-3.5">القسم والوظيفة</th>
                    <th className="p-3.5">الفرع</th>
                    <th className="p-3.5">المسؤول المباشر</th>
                    <th className="p-3.5">بيانات التواصل</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                            {u.name.slice(0, 2)}
                          </div>
                        )}
                        <span>{u.name}</span>
                      </td>

                      <td className="p-3.5 font-semibold text-indigo-700 dark:text-indigo-400">
                        {positionNames[u.role]}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {u.departmentName || "—"}
                        {u.jobPositionTitle && (
                          <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                            {u.jobPositionTitle}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {u.branchName || "عام على المستوى الرئيسي"}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {u.directManagerName || "—"}
                      </td>

                      <td className="p-3.5">
                        <span className="block font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {u.email}
                        </span>
                        <span className="block font-mono-numbers text-slate-500 text-[11px]">
                          {u.phone}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          {u.active ? "مفعل" : "معطل"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canEditStaff(effectiveUser, u, branches) && (
                            <button
                              onClick={() => openEditEmployeeModal(u)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              title="تعديل الموظف والمسير المالي"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEditStaff(effectiveUser, u, branches) && (
                            <button
                              onClick={() => toggleUserActive(u.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                u.active
                                  ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 hover:bg-red-100"
                                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                              }`}
                            >
                              {u.active ? "تعطيل" : "تفعيل"}
                            </button>
                          )}

                          {isAuthorizedForFinancials && u.salaryInfo && (
                            <button
                              onClick={() => setViewingSalaryHistoryUser(u)}
                              className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg cursor-pointer"
                              title="سجل التغيرات المالية والعمولات"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS & JOB POSITIONS */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>أقسام المؤسسة الإدارية والتنفيذية</span>
              </h3>
              {canManageOrganization(effectiveUser) && (
                <button
                  onClick={() => setShowDeptModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة قسم</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {departmentEntities.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {d.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                        {d.code}
                      </span>
                    </div>
                    {d.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {d.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Positions Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>المسميات والوظائف المتاحة</span>
              </h3>
              {canManageOrganization(effectiveUser) && (
                <button
                  onClick={() => setShowJobModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة مسمى وظيفي</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {jobPositions
                .filter((j) => j.active && j.departmentId === departmentId)
                .map((j) => (
                  <div
                    key={j.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {j.title}
                      </span>
                      <span className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                        القسم: {j.departmentName || "عام"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIAL OVERVIEW */}
      {activeTab === "financials" && isAuthorizedForFinancials && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>المسيرات المالية والمرتبات ونسب العمولات للموظفين</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سجل المخصصات المالية المعتمدة للرواتب الأساسية، المكافآت
                والحوافز، ونسب العمولات المباشرة
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right dir-ltr:text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">الدور والفرع</th>
                  <th className="p-3.5">الراتب الأساسي (ج.م)</th>
                  <th className="p-3.5">نسبة العمولات %</th>
                  <th className="p-3.5">الحوافز والمكافآت (ج.م)</th>
                  <th className="p-3.5">الخصومات (ج.م)</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const sal = u.salaryInfo;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {u.name}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {positionNames[u.role]} —{" "}
                        <span className="font-semibold">
                          {u.branchName || "عام"}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                        {sal?.baseSalary
                          ? `${sal.baseSalary.toLocaleString()} ج.م`
                          : "غير محدد"}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {sal?.commissionRate ? `${sal.commissionRate}%` : "0%"}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {sal?.bonus
                          ? `${sal.bonus.toLocaleString()} ج.م`
                          : "0 ج.م"}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-red-600 dark:text-red-400">
                        {sal?.deductions
                          ? `${sal.deductions.toLocaleString()} ج.م`
                          : "0 ج.م"}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                        {sal?.effectiveDate || "—"}
                      </td>
                      <td className="p-3.5 text-center">
                        {canEditStaff(effectiveUser, u, branches) && (
                          <button
                            onClick={() => openEditEmployeeModal(u)}
                            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            تعديل المسير المالي
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto my-8">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
              <span>
                {editingUser
                  ? `تعديل بيانات الموظف: ${editingUser.name}`
                  : "إنشاء حساب موظف جديد"}
              </span>
              <span className="text-xs font-normal text-slate-400">
                مؤسسة EL.BEHERY
              </span>
            </h3>

            <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                  1. البيانات الشخصية وحساب الدخول
                </h4>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    اسم الموظف الثلاثي/الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      رقم الهاتف التواصل *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers"
                    />
                  </div>
                </div>
              </div>

              {isDirector(effectiveUser) &&
                ["supervisor", "regional_manager"].includes(role) && (
                  <section className="panel" style={{ padding: 16 }}>
                    {role === "supervisor" && (
                      <label className="field">
                        <span>اختصاص المشرف</span>
                        <select
                          aria-label="اختصاص المشرف"
                          value={specialty}
                          onChange={(e) =>
                            setSpecialty(e.target.value as Specialty)
                          }
                        >
                          {Object.entries(specialties).map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p>
                      الفروع المشمولـة بالإشراف{" "}
                      {role === "regional_manager"
                        ? "(تركها فارغة يعني كل الفروع)"
                        : "(اختر الفروع؛ عند تركها فارغة يكون النطاق هو الفرع المسجل فقط)"}
                    </p>
                    {branches.map((b) => (
                      <label className="checkbox-line" key={b.id}>
                        <input
                          type="checkbox"
                          checked={supervisedBranchIds.includes(b.id)}
                          onChange={(e) =>
                            setSupervisedBranchIds((prev) =>
                              e.target.checked
                                ? [...prev, b.id]
                                : prev.filter((id) => id !== b.id),
                            )
                          }
                        />
                        {b.name}
                      </label>
                    ))}
                  </section>
                )}
              {/* Role & Org Position */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                  2. المسمى الوظيفي والتبعية الإدارية
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      الدور الوظيفي والصلاحيات *
                    </label>
                    <select
                      aria-label="المنصب"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                    >
                      {assignableRoles(effectiveUser).map((r) => (
                        <option key={r} value={r}>
                          {positionNames[r]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      المحافطة / الإقليم *
                    </label>
                    <select
                      value={governorateId}
                      onChange={(e) => setGovernorateId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      الفرع المباشر *
                    </label>
                    <select
                      value={branchId}
                      onChange={(e) => {
                        setBranchId(e.target.value);
                        setTeamId("");
                        setDirectManagerId("");
                        const branch = branches.find(
                          (b) => b.id === e.target.value,
                        );
                        setGovernorateId(branch?.governorateId || "");
                        setCompanyId(branch?.companyId || "");
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      القسم الداخلي
                    </label>
                    <select
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        setJobPositionId("");
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      <option value="">اختر القسم</option>
                      {departmentEntities.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      المسمى الوظيفي المحدد
                    </label>
                    <select
                      value={jobPositionId}
                      onChange={(e) => setJobPositionId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      <option value="">اختر الوظيفة</option>
                      {jobPositions
                        .filter(
                          (j) => j.active && j.departmentId === departmentId,
                        )
                        .map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.departmentName || "عام"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      المسؤول الإداري المباشر
                    </label>
                    <select
                      value={directManagerId}
                      onChange={(e) => setDirectManagerId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      <option value="">بدون مدير مباشر أعلى</option>
                      {users
                        .filter(
                          (u) =>
                            u.active &&
                            u.id !== editingUser?.id &&
                            !["sales_agent", "team_leader"].includes(u.role) &&
                            (!u.branchId || u.branchId === branchId),
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({positionNames[u.role]})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              {isAuthorizedForFinancials && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      3. البيانات المالية والرواتب والعمولات (صلاحية خاصة)
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        الراتب الأساسي (ج.م)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={baseSalary}
                        onChange={(e) => setBaseSalary(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        نسبة العمولات %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) =>
                          setCommissionRate(Number(e.target.value))
                        }
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        الحوافز والمكافآت (ج.م)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bonus}
                        onChange={(e) => setBonus(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        الخصومات المعتمدة (ج.م)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={deductions}
                        onChange={(e) => setDeductions(Number(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        تاريخ بداية السريان
                      </label>
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      ملاحظات التعديل المالي
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: زيادة استثنائية أو تعديل عمولات البيع..."
                      value={salaryNotes}
                      onChange={(e) => setSalaryNotes(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {editingUser ? "حفظ التعديلات" : "إنشاء حساب الموظف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SALARY HISTORY */}
      {viewingSalaryHistoryUser && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>
                سجل التغييرات المالية: {viewingSalaryHistoryUser.name}
              </span>
            </h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {viewingSalaryHistoryUser.salaryInfo?.history &&
              viewingSalaryHistoryUser.salaryInfo.history.length > 0 ? (
                viewingSalaryHistoryUser.salaryInfo.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>الراتب: {h.baseSalary.toLocaleString()} ج.م</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        العمولة: {h.commissionRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>بواسطة: {h.updatedByName}</span>
                      <span>
                        التاريخ:{" "}
                        {new Date(h.updatedAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    {h.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">
                  لا توجد سجلات تاريخية سابقة للمسير المالي.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingSalaryHistoryUser(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              إضافة قسم إداري / تنفيذي جديد
            </h3>
            <form onSubmit={handleAddDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  اسم القسم *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قسم التشطيبات والدهانات"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  كود القسم
                </label>
                <input
                  type="text"
                  placeholder="مثال: DECOR"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  الوصف والمهام
                </label>
                <textarea
                  rows={2}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD JOB POSITION */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              إضافة مسمى وظيفي جديد
            </h3>
            <form onSubmit={handleAddJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  المسمى الوظيفي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مهندس استشاري مواقع"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  القسم التابع له *
                </label>
                <select
                  value={newJobDeptId}
                  onChange={(e) => setNewJobDeptId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                >
                  {departmentEntities.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  إضافة الوظيفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

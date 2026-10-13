import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Branch, Company, Governorate, Warehouse, BranchType } from '../types/crm';
import { BranchDetailsModal } from '../components/common/BranchDetailsModal';
import { HierarchyControlModal, EntityType } from '../components/common/HierarchyControlModal';
import {
  Building2,
  Building,
  Warehouse as WarehouseIcon,
  Globe,
  MapPin,
  Plus,
  Eye,
  ChevronLeft,
  Users,
  TrendingUp,
  Layers,
  Briefcase,
} from 'lucide-react';

interface BranchesTeamsPageProps {
  onOpenLead?: (leadId: string) => void;
  onAddClientForBranch?: (branchId: string) => void;
}

export const BranchesTeamsPage: React.FC<BranchesTeamsPageProps> = ({
  onOpenLead,
  onAddClientForBranch,
}) => {
  const { branches, companies, governorates, warehouses, addBranch, addCompany, addGovernorate, addWarehouse } = useCRM();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'governorates' | 'companies' | 'main_hq' | 'showrooms' | 'warehouses'>('governorates');

  // Hierarchy drill-down state
  const [hierarchyType, setHierarchyType] = useState<EntityType | null>(null);
  const [hierarchyData, setHierarchyData] = useState<Governorate | Company | Branch | Warehouse | null>(null);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);

  // Single Branch detail modal
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // Add Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'branch' | 'company' | 'governorate' | 'warehouse'>('branch');

  // Form States
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCity, setFormCity] = useState('القاهرة');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBranchType, setFormBranchType] = useState<BranchType>('showroom');

  const mainHqBranches = branches.filter((b) => b.branchType === 'main_hq');
  const showroomBranches = branches.filter((b) => b.branchType !== 'main_hq' && b.branchType !== 'warehouse');

  const handleOpenHierarchy = (type: EntityType, data: Governorate | Company | Branch | Warehouse) => {
    setHierarchyType(type);
    setHierarchyData(data);
    setIsHierarchyModalOpen(true);
  };

  const handleOpenBranchModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsBranchModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (addType === 'branch') {
      addBranch({
        name: formName,
        code: formCode,
        city: formCity,
        phone: formPhone,
        address: formAddress,
        branchType: formBranchType,
        active: true,
      });
    } else if (addType === 'company') {
      addCompany({
        name: formName,
        code: formCode,
        description: formAddress,
        phone: formPhone,
        active: true,
      });
    } else if (addType === 'governorate') {
      addGovernorate({
        name: formName,
        code: formCode,
        region: formAddress || formCity,
        phone: formPhone,
        active: true,
      });
    } else if (addType === 'warehouse') {
      addWarehouse({
        name: formName,
        code: formCode,
        governorateId: governorates[0]?.id || 'gov-cairo',
        phone: formPhone,
        address: formAddress,
        capacity: '10,000 طن',
        active: true,
      });
    }

    setFormName('');
    setFormCode('');
    setFormPhone('');
    setFormAddress('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-[#0c1017] dark:bg-[#0c0f17] text-[#e2e8f0] p-5 sm:p-6 rounded-2xl shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/10">
              الهيكل الإداري والميداني متعدد المستويات
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#abcae9]" />
            <span>إدارة الفروع والمقرّات والشركات والمخازن</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            التحكم الشجري الكامل بالشركات، المحافظات الجغرافية، الفروع الرئيسية، المعارض الفرعية، والمخازن اللوجستية المركزية.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setAddType('branch');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] rounded-xl text-xs font-bold transition-all border border-slate-600/30 dark:border-white/15 cursor-pointer flex items-center gap-1.5 min-h-[44px] shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#abcae9]" />
            <span>+ إضافة فرع / مقر جديد</span>
          </button>
        </div>
      </div>

      {/* Top Level Category Filter Selector */}
      <div className="flex glass-card p-2 rounded-2xl shadow-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('governorates')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'governorates'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4 text-[#abcae9]" />
          <span>المحافظات والإقاليم ({governorates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'companies'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#abcae9]" />
          <span>الشركات والمؤسسات ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('main_hq')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'main_hq'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4 text-[#abcae9]" />
          <span>الفروع الرئيسية ({mainHqBranches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('showrooms')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'showrooms'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#abcae9]" />
          <span>الفروع والمعارض ({showroomBranches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            activeTab === 'warehouses'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <WarehouseIcon className="w-4 h-4" />
          <span>المخازن والمستودعات ({warehouses.length})</span>
        </button>
      </div>

      {/* CATEGORY 1: GOVERNORATES */}
      {activeTab === 'governorates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7295b3]" />
              <span>دليل المحافظات والإقاليم الجغرافية (عند النقر يفتح تحكم المحافظة بالكامل):</span>
            </h3>

            <button
              onClick={() => {
                setAddType('governorate');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              + إضافة محافظة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {governorates.map((gov) => {
              const govBranches = branches.filter((b) => b.governorateId === gov.id || b.city.includes(gov.name.replace('محافظة ', '')));
              const govWarehouses = warehouses.filter((w) => w.governorateId === gov.id);

              return (
                <button
                  key={gov.id}
                  onClick={() => handleOpenHierarchy('governorate', gov)}
                  className="bg-white dark:bg-[#0c1017] hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl p-5 border border-slate-200 dark:border-white/10 hover:border-[#7295b3] shadow-xs hover:shadow-md transition-all text-right dir-ltr:text-left cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-[#7295b3] transition-colors flex items-center gap-1.5">
                        <span>🗺️ {gov.name}</span>
                        <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180" />
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#181d2a] text-slate-800 dark:text-[#d9b438] border border-slate-200 dark:border-white/10 font-mono text-[10px] font-bold">
                        {gov.code}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-3">
                      <div>الإقليم: <strong>{gov.region}</strong></div>
                      <div>المسؤول: <strong>{gov.managerName || 'غير معين'}</strong></div>
                      <div>عدد الفروع بالقطاع: <strong className="text-slate-800 dark:text-[#7295b3] font-mono-numbers">{govBranches.length} فرع</strong></div>
                      <div>المستودعات اللوجستية: <strong className="text-emerald-600 dark:text-emerald-400 font-mono-numbers">{govWarehouses.length} مستودع</strong></div>
                    </div>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-[#7295b3] font-bold">
                    <span>تحكم المحافظة والمخازن والفروع ←</span>
                    <Eye className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 2: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>دليل الشركات والمؤسسات التابعة للقطاع:</span>
            </h3>

            <button
              onClick={() => {
                setAddType('company');
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
            >
              + إضافة شركة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map((cmp) => {
              const cmpBranches = branches.filter((b) => b.companyId === cmp.id);

              return (
                <button
                  key={cmp.id}
                  onClick={() => handleOpenHierarchy('company', cmp)}
                  className="bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-right dir-ltr:text-left cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                        <span>🏛️ {cmp.name}</span>
                        <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180" />
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                        {cmp.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{cmp.description}</p>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-3">
                      <div>الرئيس التنفيذي: <strong>{cmp.ceoName}</strong></div>
                      <div>الهاتف: <span className="font-mono-numbers">{cmp.phone}</span></div>
                      <div>الفروع المخصصة: <strong className="text-indigo-600 font-mono-numbers">{cmpBranches.length} فرع</strong></div>
                    </div>
                  </div>

                  <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>تحكم الشركة الميداني ←</span>
                    <Eye className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY 3: MAIN HQS & SHOWROOMS */}
      {(activeTab === 'main_hq' || activeTab === 'showrooms') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {activeTab === 'main_hq' ? `الفروع الرئيسية للمقرّات (${mainHqBranches.length})` : `الفروع والمعارض الفرعية (${showroomBranches.length})`}
              </span>
            </h3>

            <button
              onClick={() => {
                setAddType('branch');
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
            >
              + إضافة فرع
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(activeTab === 'main_hq' ? mainHqBranches : showroomBranches).map((b) => (
              <button
                key={b.id}
                onClick={() => handleOpenBranchModal(b)}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-right dir-ltr:text-left cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>{b.name}</span>
                      <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180" />
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {b.code}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mt-3">
                    <div>المدينة: <strong>{b.city}</strong></div>
                    <div>الشركة: <strong>{b.companyName || 'مؤسسة البحيري العامة'}</strong></div>
                    <div>المدير المسؤول: <strong className="text-indigo-800 dark:text-indigo-300">{b.managerName || 'غير محدد'}</strong></div>
                    <div>الهاتف: <span className="font-mono-numbers">{b.phone}</span></div>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>فتح ملف الفرع والمبيعات ←</span>
                  <Eye className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY 4: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>المخازن والمستودعات اللوجستية المركزية ({warehouses.length}):</span>
            </h3>

            <button
              onClick={() => {
                setAddType('warehouse');
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 cursor-pointer"
            >
              + إضافة مخزن
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => (
              <button
                key={wh.id}
                onClick={() => handleOpenHierarchy('warehouse', wh)}
                className="bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-right dir-ltr:text-left cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      <span>🏭 {wh.name}</span>
                      <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180" />
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold">
                      {wh.code}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-3">
                    <div>المحافظة التابع لها: <strong>{wh.governorateName}</strong></div>
                    <div>أمين المخزن: <strong>{wh.managerName || 'غير عين'}</strong></div>
                    <div>السعة الاستيعابية: <strong className="text-indigo-600 font-mono-numbers">{wh.capacity}</strong></div>
                    <div>العنوان: {wh.address}</div>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>تحكم المخزن والمستودع ←</span>
                  <Eye className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              إضافة عنصر للهيكل التنظيمي ({addType === 'branch' ? 'فرع' : addType === 'company' ? 'شركة' : addType === 'governorate' ? 'محافظة' : 'مخزن'})
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الاسم *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="أدخل الاسم التفصيلي..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الكود الإداري *</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="CODE-01"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">المدينة / النطاق *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="01000000000"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">العنوان / الوصف *</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="التفاصيل..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xs"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drill-down Hierarchy Control Modal */}
      <HierarchyControlModal
        entityType={hierarchyType}
        entityData={hierarchyData}
        isOpen={isHierarchyModalOpen}
        onClose={() => setIsHierarchyModalOpen(false)}
        onOpenBranchDetails={handleOpenBranchModal}
        onOpenLead={onOpenLead}
      />

      {/* Single Branch Details Modal */}
      <BranchDetailsModal
        branch={selectedBranch}
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onOpenLead={onOpenLead}
        onAddClientForBranch={onAddClientForBranch}
      />
    </div>
  );
};

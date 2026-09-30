"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Minus,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { formatTZS } from "@/lib/tz";
import {
  quickAddStockAction,
  quickRemoveStockAction,
  quickUpdateStockQtyAction,
  addSellerAction,
  toggleSellerVerificationAction,
  removeSellerAction,
  updateSellerContactSettingsAction,
  type ActionResponse,
} from "@/app/actions/selling-panel";

export type StockItem = {
  id: string;
  slug: string;
  nameEn: string;
  nameSw: string;
  sku: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; nameEn: string; nameSw: string };
  images: { url: string; alt: string | null }[];
};

export type SellerUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  studentNumber: string | null;
  studentVerifiedAt: Date | null;
  isActive: boolean;
  payoutMethod: string | null;
  payoutNumber: string | null;
  university?: { nameEn: string; slug: string } | null;
  _count: { listings: number; orders: number };
};

export type VisitorAnalytics = {
  totalVisits: number;
  uniqueVisitors: number;
  directInquiries: number;
  weeklyHistory: { day: string; visits: number; inquiries: number }[];
  recentVisits: { path: string; time: Date; campus: string }[];
  topListings: {
    id: string;
    titleEn: string;
    slug: string;
    price: number;
    viewCount: number;
    university?: { nameEn: string } | null;
    seller?: { name: string } | null;
  }[];
};

export type CategoryOption = {
  id: string;
  slug: string;
  nameEn: string;
};

export type UniversityOption = {
  id: string;
  slug: string;
  nameEn: string;
};

// Preset Stock Pictures for campus merchandise & essentials
const PRESET_STOCK_PICTURES = [
  { url: "/img/p/fast-charger-33w.svg", label: "Scientific Calculator / Tech" },
  { url: "/img/p/bluetooth-speaker-portable.svg", label: "Textbook / Academic" },
  { url: "/img/p/rechargeable-led-torch.svg", label: "Rechargeable Study Lamp" },
  { url: "/img/p/smart-tv-55-inch.svg", label: "Student Laptop / Monitor" },
  { url: "/img/p/power-bank-20000mah.svg", label: "Power Bank / Battery" },
  { url: "/img/p/solar-home-kit-30w.svg", label: "Engineering Set / Tools" },
  { url: "/img/p/thermos-flask-1900ml.svg", label: "Hostel Kettle / Cookware" },
  { url: "/img/p/wireless-earbuds.svg", label: "Wireless Earbuds" },
];

export function AdminSellingPanel({
  initialProducts,
  initialSellers,
  analytics,
  categories,
  universities,
  shopSettings,
  locale,
}: {
  initialProducts: StockItem[];
  initialSellers: SellerUser[];
  analytics: VisitorAnalytics;
  categories: CategoryOption[];
  universities: UniversityOption[];
  shopSettings: { phone: string; whatsapp: string; email: string };
  locale: string;
}) {
  const [activeTab, setActiveTab] = useState<"stock" | "analytics" | "contact" | "sellers">("stock");
  const [products, setProducts] = useState<StockItem[]>(initialProducts);
  const [sellers, setSellers] = useState<SellerUser[]>(initialSellers);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddSellerModal, setShowAddSellerModal] = useState(false);
  const [selectedPicture, setSelectedPicture] = useState(PRESET_STOCK_PICTURES[0].url);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filtered stock
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = !categoryFilter || p.category.id === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 4).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  // Quick Stock Removal
  const handleRemoveStock = (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from stock?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("productId", productId);
      const res: ActionResponse = await quickRemoveStockAction(fd);
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setFeedback({ type: "success", text: res.message || "Item removed from stock." });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to remove item." });
      }
    });
  };

  // Quick Stock Adjustment (+ / -)
  const handleAdjustStock = (productId: string, delta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newQty = Math.max(0, target.stock + delta);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newQty, isActive: newQty > 0 } : p)),
    );

    startTransition(async () => {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("stock", String(newQty));
      await quickUpdateStockQtyAction(fd);
    });
  };

  // Quick Add Stock Form Submit
  const handleAddStockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    fd.set("imageUrl", selectedPicture);

    startTransition(async () => {
      const res = await quickAddStockAction(fd);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message || "Item added to stock!" });
        setShowAddStockModal(false);
        // Refresh local state with optimistic product
        const nameEn = String(fd.get("nameEn"));
        const price = Number(fd.get("price"));
        const stock = Number(fd.get("stock"));
        const catId = String(fd.get("categoryId"));
        const catObj = categories.find((c) => c.id === catId);
        setProducts((prev) => [
          {
            id: `new-${Date.now()}`,
            slug: nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            nameEn,
            nameSw: String(fd.get("nameSw")) || nameEn,
            sku: "STK-NEW",
            price,
            stock,
            isActive: true,
            isFeatured: fd.get("isFeatured") === "on",
            category: { id: catId, nameEn: catObj?.nameEn || "General", nameSw: catObj?.nameEn || "General" },
            images: [{ url: selectedPicture, alt: nameEn }],
          },
          ...prev,
        ]);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to add stock item." });
      }
    });
  };

  // Add Seller Submit
  const handleAddSellerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await addSellerAction(fd);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message || "New seller verified!" });
        setShowAddSellerModal(false);
        const name = String(fd.get("name"));
        const phone = String(fd.get("phone"));
        const email = String(fd.get("email"));
        const uniId = String(fd.get("universityId"));
        const uniObj = universities.find((u) => u.id === uniId);
        setSellers((prev) => [
          {
            id: `sel-${Date.now()}`,
            name,
            phone,
            email,
            studentNumber: String(fd.get("studentNumber")),
            studentVerifiedAt: new Date(),
            isActive: true,
            payoutMethod: "MPESA",
            payoutNumber: phone,
            university: uniObj ? { nameEn: uniObj.nameEn, slug: uniObj.slug } : null,
            _count: { listings: 0, orders: 0 },
          },
          ...prev,
        ]);
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to add seller." });
      }
    });
  };

  // Toggle Seller Verification
  const handleToggleVerification = (sellerId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("sellerId", sellerId);
      const res = await toggleSellerVerificationAction(fd);
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId
              ? { ...s, studentVerifiedAt: s.studentVerifiedAt ? null : new Date() }
              : s,
          ),
        );
        setFeedback({ type: "success", text: res.message || "Verification updated." });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to update seller." });
      }
    });
  };

  // Remove Seller
  const handleRemoveSeller = (sellerId: string, name: string) => {
    if (!window.confirm(`Deactivate seller "${name}" and pause their campus listings?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("sellerId", sellerId);
      const res = await removeSellerAction(fd);
      if (res.ok) {
        setSellers((prev) => prev.filter((s) => s.id !== sellerId));
        setFeedback({ type: "success", text: res.message || "Seller removed." });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to remove seller." });
      }
    });
  };

  // Update Direct Contact
  const handleContactUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSellerContactSettingsAction(fd);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message || "Seller contact updated!" });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to update contact." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Store size={18} aria-hidden />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Admin Selling Hub & Home Stock
            </h1>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Direct Seller Management
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Manage your personal inventory stock, monitor page visitor statistics, configure direct seller contact, and authorize campus sellers.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddStockModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus size={14} aria-hidden />
            <span>Add Stock Item</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddSellerModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserPlus size={14} aria-hidden />
            <span>Add New Seller</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-700 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "stock"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Package size={14} />
          <span>My Home Stock ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "analytics"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <BarChart3 size={14} />
          <span>Visitor Statistics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "contact"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Phone size={14} />
          <span>Direct Seller Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sellers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "sellers"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <Users size={14} />
          <span>Manage Sellers ({sellers.length})</span>
        </button>
      </div>

      {/* TAB 1: HOME STOCK & INVENTORY MANAGER */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total In-Stock Items</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalStockCount} units</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Active Inventory</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Inventory Valuation</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatTZS(totalValue)}</p>
              <span className="text-[11px] text-slate-500 font-medium">Whole Tanzanian Shillings</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Low Stock Alert</span>
              <p className="mt-1 text-2xl font-bold text-amber-700">{lowStockCount} items</p>
              <span className="text-[11px] text-amber-700 font-medium">Stock ≤ 4 items</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Catalog SKUs</span>
              <p className="mt-1 text-2xl font-bold text-slate-900">{products.length} products</p>
              <span className="text-[11px] text-slate-500 font-medium">Direct Home Stock</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAddStockModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <Plus size={13} />
              <span>New Stock Item</span>
            </button>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3">Item / Photo</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Price</th>
                  <th scope="col" className="px-4 py-3 text-center">Stock Quantity</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No stock items match your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const img = p.images[0]?.url || "/img/p/casio-calculator.svg";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={img}
                              alt={p.nameEn}
                              className="h-10 w-10 rounded-lg border border-slate-200 object-cover shrink-0 bg-slate-50"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-xs">{p.nameEn}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.category.nameEn}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{formatTZS(p.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, -1)}
                              disabled={isPending || p.stock <= 0}
                              className="grid h-5 w-5 place-items-center rounded bg-white text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-30"
                              title="Decrease stock"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-8 text-center font-bold text-slate-900">{p.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, 1)}
                              disabled={isPending}
                              className="grid h-5 w-5 place-items-center rounded bg-white text-slate-700 hover:bg-slate-200 transition-colors"
                              title="Increase stock"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.stock <= 0 ? (
                            <span className="rounded bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-semibold">
                              Out of Stock
                            </span>
                          ) : p.stock <= 4 ? (
                            <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                              Low Stock ({p.stock})
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStock(p.id, p.nameEn)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Remove from inventory"
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VISITOR & PAGE TRAFFIC STATISTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key Traffic Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <TrendingUp size={16} className="text-slate-900" />
                <span>Total Site Pageviews</span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{analytics.totalVisits.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Across Homepage, Shop & Student Marketplace</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Users size={16} className="text-slate-900" />
                <span>Unique Student Visitors</span>
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900">{analytics.uniqueVisitors.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">Active university student sessions</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Phone size={16} className="text-slate-900" />
                <span>Direct Seller Inquiries</span>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-700">{analytics.directInquiries}</p>
              <p className="mt-1 text-xs text-slate-500">WhatsApp and direct phone taps</p>
            </div>
          </div>

          {/* Weekly Traffic Bar Chart */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Traffic Breakdown (Visits vs Inquiries)</h3>
                <p className="text-xs text-slate-500">Activity logged over the past 7 days across campuses</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Last 7 Days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-44 pt-6">
              {analytics.weeklyHistory.map((item) => {
                const heightPercent = Math.min(100, Math.max(15, (item.visits / 300) * 100));
                return (
                  <div key={item.day} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-800">{item.visits}</span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[2.5rem] rounded-t-lg bg-slate-900 hover:bg-amber-500 transition-colors cursor-pointer relative group"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-20">
                        {item.inquiries} inquiries
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Viewed Campus Listings */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Most-Viewed Campus Items & Student Listings</h3>
            <div className="divide-y divide-slate-100">
              {analytics.topListings.map((l, idx) => (
                <div key={l.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-xs text-slate-900">{l.titleEn}</p>
                      <span className="text-[11px] text-slate-400">
                        {l.university?.nameEn || "Campus"} · Seller: {l.seller?.name || "Verified Student"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{l.viewCount} views</span>
                    <p className="text-[11px] text-slate-500">{formatTZS(l.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Live Visitors Log */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Live Campus Activity Stream</h3>
            <div className="space-y-2">
              {analytics.recentVisits.map((v, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono text-slate-800 truncate max-w-sm">{v.path}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="font-medium text-slate-700">{v.campus}</span>
                    <span>{new Date(v.time).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT SELLER CONTACT */}
      {activeTab === "contact" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Primary Seller Direct Contact Credentials</h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your personal contact credentials (Gene / Head Seller). Shoppers viewing your stock and listings can contact you directly via one-tap WhatsApp and Phone call.
              </p>
            </div>

            <form onSubmit={handleContactUpdate} className="space-y-4 pt-2">
              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Seller Display Name
                </label>
                <input
                  type="text"
                  defaultValue="Gene (Campus Rep & Head Seller)"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Direct WhatsApp Number (with country code +255)
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  defaultValue={shopSettings.whatsapp || "+255712000001"}
                  required
                  placeholder="+255712000001"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Direct Calling Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={shopSettings.phone || "+255712000001"}
                  required
                  placeholder="+255712000001"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Seller Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={shopSettings.email || "gene.atc.vibe.coding@gmail.com"}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Seller Contact"}
                </button>

                <a
                  href={`https://wa.me/${shopSettings.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    "Hello Gene, I am interested in items from your campus stock on Duka.",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Test Direct WhatsApp Link</span>
                </a>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ADD & MANAGE MORE SELLERS VIA ADMIN CAPABILITIES */}
      {activeTab === "sellers" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authorized Campus Sellers Directory</h3>
              <p className="text-xs text-slate-500">
                You can authorize and add more student sellers across campuses using your administrator capabilities.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSellerModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <UserPlus size={14} />
              <span>Add New Seller</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th scope="col" className="px-4 py-3">Seller Name</th>
                  <th scope="col" className="px-4 py-3">University / Campus</th>
                  <th scope="col" className="px-4 py-3">Phone / Contact</th>
                  <th scope="col" className="px-4 py-3">Student ID</th>
                  <th scope="col" className="px-4 py-3">Verification</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 font-bold text-slate-800 text-[11px]">
                          {s.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <span className="text-[10px] text-slate-400">{s.email || "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {s.university?.nameEn || "General Campus"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">{s.phone}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{s.studentNumber || "N/A"}</td>
                    <td className="px-4 py-3">
                      {s.studentVerifiedAt ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-medium">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleVerification(s.id)}
                          disabled={isPending}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          {s.studentVerifiedAt ? "Revoke" : "Verify"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSeller(s.id, s.name)}
                          disabled={isPending}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOCK ITEM */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Item to Home Stock</h3>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Item Title (English) *
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    required
                    placeholder="e.g. Casio Scientific Calculator FX-991"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Item Title (Swahili)
                  </label>
                  <input
                    type="text"
                    name="nameSw"
                    placeholder="e.g. Kikokotoo cha Sayansi Casio"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Price (TSh) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={100}
                    placeholder="40000"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min={1}
                    defaultValue={5}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Category *
                </label>
                <select
                  name="categoryId"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Picture Upload / Gallery Selector */}
              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Select Item Picture (Preset Gallery or Custom)
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {PRESET_STOCK_PICTURES.map((pic) => (
                    <button
                      key={pic.url}
                      type="button"
                      onClick={() => setSelectedPicture(pic.url)}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden bg-slate-50 transition-all p-1 text-left ${
                        selectedPicture === pic.url
                          ? "border-slate-900 ring-2 ring-slate-900/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img src={pic.url} alt={pic.label} className="h-full w-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Description
                </label>
                <textarea
                  name="descEn"
                  rows={2}
                  placeholder="Describe condition, specifications, and accessories included..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="isFeatured" id="isFeatured" className="h-4 w-4 rounded border-slate-300" />
                <label htmlFor="isFeatured" className="text-xs text-slate-700 font-medium">
                  Feature on Homepage SuperDeals / Top Showcase
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? "Adding..." : "Add to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW SELLER */}
      {showAddSellerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Authorize New Campus Seller</h3>
              <button
                type="button"
                onClick={() => setShowAddSellerModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSellerSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Seller Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Baraka Mwamba"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Phone Number (Tanzanian format) *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="0712 345 678"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  University / Campus *
                </label>
                <select
                  name="universityId"
                  required
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Select University...</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Student Institutional Email (.ac.tz)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. baraka@must.ac.tz"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="field-label text-xs font-semibold text-slate-800">
                  Student Registration Number
                </label>
                <input
                  type="text"
                  name="studentNumber"
                  placeholder="e.g. MUST-2023-0199"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSellerModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Authorize Seller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

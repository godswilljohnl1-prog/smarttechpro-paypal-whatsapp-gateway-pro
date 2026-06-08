import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  ShoppingCart, 
  LayoutDashboard, 
  Receipt, 
  Terminal, 
  Mail, 
  Folder, 
  FileCode, 
  ArrowRight, 
  Check, 
  Download, 
  Search, 
  Smartphone, 
  Send, 
  Users, 
  TrendingUp, 
  Coins, 
  Database,
  MailCheck,
  AlertOctagon,
  RefreshCw,
  Phone,
  User,
  ExternalLink,
  Laptop
} from "lucide-react";
import { PLUGIN_FILES, PluginFile } from "./pluginFiles";
import JSZip from "jszip";

// --- Demo Data ---
interface Order {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  products: string[];
  total: number;
  currency: string;
  status: "wc-awaiting-paypal" | "wc-paypal-review" | "wc-paypal-paid" | "wc-paypal-failed";
}

interface LogEntry {
  id: number;
  orderId: number | string;
  action: string;
  message: string;
  user: string;
  timestamp: string;
}

export default function App() {
  // --- Sandbox Gateway Config Options State ---
  const [enabled, setEnabled] = useState(true);
  const [gatewayTitle, setGatewayTitle] = useState("Pay via PayPal (WhatsApp Support)");
  const [gatewayDescription, setGatewayDescription] = useState("Request PayPal payment instructions through WhatsApp directly to complete your purchase manually with support.");
  const [supportName, setSupportName] = useState("Alice Support Desk");
  const [supportPhone, setSupportPhone] = useState("+2348012345678");
  const [paypalEmail, setPaypalEmail] = useState("sales@smarttechpro.com");
  const [thankYouMessage, setThankYouMessage] = useState("Thank you for your order! Please use the WhatsApp button below to request PayPal payment instructions if your browser did not redirect automatically.");
  
  const [customTemplate, setCustomTemplate] = useState(
    "Hello {support_name},\n\nI would like to pay via PayPal.\n\nOrder ID: #{order_id}\n\nCustomer: {customer_name}\nEmail: {customer_email}\nPhone: {customer_phone}\n\nProducts:\n{product_list}\n\nTotal: {currency} {order_total}\n\nPlease send PayPal payment instructions."
  );
  const [enableLogging, setEnableLogging] = useState(true);
  const [enableCustomerEmails, setEnableCustomerEmails] = useState(true);
  const [enableAdminEmails, setEnableAdminEmails] = useState(true);

  // --- Active Sandbox View Tabs ---
  // Left Tabs: settings | checkout | code explorer
  const [activeLeftTab, setActiveLeftTab] = useState<"settings" | "checkout" | "coder">("settings");
  // Middle Tabs: dashboard | orders | logs | mailer
  const [activeMiddleTab, setActiveMiddleTab] = useState<"overview" | "orders" | "logs" | "emails">("overview");

  // --- Physical Code Viewer States ---
  const [selectedFile, setSelectedFile] = useState<PluginFile>(PLUGIN_FILES[0]);

  // --- Simulated Smartphone Screen States ---
  const [phoneScreen, setPhoneScreen] = useState<"storefront" | "redirect" | "whatsapp" | "email">("storefront");
  const [isZipping, setIsZipping] = useState(false);
  const [wasZipDownloaded, setWasZipDownloaded] = useState(false);

  // --- Simulated Storefront Checkout Variables ---
  const [custFirstName, setCustFirstName] = useState("John");
  const [custLastName, setCustLastName] = useState("Doe");
  const [custEmail, setCustEmail] = useState("john@doe.com");
  const [custPhone, setCustPhone] = useState("+2348039871122");
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["Woo Canvas bag", "Premium Mug"]);

  // --- Active database tables state (Simulated WordPress backend) ---
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1024,
      customerName: "Jane Miller",
      email: "jane@millerco.org",
      phone: "+1555019808",
      date: "2026-06-08 14:12",
      products: ["Woo Canvas bag x2", "Premium Mug x1"],
      total: 120,
      currency: "USD",
      status: "wc-awaiting-paypal"
    },
    {
      id: 1023,
      customerName: "Robert Dow",
      email: "rob.d@techy.net",
      phone: "+447911123456",
      date: "2026-06-08 09:44",
      products: ["Developer Hoodie x1"],
      total: 65,
      currency: "GBP",
      status: "wc-paypal-review"
    },
    {
      id: 1022,
      customerName: "Fatima Al-Sudais",
      email: "fatima@sudais.com",
      phone: "+966505123456",
      date: "2026-06-07 18:22",
      products: ["Pro Theme Lifetime x1", "Woo Canvas bag x1"],
      total: 249,
      currency: "USD",
      status: "wc-paypal-paid"
    },
    {
      id: 1021,
      customerName: "Chen Wei",
      email: "chenwei@sina.cn",
      phone: "+8613912345678",
      date: "2026-06-06 11:05",
      products: ["Premium Mug x2"],
      total: 30,
      currency: "USD",
      status: "wc-paypal-failed"
    }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 7,
      orderId: 1024,
      action: "WhatsApp Redirect",
      message: "Customer Jane Miller launched manual WhatsApp checkout flow. Redirect URL generated.",
      user: "Customer",
      timestamp: "2026-06-08 14:14"
    },
    {
      id: 6,
      orderId: 1024,
      action: "Order Created",
      message: "Manual payment order #1024 generated under status Awaiting PayPal.",
      user: "Customer",
      timestamp: "2026-06-08 14:12"
    },
    {
      id: 5,
      orderId: 1023,
      action: "Review",
      message: "PayPal payment manual checking initiated by Admin team.",
      user: "admin",
      timestamp: "2026-06-08 10:15"
    },
    {
      id: 4,
      orderId: 1023,
      action: "WhatsApp Redirect",
      message: "Customer Robert Dow opened support WhatsApp link from orders dashboard.",
      user: "Customer",
      timestamp: "2026-06-08 09:46"
    },
    {
      id: 3,
      orderId: 1022,
      action: "Paid",
      message: "Manual payment cleared via PayPal interface, order status updated to Paid.",
      user: "admin",
      timestamp: "2026-06-07 20:00"
    },
    {
      id: 2,
      orderId: 1022,
      action: "Customer Email Sent",
      message: "Confirmation email 'Payment Confirmed' dispatched successfully.",
      user: "System",
      timestamp: "2026-06-07 20:00"
    },
    {
      id: 1,
      orderId: 0,
      action: "Gateway Installed",
      message: "SmartTechPro PayPal WhatsApp Gateway Pro activated, custom logger table wp_stpw_logs created successfully.",
      user: "admin",
      timestamp: "2026-06-05 08:32"
    }
  ]);

  // --- Simulated Search & Pagination State for logs ---
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("");

  // --- Dynamic WhatsApp Variables Compilation Handler ---
  const activeCompiledWhatsAppMessage = useMemo(() => {
    const productsString = selectedProducts.map(p => `- ${p} x1`).join("\n");
    let msg = customTemplate;
    msg = msg.replace(/{support_name}/g, supportName);
    msg = msg.replace(/{order_id}/g, "3025");
    msg = msg.replace(/{customer_name}/g, `${custFirstName} ${custLastName}`);
    msg = msg.replace(/{customer_email}/g, custEmail);
    msg = msg.replace(/{customer_phone}/g, custPhone);
    msg = msg.replace(/{product_list}/g, productsString);
    msg = msg.replace(/{currency}/g, "USD");
    msg = msg.replace(/{order_total}/g, "150");
    msg = msg.replace(/{paypal_email}/g, paypalEmail);
    msg = msg.replace(/{site_name}/g, "My eCommerce Store");
    return msg;
  }, [customTemplate, supportName, custFirstName, custLastName, custEmail, custPhone, selectedProducts, paypalEmail]);

  // --- Calculate Revenue Insights (Calculated ONLY on paid orders dynamically) ---
  const metrics = useMemo(() => {
    const awaitingCount = orders.filter(o => o.status === "wc-awaiting-paypal").length;
    const reviewCount = orders.filter(o => o.status === "wc-paypal-review").length;
    const paidCount = orders.filter(o => o.status === "wc-paypal-paid").length;
    const failedCount = orders.filter(o => o.status === "wc-paypal-failed").length;

    const paidOrders = orders.filter(o => o.status === "wc-paypal-paid");
    const totalRev = paidOrders.reduce((sum, current) => sum + current.total, 0);

    const totalAttempts = orders.length;
    const convRate = totalAttempts > 0 ? ((paidCount / totalAttempts) * 100).toFixed(1) : "0";

    return {
      awaiting: awaitingCount,
      review: reviewCount,
      paid: paidCount,
      failed: failedCount,
      revenue: totalRev,
      conversion: convRate
    };
  }, [orders]);

  // --- Action Hooks (Admin state transitions) ---
  const handleUpdateStatus = (orderId: number, newStatus: Order["status"], reason: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Convert status to readable title
    const tag = newStatus === "wc-paypal-review" ? "Review" : newStatus === "wc-paypal-paid" ? "Paid" : "Failed";
    const userRole = "admin";

    // Insert log entry
    const newLog: LogEntry = {
      id: logs.length + 1,
      orderId: orderId,
      action: tag,
      message: `${reason} - Order status changed to ${newStatus.replace("wc-", "")}.`,
      user: userRole,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    
    setLogs(prev => [newLog, ...prev]);

    // Send customer notification audit step
    if (enableCustomerEmails) {
      setTimeout(() => {
        const mailLog: LogEntry = {
          id: logs.length + 2,
          orderId: orderId,
          action: "Customer Email Sent",
          message: `Transactional custom email templates sent for state transition into ${tag}.`,
          user: "System",
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
        };
        setLogs(prev => [mailLog, ...prev]);
      }, 600);
    }
  };

  const handleSendReminder = (orderId: number, custName: string) => {
    // Insert log entry
    const newLog: LogEntry = {
      id: logs.length + 1,
      orderId: orderId,
      action: "Reminder Sent",
      message: `WhatsApp backup reminder message dispatched manually to customer ${custName}.`,
      user: "admin",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // --- Client Check-out Simulation Placed ---
  const handlePlaceSimulatedOrder = () => {
    if (!enabled) return;

    // Simulate order placement
    const newOrderId = Math.floor(Math.random() * 1000) + 3000;
    const totalAmount = selectedProducts.includes("Woo Canvas bag") && selectedProducts.includes("Premium Mug") ? 150 : selectedProducts.includes("Woo Canvas bag") ? 120 : 30;

    const newOrder: Order = {
      id: newOrderId,
      customerName: `${custFirstName} ${custLastName}`,
      email: custEmail,
      phone: custPhone,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      products: selectedProducts.map(p => `${p} x1`),
      total: totalAmount,
      currency: "USD",
      status: "wc-awaiting-paypal"
    };

    // Add to state
    setOrders(prev => [newOrder, ...prev]);

    // Add custom table entry logs
    const log1: LogEntry = {
      id: logs.length + 1,
      orderId: newOrderId,
      action: "Order Created",
      message: `Manual payment order #${newOrderId} generated under gateway stpw_paypal_whatsapp.`,
      user: "Customer",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    const log2: LogEntry = {
      id: logs.length + 2,
      orderId: newOrderId,
      action: "WhatsApp Redirect",
      message: `Customer launched manual WhatsApp checkout flow. Auto redirecting client to wa.me.`,
      user: "Customer",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    setLogs(prev => [log2, log1, ...prev]);

    // Flip phone inside sidebar and open automatic redirect!
    setPhoneScreen("redirect");
    setTimeout(() => {
      setPhoneScreen("whatsapp");
    }, 1800);
  };

  // --- Package entire PHP source code on-the-fly inside ZIP and downloads ---
  const triggerPackageDownload = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Loop files
      PLUGIN_FILES.forEach(file => {
        // We write with dynamic string replacements representation reflecting custom templates!
        let customizedContent = file.content;
        if (file.path === "includes/class-settings.php") {
          // Live replace text domains
          customizedContent = customizedContent.replace(/Alice Support Desk/g, supportName);
          customizedContent = customizedContent.replace(/sales@smarttechpro.com/g, paypalEmail);
        }
        zip.file(`smarttechpro-paypal-whatsapp-gateway-pro/${file.path}`, customizedContent);
      });

      // Generate blob
      const content = await zip.generateAsync({ type: "blob" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(content);
      element.download = "smarttechpro-paypal-whatsapp-gateway-pro.zip";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Flash success state
      setWasZipDownloaded(true);
      setTimeout(() => setWasZipDownloaded(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsZipping(false);
    }
  };

  // Filter logs list based on filters
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                            l.orderId.toString().includes(logSearch);
      const matchesAction = logActionFilter === "" ? true : l.action === logActionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, logSearch, logActionFilter]);

  // Export static datasets simulated as CSV triggers
  const exportSimulatedCSV = (type: "orders" | "logs") => {
    let csvContent = "";
    if (type === "orders") {
      csvContent = "Order ID,Customer Name,Phone Number,Email,Total,Status,Date\n" +
        orders.map(o => `${o.id},${o.customerName},${o.phone},${o.email},${o.total},${o.status},${o.date}`).join("\n");
    } else {
      csvContent = "Log ID,Order ID,Action,Details Message,User,Timestamp\n" +
        logs.map(l => `${l.id},${l.orderId},"${l.action}","${l.message}",${l.user},${l.timestamp}`).join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stpw-simulated-${type}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="sandbox-root" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* --- Global Header Bar --- */}
      <header id="sandbox-header" className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-emerald-400 tracking-tight flex items-center gap-2">
              SmartTechPro PayPal WhatsApp Gateway Pro
              <span className="text-xs bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/25">
                v1.0.0 (HPOS Production-Ready)
              </span>
            </h1>
            <p className="text-xs text-slate-400">Interactive Developer Sandbox, WooCommerce Control Panel, & ZIP Compiler</p>
          </div>
        </div>

        {/* Core compile ZIP trigger button */}
        <button
          id="btn-compiler"
          onClick={triggerPackageDownload}
          disabled={isZipping}
          className="relative overflow-hidden group bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
        >
          {isZipping ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              <span>Packaging Scripts...</span>
            </>
          ) : wasZipDownloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-950 stroke-[3px]" />
              <span className="text-emerald-950">gateway-plugin.zip Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-900 transition-transform group-hover:translate-y-0.5" />
              <span>Compile & Download WordPress Plugin ZIP</span>
            </>
          )}
        </button>
      </header>

      {/* --- Main Contents Layout Workspace --- */}
      <div id="sandbox-layout" className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* --- Left Column Sidebar (Config Setting Inputs | Place Orders Form | Coder Browsing) --- */}
        <aside id="sandbox-left-col" className="w-full lg:w-[380px] bg-slate-950/85 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0">
          
          {/* Vertical selectors */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs font-semibold">
            <button
              id="left-tab-settings"
              onClick={() => setActiveLeftTab("settings")}
              className={`flex-1 py-2.5 rounded text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeLeftTab === "settings" ? "bg-slate-800 text-emerald-400 border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gateway Settings</span>
            </button>
            <button
              id="left-tab-checkout"
              onClick={() => setActiveLeftTab("checkout")}
              className={`flex-1 py-2.5 rounded text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeLeftTab === "checkout" ? "bg-slate-800 text-emerald-400 border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Checkout Sandbox</span>
            </button>
            <button
              id="left-tab-coder"
              onClick={() => setActiveLeftTab("coder")}
              className={`flex-1 py-2.5 rounded text-center flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeLeftTab === "coder" ? "bg-slate-800 text-emerald-400 border border-slate-700/50" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Plugin Code</span>
            </button>
          </div>

          {/* Drawer contents scrollable area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
            <AnimatePresence mode="wait">
              {activeLeftTab === "settings" && (
                <motion.div
                  key="sidebar-settings"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-500">
                      WooCommerce Gateway Config
                    </h2>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 text-slate-400 rounded">Option Table</span>
                  </div>

                  {/* Setting Toggle gateway */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div>
                      <span className="font-semibold text-xs block text-slate-200">Enable Gateway</span>
                      <span className="text-[10px] text-slate-400">Activate manual payment checkout</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enabled} 
                        onChange={(e) => setEnabled(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-900 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Gateway Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Gateway Title</label>
                    <input 
                      type="text" 
                      value={gatewayTitle} 
                      onChange={(e) => setGatewayTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Gateway Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Gateway Description</label>
                    <textarea 
                      value={gatewayDescription} 
                      onChange={(e) => setGatewayDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Support Representative Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Support Rep Name</label>
                    <input 
                      type="text" 
                      value={supportName} 
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Support WhatsApp Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Support WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={supportPhone} 
                      onChange={(e) => setSupportPhone(e.target.value)}
                      placeholder="+2348012345678"
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* PayPal Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">PayPal Email Address</label>
                    <input 
                      type="email" 
                      value={paypalEmail} 
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Thank You Page Message */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Thank You Message (Manual Fallback)</label>
                    <textarea 
                      value={thankYouMessage} 
                      onChange={(e) => setThankYouMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                    />
                  </div>

                  {/* WhatsApp Custom Template */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 block">Custom WhatsApp Message Template</label>
                    <p className="text-[10px] text-slate-500 mb-1">Supported shortcodes: {'{order_id}'}, {'{customer_name}'}, {'{customer_email}'}, {'{customer_phone}'}, {'{order_total}'}, {'{product_list}'}, {'{support_name}'}, {'{paypal_email}'}</p>
                    <textarea 
                      value={customTemplate} 
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      rows={7}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-emerald-500 resize-y"
                    />
                  </div>

                  {/* Toggle boxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableLogging} 
                        onChange={(e) => setEnableLogging(e.target.checked)} 
                        className="rounded border-slate-800 text-emerald-500 focus:ring-slate-900 bg-slate-900"
                      />
                      <span>Enable custom SQL DB Logging (<code>wp_stpw_logs</code>)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableCustomerEmails} 
                        onChange={(e) => setEnableCustomerEmails(e.target.checked)} 
                        className="rounded border-slate-800 text-emerald-500 focus:ring-slate-900 bg-slate-900"
                      />
                      <span>Enable custom status Customer Emails</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enableAdminEmails} 
                        onChange={(e) => setEnableAdminEmails(e.target.checked)} 
                        className="rounded border-slate-800 text-emerald-500 focus:ring-slate-900 bg-slate-900"
                      />
                      <span>Enable Admin Request Email Alerts</span>
                    </label>
                  </div>
                </motion.div>
              )}

              {activeLeftTab === "checkout" && (
                <motion.div
                  key="sidebar-checkout"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-yellow-500">
                      WooCommerce Checkout Simulation
                    </h2>
                    <span className="text-xs bg-slate-900 border border-yellow-500/20 text-yellow-400 font-mono px-2 py-0.5 rounded">Storefront</span>
                  </div>

                  {!enabled ? (
                    <div className="p-4 bg-red-950 border border-red-800 rounded-lg text-xs space-y-2">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>Payment Gateway Disabled</span>
                      </div>
                      <p className="text-slate-300">You have turned off the gateway under settings tab. Re-enable to test customer redirects!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Products select checkbox mockup */}
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                        <span className="text-xs block font-bold text-slate-300 text-[11px] uppercase tracking-wider">Configure Shopping Cart:</span>
                        
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedProducts.includes("Woo Canvas bag")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(prev => [...prev, "Woo Canvas bag"]);
                              } else {
                                setSelectedProducts(prev => prev.filter(p => p !== "Woo Canvas bag"));
                              }
                            }}
                            className="rounded border-slate-800 text-emerald-500 focus:ring-slate-900 bg-slate-900"
                          />
                          <div className="flex-1 flex justify-between">
                            <span>Woo Canvas bag</span>
                            <span className="text-emerald-500 font-mono">$120</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedProducts.includes("Premium Mug")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(prev => [...prev, "Premium Mug"]);
                              } else {
                                setSelectedProducts(prev => prev.filter(p => p !== "Premium Mug"));
                              }
                            }}
                            className="rounded border-slate-800 text-emerald-500 focus:ring-slate-900 bg-slate-900"
                          />
                          <div className="flex-1 flex justify-between">
                            <span>Premium Mug</span>
                            <span className="text-emerald-500 font-mono">$30</span>
                          </div>
                        </label>

                        <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold font-mono text-slate-200">
                          <span>Subtotal:</span>
                          <span className="text-emerald-400">
                            ${selectedProducts.includes("Woo Canvas bag") && selectedProducts.includes("Premium Mug") ? 150 : selectedProducts.includes("Woo Canvas bag") ? 120 : selectedProducts.includes("Premium Mug") ? 30 : 0}
                          </span>
                        </div>
                      </div>

                      {/* Billing Form */}
                      <div className="space-y-3 pt-2">
                        <span className="text-xs block font-bold text-slate-300 text-[11px] uppercase tracking-wider">Billing details:</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 block">First Name</label>
                            <input 
                              type="text" 
                              value={custFirstName} 
                              onChange={(e) => setCustFirstName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400 block">Last Name</label>
                            <input 
                              type="text" 
                              value={custLastName} 
                              onChange={(e) => setCustLastName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 block">Customer Email address (Inbox notifications)</label>
                          <input 
                            type="email" 
                            value={custEmail} 
                            onChange={(e) => setCustEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 block">Customer WhatsApp Mobile No</label>
                          <input 
                            type="text" 
                            value={custPhone} 
                            onChange={(e) => setCustPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>

                      {/* Payment gate option mock selected */}
                      <div className="bg-slate-900 p-3 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 space-y-2 mt-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            {gatewayTitle}
                          </span>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">Custom Gateway</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic pr-2">
                          "{gatewayDescription}"
                        </p>
                      </div>

                      {/* PLACE ORDER SIMULATED TRIGGER */}
                      <button
                        onClick={handlePlaceSimulatedOrder}
                        disabled={selectedProducts.length === 0}
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg hover:shadow-yellow-500/10 active:scale-95 transition-all text-center cursor-pointer"
                      >
                        Place Order (Simulate Redirect)
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeLeftTab === "coder" && (
                <motion.div
                  key="sidebar-coder"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider text-purple-400">
                      Plugin File Directory
                    </h2>
                    <span className="text-[10px] bg-slate-900 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/20">PHP Classes</span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Below are the files we authored to construct this WooCommerce plugin inside this workspace container. Select a file to inspect its source code.
                  </p>

                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 divide-y divide-slate-900 max-h-[460px] overflow-y-auto">
                    {/* Main directory row */}
                    <div className="flex items-center gap-2 p-1.5 text-xs text-slate-300 font-bold">
                      <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>smarttechpro-paypal-whatsapp-gateway-pro/</span>
                    </div>

                    <div className="pl-4 pt-1.5 space-y-1 font-mono text-xs">
                      {/* Main php file */}
                      {PLUGIN_FILES.filter(f => f.category === "core").map(file => (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file)}
                          className={`w-full text-left p-1.5 rounded flex items-center gap-2 transition-all cursor-pointer ${
                            selectedFile.path === file.path ? "bg-purple-950/55 text-purple-300 border-l-2 border-purple-500" : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>{file.name}</span>
                        </button>
                      ))}

                      {/* includes directory row */}
                      <div className="flex items-center gap-2 p-1.5 text-xs text-slate-400 font-bold pt-2">
                        <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>includes/</span>
                      </div>

                      <div className="pl-4 space-y-0.5">
                        {PLUGIN_FILES.filter(f => f.category === "include").map(file => (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFile(file)}
                            className={`w-full text-left p-1 rounded flex items-center gap-2 transition-all cursor-pointer ${
                              selectedFile.path === file.path ? "bg-purple-950/55 text-purple-300 border-l-2 border-purple-500" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <FileCode className="w-3 h-3 text-slate-500" />
                            <span>{file.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* templates directory row */}
                      <div className="flex items-center gap-2 p-1.5 text-xs text-slate-400 font-bold pt-2">
                        <Folder className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span>templates/</span>
                      </div>

                      <div className="pl-4 space-y-0.5">
                        {PLUGIN_FILES.filter(f => f.category === "template").map(file => (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFile(file)}
                            className={`w-full text-left p-1 rounded flex items-center gap-2 transition-all cursor-pointer ${
                              selectedFile.path === file.path ? "bg-purple-950/55 text-purple-300 border-l-2 border-purple-500" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <FileCode className="w-3 h-3 text-slate-500" />
                            <span>{file.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* assets directory row */}
                      <div className="flex items-center gap-2 p-1.5 text-xs text-slate-400 font-bold pt-2">
                        <Folder className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>assets/</span>
                      </div>

                      <div className="pl-4 space-y-0.5 pb-2">
                        {PLUGIN_FILES.filter(f => f.category === "asset").map(file => (
                          <button
                            key={file.path}
                            onClick={() => setSelectedFile(file)}
                            className={`w-full text-left p-1 rounded flex items-center gap-2 transition-all cursor-pointer ${
                              selectedFile.path === file.path ? "bg-purple-950/55 text-purple-300 border-l-2 border-purple-500" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <FileCode className="w-3 h-3 text-slate-500" />
                            <span>{file.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* --- Middle Workspace: Simulated WordPress WooCommerce Admin Panel --- */}
        <section id="sandbox-mid-col" className="flex-1 bg-slate-900 flex flex-col min-w-0 overflow-hidden">
          
          {/* Simulated WordPress header tabs */}
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white py-1">
              <Laptop className="w-4 h-4 text-blue-400" />
              <span>WordPress / WooCommerce Admin Console</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded border border-slate-800">
              <button
                id="mid-tab-overview"
                onClick={() => setActiveMiddleTab("overview")}
                className={`px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  activeMiddleTab === "overview" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard Widgets
              </button>
              <button
                id="mid-tab-orders"
                onClick={() => setActiveMiddleTab("orders")}
                className={`px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  activeMiddleTab === "orders" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PayPal Orders Grid
              </button>
              <button
                id="mid-tab-logs"
                onClick={() => setActiveMiddleTab("logs")}
                className={`px-3 py-1.5 rounded font-medium transition-all cursor-pointer relative ${
                  activeMiddleTab === "logs" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SQL DB Logs: wp_stpw_logs
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
              <button
                id="mid-tab-emails"
                onClick={() => setActiveMiddleTab("emails")}
                className={`px-3 py-1.5 rounded font-medium transition-all cursor-pointer ${
                  activeMiddleTab === "emails" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Emails Output Visualizer
              </button>
            </div>
          </div>

          {/* Active WordPress Page display container */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <AnimatePresence mode="wait">
              {activeMiddleTab === "overview" && (
                <motion.div
                  key="woo-admin-overview"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <h2 className="font-display font-medium text-slate-200 text-sm tracking-tight text-emerald-400 uppercase text-[11px] tracking-widest">
                      Dashboard Analytics Feed
                    </h2>
                    <h3 className="text-xl font-display font-bold text-slate-100 mt-1">SmartTechPro PayPal WhatsApp</h3>
                    <p className="text-xs text-slate-400">Manual review pipeline logs. Summary of custom state statistics.</p>
                  </div>

                  {/* Six Analytical Widgets */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    
                    {/* Widget Awaiting */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-amber-500 border-r border-y border-slate-800 shadow relative">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Awaiting PayPal</span>
                        <ShoppingCart className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">{metrics.awaiting}</p>
                      <span className="text-[10px] text-amber-500/80 mt-1 block">wc-awaiting-paypal</span>
                    </div>

                    {/* Widget Review */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-blue-500 border-r border-y border-slate-800 shadow">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Under Review</span>
                        <Search className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">{metrics.review}</p>
                      <span className="text-[10px] text-blue-400 mt-1 block">wc-paypal-review</span>
                    </div>

                    {/* Widget Paid */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-emerald-500 border-r border-y border-slate-800 shadow">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Paid Orders</span>
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">{metrics.paid}</p>
                      <span className="text-[10px] text-emerald-400 mt-1 block">wc-paypal-paid</span>
                    </div>

                    {/* Widget Failed */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-rose-500 border-r border-y border-slate-800 shadow">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Failed Orders</span>
                        <AlertOctagon className="w-4 h-4 text-rose-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">{metrics.failed}</p>
                      <span className="text-[10px] text-rose-400 mt-1 block">wc-paypal-failed</span>
                    </div>

                    {/* Widget Revenue */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-teal-500 border-r border-y border-slate-800 shadow">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Paid Revenue</span>
                        <Coins className="w-4 h-4 text-teal-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">${metrics.revenue}</p>
                      <span className="text-[10px] text-teal-400 mt-1 block">USD Consolidated</span>
                    </div>

                    {/* Widget Conversion */}
                    <div className="bg-slate-950/85 p-4 rounded-xl border-l-[3px] border-purple-500 border-r border-y border-slate-800 shadow">
                      <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-semibold block text-[11px] uppercase tracking-wider">Conversion</span>
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-200">{metrics.conversion}%</p>
                      <span className="text-[10px] text-purple-400 mt-1 block">Paid Ratio</span>
                    </div>
                  </div>

                  {/* Dual Grid block */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent PayPal orders block */}
                    <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="font-semibold text-slate-200 text-sm tracking-tight">Recent PayPal Orders Pipeline</h3>
                        <button onClick={() => setActiveMiddleTab("orders")} className="text-xs text-emerald-400 hover:underline">View Grid</button>
                      </div>

                      <div className="divide-y divide-slate-800">
                        {orders.slice(0, 3).map(order => (
                          <div key={order.id} className="py-2.5 flex items-center justify-between gap-4 text-xs font-medium">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-200">#{order.id} - {order.customerName}</span>
                              <span className="text-[10px] text-slate-400 block max-w-[200px] truncate">{order.products.join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-200">${order.total}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === "wc-awaiting-paypal" ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" :
                                order.status === "wc-paypal-review" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                                order.status === "wc-paypal-paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                                "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}>
                                {order.status.replace("wc-", "")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom Logs brief tracker logs panel */}
                    <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="font-semibold text-slate-200 text-sm tracking-tight">Recent Database Activity Log</h3>
                        <button onClick={() => setActiveMiddleTab("logs")} className="text-xs text-emerald-400 hover:underline">View Logs</button>
                      </div>

                      <div className="space-y-3 font-mono text-[11px] max-h-[160px] overflow-y-auto pr-1">
                        {logs.slice(0, 4).map(log => (
                          <div key={log.id} className="flex gap-2.5 leading-relaxed text-slate-300">
                            <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp.split(" ")[1]}</span>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 rounded self-start ${
                              log.action === "Paid" ? "bg-emerald-500/20 text-emerald-300" :
                              log.action === "Review" ? "bg-blue-500/20 text-blue-300" :
                              log.action === "WhatsApp Redirect" ? "bg-green-500/20 text-green-300 animate-pulse" :
                              "bg-slate-800 text-slate-400"
                            }`}>{log.action}</span>
                            <span className="flex-1">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeMiddleTab === "orders" && (
                <motion.div
                  key="woo-admin-orders"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 bg-slate-950/40 p-3 rounded-lg">
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">PayPal WhatsApp Custom Orders Controller</h3>
                      <p className="text-xs text-slate-400">List of orders placed through custom manual PayPal workflows. Review and update statuses below.</p>
                    </div>

                    <button onClick={() => exportSimulatedCSV("orders")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 font-semibold cursor-pointer">Export Orders CSV</button>
                  </div>

                  {/* WooCommerce table style layout */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 border-b border-slate-800 font-bold text-slate-400">
                        <tr>
                          <th className="p-4 w-16">Order ID</th>
                          <th className="p-4 w-28">Customer</th>
                          <th className="p-4 w-28">Email</th>
                          <th className="p-4 w-24">Phone</th>
                          <th className="p-4 w-20">Amount</th>
                          <th className="p-4 w-28">Status</th>
                          <th className="p-4 text-right">Payment Action Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 leading-normal">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-200">#{order.id}</td>
                            <td className="p-4 font-semibold text-slate-300">{order.customerName}</td>
                            <td className="p-4 text-slate-400">{order.email}</td>
                            <td className="p-4 text-slate-400 font-mono">
                              <a href={`https://wa.me/${order.phone.replace(/[^0-9]/g,"")}`} target="_blank" className="hover:underline flex items-center gap-1 text-emerald-400">
                                <Phone className="w-3 h-3 text-emerald-500" />
                                {order.phone}
                              </a>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-200">${order.total}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === "wc-awaiting-paypal" ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" :
                                order.status === "wc-paypal-review" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                                order.status === "wc-paypal-paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                                "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}>
                                {order.status === "wc-awaiting-paypal" ? "Awaiting PayPal" :
                                 order.status === "wc-paypal-review" ? "PayPal Review" :
                                 order.status === "wc-paypal-paid" ? "PayPal Paid" : "PayPal Failed"}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {order.status === "wc-awaiting-paypal" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, "wc-paypal-review", "Manual verification initiated")}
                                    className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Review
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, "wc-paypal-paid", "Manual verification cleared successfully")}
                                    className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Mark Paid
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, "wc-paypal-failed", "PayPal transaction mismatch or rejection")}
                                    className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Fail
                                  </button>
                                  <button
                                    onClick={() => handleSendReminder(order.id, order.customerName)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Reminder
                                  </button>
                                </>
                              )}

                              {order.status === "wc-paypal-review" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, "wc-paypal-paid", "Manual review finished - Payment confirmed")}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Approve Payment
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(order.id, "wc-paypal-failed", "Manual review finished - Reference rejected")}
                                    className="px-2 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded text-[10px] uppercase shadow-sm cursor-pointer"
                                  >
                                    Reject Payment
                                  </button>
                                </>
                              )}

                              {order.status === "wc-paypal-paid" && (
                                <span className="text-[11px] text-slate-500 font-semibold italic">Processing in WooCommerce...</span>
                              )}

                              {order.status === "wc-paypal-failed" && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, "wc-awaiting-paypal", "Administrator reset payment checking")}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[10px] uppercase border border-slate-700 cursor-pointer"
                                >
                                  Retry Check
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeMiddleTab === "logs" && (
                <motion.div
                  key="woo-admin-logs"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* Database analyzer header */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Database className="text-emerald-400 w-5 h-5 shrink-0" />
                      <div>
                        <h3 className="font-bold text-slate-200 text-sm">System Database Table Analyzer</h3>
                        <p className="text-xs text-slate-400">Renders live records from the custom table <code className="text-emerald-400">wp_stpw_logs</code>.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => exportSimulatedCSV("logs")}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 font-semibold cursor-pointer"
                    >
                      Export Logs CSV
                    </button>
                  </div>

                  {/* Filter forms */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Search logs message or order id..." 
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 pl-9 text-xs text-slate-300 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <select 
                        value={logActionFilter}
                        onChange={(e) => setLogActionFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Filter by Action Category</option>
                        <option value="WhatsApp Redirect">WhatsApp Redirect</option>
                        <option value="Order Created">Order Created</option>
                        <option value="Review">Review</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Reminder Sent">Reminder Sent</option>
                        <option value="Customer Email Sent">Customer Email Sent</option>
                        <option value="Gateway Installed">Gateway Installed</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end">
                      <button 
                        onClick={() => { setLogSearch(""); setLogActionFilter(""); }}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>

                  {/* Logger Data Table */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
                    <table className="w-full text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                        <tr>
                          <th className="p-3 w-12">ID</th>
                          <th className="p-3 w-16">Order ID</th>
                          <th className="p-3 w-32">Action Code</th>
                          <th className="p-3">Details Message</th>
                          <th className="p-3 w-16">Initor</th>
                          <th className="p-3 w-28 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px]">
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colspan="6" className="p-8 text-center text-slate-500">No database log entries matched search criteria.</td>
                          </tr>
                        ) : (
                          filteredLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 text-slate-500">#{l.id}</td>
                              <td className="p-3 font-bold text-slate-200">{l.orderId > 0 ? `#${l.orderId}` : "System"}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  l.action === "Paid" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/10" :
                                  l.action === "Review" ? "bg-blue-500/20 text-blue-300 border border-blue-500/10" :
                                  l.action === "WhatsApp Redirect" ? "bg-green-500/20 text-green-300 border border-green-500/10" :
                                  l.action === "Failed" ? "bg-red-500/20 text-red-300 border border-red-500/10" :
                                  "bg-slate-800 text-slate-400"
                                }`}>
                                  {l.action}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300 whitespace-pre-wrap pr-4">{l.message}</td>
                              <td className="p-3 font-semibold text-slate-400">{l.user}</td>
                              <td className="p-3 text-right text-slate-500">{l.timestamp}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeMiddleTab === "emails" && (
                <motion.div
                  key="woo-admin-emails"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                    <h3 className="font-bold text-slate-200 text-sm">Transactional Alerts Visualizer</h3>
                    <p className="text-xs text-slate-400">Select states below to preview customer transactions email outputs styled with direct WooCommerce wrappers.</p>
                  </div>

                  <div className="flex gap-2">
                    {["Payment Reviewed", "Payment Confirmed", "Payment Failed"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (tag === "Payment Reviewed") {
                            setSelectedFile(PLUGIN_FILES.find(f => f.name === "email-review.php") || PLUGIN_FILES[0]);
                          } else if (tag === "Payment Confirmed") {
                            setSelectedFile(PLUGIN_FILES.find(f => f.name === "email-paid.php") || PLUGIN_FILES[0]);
                          } else {
                            setSelectedFile(PLUGIN_FILES.find(f => f.name === "email-failed.php") || PLUGIN_FILES[0]);
                          }
                          setActiveLeftTab("coder");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Inspect {tag} HTML PHP Code</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Review Preview */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-blue-500 text-slate-950 text-[10px] px-2 py-0.5 font-bold uppercase">Review Alert</div>
                      <span className="text-[11px] text-slate-400 block font-bold leading-normal">SUBJECT: Your PayPal Payment Is Being Reviewed</span>
                      <div className="bg-white text-slate-800 p-4 rounded font-sans text-xs space-y-2 border border-slate-300">
                        <div className="border-b-2 border-emerald-500 pb-2 text-center text-emerald-600 font-bold text-sm">PayPal Payment Reviewing</div>
                        <p className="font-bold text-[11px]">Hello John,</p>
                        <p className="text-[11px] leading-relaxed text-slate-600">We are currently reviewing your manual PayPal payment submission for authentication. Our administration is checking matching transaction record details.</p>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <strong className="block text-[10px] text-slate-700">Order Summary:</strong>
                          <span>Order ID: #3025</span><br />
                          <span>Total Amount: 150 USD</span><br />
                          <span>Status: Being Reviewed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center pt-2">Thank you for shopping with My eCommerce Store</p>
                      </div>
                    </div>

                    {/* Paid Alert */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 font-bold uppercase">Payment Clear</div>
                      <span className="text-[11px] text-slate-400 block font-bold leading-normal">SUBJECT: Payment Confirmed</span>
                      <div className="bg-white text-slate-800 p-4 rounded font-sans text-xs space-y-2 border border-slate-300">
                        <div className="border-b-2 border-emerald-500 pb-2 text-center text-emerald-600 font-bold text-sm">PayPal Payment Cleared</div>
                        <p className="font-bold text-[11px]">Hello John,</p>
                        <p className="text-[11px] leading-relaxed text-slate-600">Great news! We have successfully validated your manual PayPal payment. Your order has been marked as fully Paid and is currently proceeding to fulfillment.</p>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <strong className="block text-[10px] text-slate-700">Order & Payment Summary:</strong>
                          <span>Order ID: #3025</span><br />
                          <span>Total Amount: 150 USD</span><br />
                          <span>Status: PayPal Paid - Confirmed</span>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center pt-2">Thank you for shopping with My eCommerce Store</p>
                      </div>
                    </div>

                    {/* Failed Alert */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold uppercase">Rejected</div>
                      <span className="text-[11px] text-slate-400 block font-bold leading-normal">SUBJECT: Payment Verification Failed</span>
                      <div className="bg-white text-slate-800 p-4 rounded font-sans text-xs space-y-2 border border-slate-300">
                        <div className="border-b-2 border-red-500 pb-2 text-center text-red-600 font-bold text-sm">Payment Verification Failed</div>
                        <p className="font-bold text-[11px]">Hello John,</p>
                        <p className="text-[11px] leading-relaxed text-slate-600">We were unable to verify your manual PayPal payment for this order. This might have occurred due to a transaction mismatch, canceled payment, or unrecognized reference number.</p>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <strong className="block text-[10px] text-slate-700">Unverified Details:</strong>
                          <span>Order ID: #3025</span><br />
                          <span>Total Amount: 150 USD</span><br />
                          <span>Status: PayPal Failed / Rejected</span>
                        </div>
                        <p className="text-[10px] text-red-500 font-semibold italic text-center pt-2">Please reach out to our active support live chat.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Code Inspector segment visible when active coder --- */}
            {activeLeftTab === "coder" && (
              <div id="inspector-console" className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mt-6 shadow-2xl flex flex-col">
                <div className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="text-purple-400 w-4.5 h-4.5 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 font-bold font-mono">FILE: </span>
                      <span className="font-mono text-xs font-bold text-slate-200">smarttechpro-paypal-whatsapp-gateway-pro/{selectedFile.path}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-950 text-purple-400 font-mono border border-purple-500/20 px-2 py-0.5 rounded">
                    {selectedFile.language.toUpperCase()} Class Source
                  </span>
                </div>

                <div className="p-4 overflow-x-auto max-h-[400px] bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-300 select-text">
                  <pre className="whitespace-pre">
                    <code>
                      {selectedFile.content}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- Right Column Sidebar: Smartphone Interactive Chat Simulator --- */}
        <aside id="sandbox-right-col" className="w-full lg:w-[350px] bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col items-center justify-center p-6 shrink-0 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          
          <div className="text-center mb-4 leading-tight">
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
              <Smartphone className="w-3.5 h-3.5" />
              Live Smartphone Simulator
            </span>
            <p className="text-[11px] text-slate-400 mt-2">Placed orders dispatch immediately to this mobile visual sandbox</p>
          </div>

          {/* Smartphone device outer boundary frame */}
          <div className="relative w-[280px] h-[540px] bg-slate-950 rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-800 shadow-slate-900/40">
            
            {/* Phone Speaker notch bar */}
            <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-800 rounded-b-2xl z-40 flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-900 rounded-full" />
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full ml-2" />
            </div>

            {/* Simulated Phone UI Content */}
            <div className="flex-grow flex flex-col min-h-0 bg-slate-900 pt-7 relative text-xs">
              <AnimatePresence mode="wait">
                
                {phoneScreen === "storefront" && (
                  <motion.div
                    key="phone-store"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-4 justify-between"
                  >
                    <div className="space-y-4">
                      <div className="text-center font-bold tracking-tight text-white border-b border-slate-800 pb-2">WooCommerce checkout</div>
                      <div className="bg-slate-950 p-2.5 border border-slate-800 rounded">
                        <span className="font-semibold text-[10px] block text-slate-300">Selected Gateway:</span>
                        <div className="flex items-center gap-2 text-emerald-400 mt-1 font-bold">
                          <div className="bg-emerald-500 text-slate-950 p-1 rounded">
                            <Phone className="w-3 h-3 text-slate-950" />
                          </div>
                          <span>PayPal WhatsApp manual</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-[10px] block text-slate-400">Products in Cart:</span>
                        <div className="space-y-1 text-[10px] text-slate-300">
                          {selectedProducts.map(p => (
                            <div key={p} className="flex justify-between border-b border-slate-800 pb-1.5">
                              <span>{p}</span>
                              <span className="font-bold text-white">$120</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <p className="text-[10px] text-slate-400 text-center italic">Instructions sent over secure support portal on WhatsApp.</p>
                      <button 
                        onClick={handlePlaceSimulatedOrder}
                        className="w-full py-2 bg-emerald-500 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider"
                      >
                        Buy Now (${selectedProducts.includes("Woo Canvas bag") && selectedProducts.includes("Premium Mug") ? 150 : selectedProducts.includes("Woo Canvas bag") ? 120 : 30})
                      </button>
                    </div>
                  </motion.div>
                )}

                {phoneScreen === "redirect" && (
                  <motion.div
                    key="phone-redirect"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center p-4 bg-slate-950 text-center space-y-4"
                  >
                    <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full border border-emerald-500/20 animate-bounce">
                      <ExternalLink className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Redirecting to WhatsApp...</h4>
                      <p className="text-[11px] text-slate-400 mt-2">Launching wa.me API link client-side</p>
                    </div>
                    <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full animate-infinite-scroll w-8" />
                    </div>
                  </motion.div>
                )}

                {phoneScreen === "whatsapp" && (
                  <motion.div
                    key="phone-chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col bg-[#0b141a] text-slate-100 h-full justify-between"
                  >
                    {/* Header bar WhatsApp style */}
                    <div className="bg-[#1f2c34] p-3 px-4 flex items-center gap-2 shrink-0 border-b border-[#2a3942]">
                      <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-slate-950">
                        A
                      </div>
                      <div className="leading-tight shrink-0">
                        <h4 className="font-bold text-white text-xs">{supportName}</h4>
                        <span className="text-[9px] text-slate-400 block font-mono">PayPal manual Desk</span>
                      </div>
                    </div>

                    {/* Chat Bubble scrollable stream */}
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto leading-relaxed bg-[#0b141a] text-[11px]">
                      
                      {/* Incoming Customer block */}
                      <div className="bg-[#005c4b] p-2.5 rounded-lg ml-8 rounded-tr-none text-slate-200">
                        <pre className="whitespace-pre-wrap font-sans">
                          {activeCompiledWhatsAppMessage}
                        </pre>
                        <span className="text-[9px] text-emerald-300 block text-right mt-1.5 select-none text-[9px]">14:14 ✔✔</span>
                      </div>

                      {/* Rep Response simulated backup instructions bubble */}
                      <div className="bg-[#202c33] p-2.5 rounded-lg mr-8 rounded-tl-none text-slate-200">
                        <span className="font-bold text-emerald-400 block mb-1">Rep Profile: {supportName}</span>
                        <p className="text-[11px] font-medium leading-relaxed">
                          Hello! To finalize payment, please send USD to our PayPal: <strong>{paypalEmail}</strong>.
                        </p>
                        <p className="mt-1 leading-relaxed text-[10px] text-slate-400 italic">
                          Reference: Order #3025. Send screenshot here after pay.
                        </p>
                        <span className="text-[8px] text-slate-500 block text-right mt-1 font-mono">14:15</span>
                      </div>
                    </div>

                    {/* WhatsApp mock input bar */}
                    <div className="bg-[#1f2c34] p-2 flex items-center gap-2 border-t border-[#2a3942] shrink-0">
                      <div className="flex-grow bg-[#2a3942] rounded-full px-3 py-1 text-slate-300 text-[10px]">
                        Type payment receipt...
                      </div>
                      <button 
                        onClick={() => {
                          // Force update inside orders
                          const lastOrder = orders[0];
                          if (lastOrder) {
                            handleUpdateStatus(lastOrder.id, "wc-paypal-review", "Customer submitted payment screenshot over WhatsApp chat");
                          }
                          setPhoneScreen("storefront");
                        }}
                        className="bg-emerald-500 text-slate-900 p-1.5 rounded-full hover:bg-emerald-400 active:scale-90 transition-all cursor-pointer"
                        title="Simulate payment screenshot dispatch"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Phone bottom bar */}
            <div className="h-6 bg-slate-950 flex items-center justify-center shrink-0">
              <button 
                onClick={() => setPhoneScreen("storefront")}
                className="w-20 h-1 bg-slate-800 rounded-full hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                title="Reset device"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

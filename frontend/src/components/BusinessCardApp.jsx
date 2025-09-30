import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  CloudUpload,
  Download,
  QrCode,
  User,
  Building,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { apiService } from "../lib/api";
import UserUsage from "./UserUsage";
import ChangePassword from "./ChangePassword";
import { useAuth } from "../contexts/AuthContext";

// URL deduplication utility function
const deduplicateUrls = (urls, allowEmpty = false) => {
  if (!Array.isArray(urls)) return [];
  
  const seen = new Set();
  const unique = [];
  
  urls.forEach(url => {
    if (url && typeof url === 'string') {
      // Normalize URL for comparison (remove protocol, www, trailing slash)
      const normalized = url.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '');
      
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(url.trim());
      }
    } else if (allowEmpty && url === '') {
      // Allow empty strings when adding new entries
      unique.push('');
    }
  });
  
  return unique;
};

const BusinessCardApp = () => {
  // Auth context
  const { logout, user } = useAuth();
  
  // State management
  const [mode, setMode] = useState("single");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [bulkImages, setBulkImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContacts, setProcessedContacts] = useState([]);
  const [selectedFields, setSelectedFields] = useState({
    fullName: true,
    jobTitle: true,
    company: true,
    phones: true,
    emails: true,
    websites: true,
    address: true,
  });
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrMode, setQrMode] = useState("single"); // "single" or "bulk"
  
  // Navbar state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
    { id: 'usage', label: 'Usage Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Change Password', icon: Settings },
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'usage':
        return <UserUsage />;
      case 'settings':
        return <ChangePassword />;
      default:
        return renderDashboard();
    }
  };

  // Refs
  const fileInputRef = useRef(null);
  const backFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const processedContactsRef = useRef(null);
  const bulkProcessedContactsRef = useRef(null);



  // File handling functions
  const handleFileSelect = (files, isBulk = false) => {
    if (isBulk) {
      const fileArray = Array.from(files);
      // Validate file types
      const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        toast.error(`Please select only image files. ${invalidFiles.length} invalid file(s) removed.`);
      }
      const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
      setBulkImages(validFiles);
      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} image(s) selected for bulk processing`);
      }
    } else {
      if (files.length > 0) {
        if (!files[0].type.startsWith('image/')) {
          toast.error('Please select an image file for the front of the card');
          return;
        }
        setFrontImage(files[0]);
        toast.success('Front image selected');
      }
      if (files.length > 1) {
        if (!files[1].type.startsWith('image/')) {
          toast.error('Please select an image file for the back of the card');
          return;
        }
        setBackImage(files[1]);
        toast.success('Back image selected');
      }
    }
  };

  const handleDrop = (e, isBulk = false) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileSelect(files, isBulk);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // OCR Processing
  const processSingleCard = async () => {
    if (!frontImage || !user?.id) {
      toast.error("Please select an image and ensure you're logged in");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await apiService.uploadSingleCard(user.id, frontImage, backImage);
      
      // Add sourceMode to each contact and normalize data
      const contactsWithMode = (result.data || []).map((contact) => ({
        ...contact,
        sourceMode: mode,
        // Keep websites as array and deduplicate URLs
        websites: deduplicateUrls(Array.isArray(contact.websites) 
          ? contact.websites
          : (contact.websites ? [contact.websites] : [])),
      }));
      
      setProcessedContacts(contactsWithMode);
      setIsProcessing(false);
      
      // Show success toast
      toast.success(`Business card processed successfully! Found ${contactsWithMode.length} contact(s).`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Auto-scroll to processed contacts section in single mode
      if (mode === "single") {
        setTimeout(() => {
          processedContactsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to process business card. Please try again.";
      toast.error(errorMessage);
    }
  };

  const processBulkCards = async () => {
    if (bulkImages.length === 0 || !user?.id) {
      toast.error("Please select images and ensure you're logged in");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await apiService.uploadBulkCards(user.id, bulkImages);
      
      // Add sourceMode to each contact and normalize data
      const contactsWithMode = (result.data || []).map((contact) => ({
        ...contact,
        sourceMode: mode,
        // Keep websites as array and deduplicate URLs
        websites: deduplicateUrls(Array.isArray(contact.websites) 
          ? contact.websites
          : (contact.websites ? [contact.websites] : [])),
      }));
      
      setProcessedContacts(contactsWithMode);
      setIsProcessing(false);
      
      // Show success toast
      toast.success(`🎉 Bulk processing completed! Successfully processed ${contactsWithMode.length} business card(s).`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Auto-scroll to processed contacts section in bulk mode
      if (mode === "bulk") {
        setTimeout(() => {
          bulkProcessedContactsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to process bulk cards. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Export functions
  const exportVCF = async (contact) => {
    try {
      const blob = await apiService.exportVCF(contact);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contact.fullName || "contact"}.vcf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("VCF file downloaded successfully");
    } catch (error) {
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to export VCF file. Please try again.";
      toast.error(errorMessage);
    }
  };

  const exportBulkVCF = async () => {
    try {
      const blob = await apiService.exportBulkVCF(processedContacts);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts.vcf";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Bulk VCF file downloaded successfully");
    } catch (error) {
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to export bulk VCF file. Please try again.";
      toast.error(errorMessage);
    }
  };

  const exportCSV = async () => {
    try {
      const blob = await apiService.exportCSV(processedContacts, selectedFields);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV file downloaded successfully");
    } catch (error) {
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to export CSV file. Please try again.";
      toast.error(errorMessage);
    }
  };

  const exportXLSX = async () => {
    try {
      const blob = await apiService.exportXLSX(processedContacts, selectedFields);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to export Excel file. Please try again.";
      toast.error(errorMessage);
    }
  };

  const generateQR = async (contact, isBulk = false) => {
    try {
      // Prevent QR generation for bulk mode
      if (isBulk) {
        toast.info("QR codes are only available for single contacts. Please select one contact to generate a QR code.");
        return;
      }

      const data = await apiService.generateQR(
        isBulk ? null : contact,
        isBulk ? processedContacts : null
      );
      setQrData(data.qrData || "");
      setQrMode(isBulk ? "bulk" : "single");
      setQrModalOpen(true);
    } catch (error) {
      const errorMessage = error.toastMessage || error.response?.data?.error || "Failed to generate QR code. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Contact editing
  const updateContact = (index, field, value) => {
    const updatedContacts = [...processedContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setProcessedContacts(updatedContacts);
  };

  // Clear processed contacts when switching modes
  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      // Check if there's processed data that will be lost
      if (processedContacts.length > 0 || isProcessing) {
        const confirmed = window.confirm(
          `Switching to ${newMode === "single" ? "Single Card" : "Bulk Upload"} mode will clear all current processed data. Are you sure you want to continue?`
        );
        
        if (!confirmed) {
          return; // User cancelled, don't switch modes
        }
      }
      
      setProcessedContacts([]);
      setIsProcessing(false);
    }
    setMode(newMode);
  };

  const addPhone = (contactIndex) => {
    const updatedContacts = [...processedContacts];
    if (!updatedContacts[contactIndex].phones) {
      updatedContacts[contactIndex].phones = [];
    }
    updatedContacts[contactIndex].phones.push("");
    setProcessedContacts(updatedContacts);
  };

  const addEmail = (contactIndex) => {
    const updatedContacts = [...processedContacts];
    if (!updatedContacts[contactIndex].emails) {
      updatedContacts[contactIndex].emails = [];
    }
    updatedContacts[contactIndex].emails.push("");
    setProcessedContacts(updatedContacts);
  };

  const updatePhone = (contactIndex, phoneIndex, value) => {
    const updatedContacts = [...processedContacts];
    updatedContacts[contactIndex].phones[phoneIndex] = value;
    setProcessedContacts(updatedContacts);
  };

  const updateEmail = (contactIndex, emailIndex, value) => {
    const updatedContacts = [...processedContacts];
    updatedContacts[contactIndex].emails[emailIndex] = value;
    setProcessedContacts(updatedContacts);
  };

  // Render dashboard content (original BusinessCardApp content)
  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1
          className="text-4xl md:text-5xl font-bold text-premium-black mb-2 pb-4"
        >
          Super Scanner
        </h1>
        <p className="text-lg md:text-xl text-premium-gray">
          Extract and manage contact information with AI-powered OCR
        </p>
        <p className="text-sm text-premium-gray-light mt-2">
          Powered by{" "}
          <a
            href="https://troikatech.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-semibold decoration-2 underline-offset-2 transition-colors"
          >
            Troika Tech
          </a>
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <div className="w-full max-w-lg mx-auto">
          <div className="relative bg-premium-white border border-premium-border rounded-full p-1 shadow-inner">
            {/* Moving gradient indicator */}
            <motion.div
              className="absolute inset-y-1 w-1/2 rounded-full bg-black shadow-lg"
              animate={{
                left: mode === "single" ? "0.25rem" : "50%",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />

            {/* Radio buttons */}
            <RadioGroup
              value={mode}
              onValueChange={handleModeChange}
              className="relative z-10 grid grid-cols-2"
            >
              <RadioGroupItem
                value="single"
                id="single"
                className="h-12 rounded-full border-0 bg-transparent text-center"
              >
                <div className="flex items-center justify-center h-full">
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      mode === "single" ? "text-premium-white" : "text-premium-gray"
                    }`}
                  >
                    Single Card
                  </span>
                </div>
              </RadioGroupItem>

              <RadioGroupItem
                value="bulk"
                id="bulk"
                className="h-12 rounded-full border-0 bg-transparent text-center"
              >
                <div className="flex items-center justify-center h-full">
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      mode === "bulk" ? "text-premium-white" : "text-premium-gray"
                    }`}
                  >
                    Bulk Upload
                  </span>
                </div>
              </RadioGroupItem>
            </RadioGroup>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {mode === "single" ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Single Card Upload */}
            <div className="bg-premium-white border border-premium-border rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-premium-black mb-6">
                Upload Business Card
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Front Image */}
                <div>
                  <label className="block text-premium-black mb-2 font-medium">
                    Front Image *
                  </label>
                  <div
                    className="border-2 border-dashed border-premium-border rounded-xl p-6 text-center cursor-pointer hover:border-premium-orange hover:bg-premium-orange-muted transition-colors"
                    onDrop={(e) => handleDrop(e, false)}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {frontImage ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(frontImage)}
                          alt="Front"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <p className="text-premium-gray text-sm">
                          {frontImage.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <CloudUpload className="w-8 h-8 text-premium-gray mx-auto" />
                        <p className="text-premium-gray">
                          Drop front image here or click to select
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files, false)}
                    className="hidden"
                  />
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-premium-black mb-2 font-medium">
                    <div className="flex items-center gap-2">
                      Back Image (Optional)
                      <div className="relative group">
                        <Info className="w-4 h-4 text-premium-gray hover:text-premium-orange cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-premium-black text-premium-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Adding both front and back images counts as 2 scans
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-premium-black"></div>
                        </div>
                      </div>
                    </div>
                  </label>
                  <div
                    className="border-2 border-dashed border-premium-border rounded-xl p-6 text-center cursor-pointer hover:border-premium-orange hover:bg-premium-orange-muted transition-colors"
                    onDrop={(e) => handleDrop(e, false)}
                    onDragOver={handleDragOver}
                    onClick={() => backFileInputRef.current?.click()}
                  >
                    {backImage ? (
                      <div className="space-y-2">
                        <img
                          src={URL.createObjectURL(backImage)}
                          alt="Back"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <p className="text-premium-gray text-sm">
                          {backImage.name}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <CloudUpload className="w-8 h-8 text-premium-gray mx-auto" />
                        <p className="text-premium-gray">
                          Drop back image here or click to select
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={backFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        setBackImage(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <Button
                onClick={processSingleCard}
                disabled={!frontImage || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Process Card
                  </>
                )}
              </Button>
            </div>

            {/* Processed Contact Form - Only for Single Mode */}
            {processedContacts.length > 0 && (
                <motion.div
                  ref={processedContactsRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-premium-white border border-premium-border rounded-2xl p-8 shadow-lg"
                >
                  <h2 className="text-2xl font-semibold text-premium-black mb-6">
                    Edit Contact Information
                  </h2>

                  {processedContacts.map((contact, index) => (
                    <div key={index} className="space-y-6">
                      {/* Source Mode Label */}
                      {contact.sourceMode && (
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-medium text-premium-gray-light uppercase tracking-wide">
                            Source:
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              contact.sourceMode === "single"
                                ? "bg-premium-orange-muted text-premium-orange-dark"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {contact.sourceMode === "single"
                              ? "Single Card"
                              : "Bulk Upload"}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-premium-black mb-2 font-medium">
                            Full Name
                          </label>
                          <Input
                            value={contact.fullName || ""}
                            onChange={(e) =>
                              updateContact(index, "fullName", e.target.value)
                            }
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="block text-premium-black mb-2 font-medium">
                            Job Title
                          </label>
                          <Input
                            value={contact.jobTitle || ""}
                            onChange={(e) =>
                              updateContact(index, "jobTitle", e.target.value)
                            }
                            placeholder="Enter job title"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-premium-black mb-2 font-medium">
                          Company
                        </label>
                        <Input
                          value={contact.company || ""}
                          onChange={(e) =>
                            updateContact(index, "company", e.target.value)
                          }
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-premium-black mb-2 font-medium">
                          Phone Numbers
                        </label>
                        <div className="space-y-2">
                          {(contact.phones || [""]).map(
                            (phone, phoneIndex) => (
                              <div key={phoneIndex} className="flex gap-2">
                                <Input
                                  value={phone}
                                  onChange={(e) =>
                                    updatePhone(
                                      index,
                                      phoneIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter phone number"
                                />
                                {phoneIndex ===
                                  (contact.phones || [""]).length - 1 && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => addPhone(index)}
                                  >
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-premium-black mb-2 font-medium">
                          Email Addresses
                        </label>
                        <div className="space-y-2">
                          {(contact.emails || [""]).map(
                            (email, emailIndex) => (
                              <div key={emailIndex} className="flex gap-2">
                                <Input
                                  value={email}
                                  onChange={(e) =>
                                    updateEmail(
                                      index,
                                      emailIndex,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter email address"
                                />
                                {emailIndex ===
                                  (contact.emails || [""]).length - 1 && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => addEmail(index)}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-premium-black mb-2 font-medium">
                          Websites
                        </label>
                        <div className="space-y-2">
                          {(Array.isArray(contact.websites) ? contact.websites : (contact.websites ? [contact.websites] : [])).map((website, websiteIndex) => (
                            <div key={websiteIndex} className="flex gap-2">
                              <Input
                                value={website}
                                onChange={(e) => {
                                  const websites = Array.isArray(contact.websites) ? [...contact.websites] : (contact.websites ? [contact.websites] : []);
                                  websites[websiteIndex] = e.target.value;
                                  // Only deduplicate if the value is not empty (user is typing)
                                  if (e.target.value.trim()) {
                                    updateContact(index, "websites", deduplicateUrls(websites));
                                  } else {
                                    updateContact(index, "websites", websites);
                                  }
                                }}
                                placeholder="Enter website URL"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  const websites = Array.isArray(contact.websites) ? [...contact.websites] : (contact.websites ? [contact.websites] : []);
                                  websites.splice(websiteIndex, 1);
                                  updateContact(index, "websites", deduplicateUrls(websites));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const websites = Array.isArray(contact.websites) ? [...contact.websites] : (contact.websites ? [contact.websites] : []);
                              websites.push("");
                              updateContact(index, "websites", websites);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Website
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-premium-black mb-2 font-medium">
                          Address
                        </label>
                        <Input
                          value={contact.address || ""}
                          onChange={(e) =>
                            updateContact(index, "address", e.target.value)
                          }
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Export Buttons */}
                  <div className="mt-8 space-y-6">
                    {/* Spreadsheet Export Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Spreadsheet Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={exportXLSX}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download XLSX{" "}
                          <span className="text-xs ml-1">(Recommended)</span>
                        </Button>
                        <Button 
                          onClick={exportCSV} 
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </div>

                    {/* Contact Export Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Contact Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={() => exportVCF(processedContacts[0])}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download VCF
                        </Button>
                        <Button
                          onClick={() => generateQR(processedContacts[0], false)}
                          className="w-full"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Scan QR
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}


          </motion.div>
        ) : (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Bulk Upload */}
            <div className="bg-premium-white border border-premium-border rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-premium-black mb-6">
                Bulk Upload
              </h2>

              {/* Creative Instruction */}
              <div className="mb-6 p-4 bg-premium-beige-light border border-premium-border rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-premium-orange rounded-full flex items-center justify-center">
                    <span className="text-premium-white text-sm font-bold">✨</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">
                      Smart Card Processing
                    </h3>
                    <p className="text-sm text-premium-gray leading-relaxed">
                      <span className="font-medium text-premium-orange">Pro Tip:</span> Upload both front and back sides of your business cards! 
                      Our AI will intelligently merge the information from both sides, creating complete and accurate contact profiles. 
                      Just drop all your card images - we'll handle the rest! 🚀
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="border-2 border-dashed border-premium-border rounded-xl p-12 text-center cursor-pointer hover:border-premium-orange hover:bg-premium-orange-muted transition-colors"
                onDrop={(e) => handleDrop(e, true)}
                onDragOver={handleDragOver}
                onClick={() => bulkFileInputRef.current?.click()}
              >
                {bulkImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {bulkImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Card ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <span className="absolute top-2 right-2 bg-premium-orange text-premium-white text-xs px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-premium-gray">
                      {bulkImages.length} images selected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CloudUpload className="w-12 h-12 text-premium-gray mx-auto" />
                    <p className="text-premium-gray text-lg">
                      Drop multiple images here or click to select
                    </p>
                    <p className="text-premium-gray-light text-sm">
                      Supports JPG, PNG, and other image formats
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={bulkFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files, true)}
                className="hidden"
              />

              <Button
                onClick={processBulkCards}
                disabled={bulkImages.length === 0 || isProcessing}
                className="w-full mt-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Process {bulkImages.length} Cards
                  </>
                )}
              </Button>
            </div>

            {/* Field Selection - Only for Bulk Mode */}
            {processedContacts.length > 0 && (
                <motion.div
                  ref={bulkProcessedContactsRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-premium-beige border border-premium-border rounded-2xl p-8 shadow-lg"
                >
                  <h2 className="text-2xl font-semibold text-premium-black mb-6">
                    Select Fields to Export
                  </h2>

                  {/* Source Mode Summary */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-premium-black">
                        Processing Summary:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {processedContacts.map(
                        (contact, index) =>
                          contact.sourceMode && (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                contact.sourceMode === "single"
                                  ? "bg-premium-orange-muted text-premium-orange-dark"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              Card {index + 1}:{" "}
                              {contact.sourceMode === "single"
                                ? "Single"
                                : "Bulk"}
                            </span>
                          )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Object.entries(selectedFields).map(
                      ([field, checked]) => (
                        <label
                          key={field}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checked) =>
                              setSelectedFields((prev) => ({
                                ...prev,
                                [field]: checked,
                              }))
                            }
                          />
                          <span className="text-premium-black capitalize font-medium">
                            {field === "fullName"
                              ? "Full Name"
                              : field === "jobTitle"
                              ? "Job Title"
                              : field === "phones"
                              ? "Phone Numbers"
                              : field === "emails"
                              ? "Email Addresses"
                              : field === "websites"
                              ? "Websites"
                              : field}
                          </span>
                        </label>
                      )
                    )}
                  </div>

                  {/* Export Buttons */}
                  <div className="space-y-6">
                    {/* Spreadsheet Export Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Spreadsheet Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={exportXLSX}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download XLSX{" "}
                          <span className="text-xs ml-1">(Recommended)</span>
                        </Button>
                                                     <Button onClick={exportCSV} className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                    </div>

                    {/* Contact Export Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Contact Export
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={exportBulkVCF} className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download VCF
                        </Button>
                        <div className="relative group">
                          <Button
                            onClick={() =>
                              generateQR(processedContacts[0], true)
                            }
                            className="w-full opacity-50 cursor-not-allowed"
                            disabled={true}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Scan QR
                          </Button>
                          {/* Hover tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-premium-black text-premium-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            QR codes are only available in single mode
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-premium-black"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-premium-beige">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-premium-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-premium-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-premium-border">
            <div className="flex items-center">
              <img 
                src="/logo-black.png" 
                alt="Super Scanner Logo" 
                className="h-8 w-8 mr-3 object-contain"
              />
              <h1 className="text-lg font-bold text-premium-black">Super Scanner</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-premium-gray hover:bg-premium-beige hover:text-premium-black transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-premium-border">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-premium-orange rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-premium-white">
                  {user ? (user.firstName?.[0] || 'U') : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-premium-black truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'User Account'}
                </p>
                <p className="text-xs text-premium-gray truncate">
                  {user?.currentPlan?.name || 'Free Plan'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-premium-black text-premium-white shadow-md'
                      : 'text-premium-gray hover:bg-premium-beige hover:text-premium-black'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? 'text-premium-white' : 'text-premium-gray'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-premium-border">
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center px-3 py-3 text-premium-gray hover:bg-premium-orange-muted hover:text-premium-orange-dark rounded-lg transition-all duration-200 text-sm font-medium"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-premium-white shadow-sm border-b border-premium-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <img 
                src="/logo-black.png" 
                alt="Super Scanner Logo" 
                className="h-8 w-8 mr-3 object-contain"
              />
              <h1 className="text-xl font-bold text-premium-black">Super Scanner</h1>
            </div>

            {/* Navigation Items - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-black text-white shadow-md'
                        : 'text-premium-gray hover:bg-premium-beige hover:text-premium-black'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mr-2 ${activeTab === item.id ? 'text-white' : 'text-premium-gray'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* User Profile and Actions - Desktop */}
            <div className="flex items-center space-x-4">
              {/* User Info - Desktop */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="h-8 w-8 bg-premium-orange rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-premium-white">
                    {user ? (user.firstName?.[0] || 'U') : 'U'}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-premium-black">
                    {user ? `${user.firstName} ${user.lastName}` : 'User Account'}
                  </p>
                  <p className="text-xs text-premium-gray">
                    {user?.currentPlan?.name || 'Free Plan'}
                  </p>
                </div>
              </div>

              {/* Logout Button - Desktop */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center px-3 py-2 text-premium-gray hover:bg-premium-orange-muted hover:text-premium-orange-dark rounded-lg transition-all duration-200 text-sm font-medium"
                title="Logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-premium-gray hover:bg-premium-beige hover:text-premium-black transition-colors duration-200"
                title="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>

      {/* QR Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Contact QR Code
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to save this contact to your phone
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4">
            {qrData ? (
              <>
                <div className="bg-premium-beige p-4 rounded-lg">
                  <img
                    src={qrData}
                    alt="QR Code"
                    className="w-full h-auto mx-auto"
                  />
                </div>

                <p className="text-sm text-premium-gray">
                  📱 Scan this QR code with your phone's camera or contact app to save this contact
                </p>
              </>
            ) : (
              <div className="text-premium-gray-light py-8">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>Generating QR code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessCardApp;
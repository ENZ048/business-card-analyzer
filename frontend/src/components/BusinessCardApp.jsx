import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  DialogTrigger,
} from "./ui/dialog";

const BusinessCardApp = () => {
  // State management
  const [mode, setMode] = useState("single");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [bulkImages, setBulkImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
  const [ws, setWs] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrMode, setQrMode] = useState("single"); // "single" or "bulk"
  const [userId] = useState("abc123"); // In real app, this would come from auth

  // Refs
  const fileInputRef = useRef(null);
  const backFileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:5000?userId=${userId}`);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("🔔 WS message:", data); // add debug log

      switch (data.type) {
        case "ocr-progress":
          // backend sends { percent }, not { progress }
          setProgress(data.percent);
          break;
        case "ocr-error":
          // backend sends { message }, not { error }
          console.error("OCR Error:", data.message);
          setIsProcessing(false);
          break;
        case "ocr-complete":
          // backend sends { data }, not { contacts }
          // Add sourceMode to each contact based on current mode
          const contactsWithMode = (data.data || []).map((contact) => ({
            ...contact,
            sourceMode: mode,
          }));
          setProcessedContacts(contactsWithMode);
          setIsProcessing(false);
          setProgress(100);
          break;
        default:
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, [userId]);

  // File handling functions
  const handleFileSelect = (files, isBulk = false) => {
    if (isBulk) {
      const fileArray = Array.from(files);
      setBulkImages(fileArray);
    } else {
      if (files.length > 0) {
        setFrontImage(files[0]);
      }
      if (files.length > 1) {
        setBackImage(files[1]);
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
    if (!frontImage) return;

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("mode", "single");
    formData.append("frontImage", frontImage);
    if (backImage) {
      formData.append("backImage", backImage);
    }

    // Debug logging
    console.log("Single Card FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await fetch("http://localhost:5000/api/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("OCR processing failed");
      }

      // Progress will be handled by WebSocket
    } catch (error) {
      console.error("Error processing card:", error);
      setIsProcessing(false);
    }
  };

  const processBulkCards = async () => {
    if (bulkImages.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("mode", "bulk");
    bulkImages.forEach((image) => {
      formData.append("files", image);
    });

    // Debug logging
    console.log("Bulk Upload FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await fetch("http://localhost:5000/api/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Bulk OCR processing failed");
      }

      // Progress will be handled by WebSocket
    } catch (error) {
      console.error("Error processing bulk cards:", error);
      setIsProcessing(false);
    }
  };

  // Export functions
  const exportVCF = async (contact) => {
    try {
      const response = await fetch("http://localhost:5000/api/export/vcf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${contact.fullName || "contact"}.vcf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting VCF:", error);
    }
  };

  const exportBulkVCF = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/export/vcf-bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contacts: processedContacts }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.vcf";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting bulk VCF:", error);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/export/csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: processedContacts,
          fields: selectedFields,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const exportXLSX = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/export/xlsx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contacts: processedContacts,
          fields: selectedFields,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts.xlsx";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting XLSX:", error);
    }
  };

  const generateQR = async (contact, isBulk = false) => {
    try {
      const requestBody = isBulk
        ? { contacts: processedContacts }
        : { contact };

      const response = await fetch("http://localhost:5000/api/export/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setQrData(data.qrData || "");
        setQrMode(isBulk ? "bulk" : "single");
        setQrModalOpen(true);
      }
    } catch (error) {
      console.error("Error generating QR:", error);
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
      setProcessedContacts([]);
      setProgress(0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 bg-clip-text text-transparent mb-2 pb-4"
            style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
          >
            Business Card Analyzer
          </h1>
          <p className="text-xl text-slate-600">
            Extract and manage contact information with AI-powered OCR
          </p>
          <p className="text-sm text-slate-500 mt-2">
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
          <div className="w-full max-w-md mx-auto">
            <div className="relative bg-slate-200 rounded-full p-1 shadow-inner">
              {/* Moving gradient indicator */}
              <motion.div
                className="absolute inset-y-1 w-1/2 rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 shadow-lg"
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
                        mode === "single" ? "text-white" : "text-slate-600"
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
                        mode === "bulk" ? "text-white" : "text-slate-600"
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
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                  Upload Business Card
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Front Image */}
                  <div>
                    <label className="block text-slate-700 mb-2 font-medium">
                      Front Image *
                    </label>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
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
                          <p className="text-slate-600 text-sm">
                            {frontImage.name}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <CloudUpload className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-slate-600">
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
                    <label className="block text-slate-700 mb-2 font-medium">
                      Back Image (Optional)
                    </label>
                    <div
                      className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
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
                          <p className="text-slate-600 text-sm">
                            {backImage.name}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <CloudUpload className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-slate-600">
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
                  className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing... {progress}%
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg"
                  >
                    <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                      Edit Contact Information
                    </h2>

                    {processedContacts.map((contact, index) => (
                      <div key={index} className="space-y-6">
                        {/* Source Mode Label */}
                        {contact.sourceMode && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                              Source:
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                contact.sourceMode === "single"
                                  ? "bg-blue-100 text-blue-700"
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
                            <label className="block text-slate-700 mb-2 font-medium">
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
                            <label className="block text-slate-700 mb-2 font-medium">
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
                          <label className="block text-slate-700 mb-2 font-medium">
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
                          <label className="block text-slate-700 mb-2 font-medium">
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
                          <label className="block text-slate-700 mb-2 font-medium">
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
                          <label className="block text-slate-700 mb-2 font-medium">
                            Websites
                          </label>
                          <Input
                            value={
                              contact.websites ||
                              (Array.isArray(contact.websites)
                                ? contact.websites[0]
                                : "") ||
                              ""
                            }
                            onChange={(e) =>
                              updateContact(index, "websites", e.target.value)
                            }
                            placeholder="Enter website URL"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 mb-2 font-medium">
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
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <Button
                      onClick={() => exportVCF(processedContacts[0])}
                      className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download VCF
                      </Button>
                                          <Button
                      onClick={() => generateQR(processedContacts[0], false)}
                      className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg"
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan QR
                      </Button>
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
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                  Bulk Upload
                </h2>

                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
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
                            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-slate-600">
                        {bulkImages.length} images selected
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CloudUpload className="w-12 h-12 text-slate-400 mx-auto" />
                      <p className="text-slate-600 text-lg">
                        Drop multiple images here or click to select
                      </p>
                      <p className="text-slate-500 text-sm">
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
                  className="w-full mt-6 bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing... {progress}%
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg"
                  >
                    <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                      Select Fields to Export
                    </h2>

                    {/* Source Mode Summary */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-700">
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
                                    ? "bg-blue-100 text-blue-700"
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
                            <span className="text-slate-700 capitalize font-medium">
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
                                                     <Button onClick={exportCSV} className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg">
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
                          <Button onClick={exportBulkVCF} className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg">
                            <Download className="w-4 h-4 mr-2" />
                            Download VCF
                          </Button>
                          <Button
                            onClick={() =>
                              generateQR(processedContacts[0], true)
                            }
                            className="w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 hover:from-blue-800 hover:via-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg"
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
          )}
        </AnimatePresence>
      </div>

      {/* QR Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {qrMode === "bulk" ? "Bulk Contacts QR Code" : "Contact QR Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            {qrData ? (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={qrData}
                    alt="QR Code"
                    className="w-full h-auto mx-auto"
                  />
                </div>

                {/* Instructions based on mode */}
                {qrMode === "bulk" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      📱 Scan this QR code with your phone's camera or contact
                      app
                    </p>
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Note: Some phones may only save the first contact when
                      scanning bulk QR codes
                    </p>
                    <Button
                      onClick={exportBulkVCF}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      📥 Download All Contacts (Recommended for bulk)
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    📱 Scan this QR code to save this contact
                  </p>
                )}
              </>
            ) : (
              <div className="text-slate-500 py-8">
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

import React, { useState } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const formData = new FormData();
    for (let file of files) formData.append("cards", file);

    try {
      const res = await axios.post("http://localhost:5000/api/ocr/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data.data);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("OCR failed. Check backend logs.");
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...results];
    if (field === "phoneNumbers" || field === "emails") {
      updated[index][field] = value.split(",").map((v) => v.trim());
    } else {
      updated[index][field] = value;
    }
    setResults(updated);
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Full Name", "Title", "Company", "Phones", "Emails", "Website", "Address"];
    const csvRows = [
      headers.join(","), // header row
      ...results.map((r) =>
        [
          r.fullName,
          r.title,
          r.company,
          (r.phoneNumbers || []).join("; "),
          (r.emails || []).join("; "),
          r.website,
          r.address,
        ]
          .map((v) => `"${v || ""}"`) // quote values
          .join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "business_cards.csv";
    a.click();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Business Card OCR Tool</h1>

      <input
        type="file"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Upload & Process
      </button>
      <button
        onClick={handleExportCSV}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Export CSV
      </button>

      <div className="mt-6 space-y-6">
        {results.map((r, i) => (
          <div key={i} className="border rounded p-4 shadow">
            <h2 className="font-semibold mb-2">{r.filename}</h2>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="block font-semibold">Full Name:</span>
                <input
                  type="text"
                  value={r.fullName || ""}
                  onChange={(e) => handleChange(i, "fullName", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label>
                <span className="block font-semibold">Title:</span>
                <input
                  type="text"
                  value={r.title || ""}
                  onChange={(e) => handleChange(i, "title", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label>
                <span className="block font-semibold">Company:</span>
                <input
                  type="text"
                  value={r.company || ""}
                  onChange={(e) => handleChange(i, "company", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label>
                <span className="block font-semibold">Phone(s):</span>
                <input
                  type="text"
                  value={(r.phoneNumbers || []).join(", ")}
                  onChange={(e) => handleChange(i, "phoneNumbers", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label>
                <span className="block font-semibold">Email(s):</span>
                <input
                  type="text"
                  value={(r.emails || []).join(", ")}
                  onChange={(e) => handleChange(i, "emails", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label>
                <span className="block font-semibold">Website:</span>
                <input
                  type="text"
                  value={r.website || ""}
                  onChange={(e) => handleChange(i, "website", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
              <label className="col-span-2">
                <span className="block font-semibold">Address:</span>
                <textarea
                  value={r.address || ""}
                  onChange={(e) => handleChange(i, "address", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </label>
            </div>

            <p className="mt-2">
              <strong>Logos:</strong> {r.logos && r.logos.length > 0 ? r.logos.join(", ") : "—"}
            </p>

            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">Raw OCR Text</summary>
              <pre className="text-sm whitespace-pre-wrap mt-2">{r.rawText}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

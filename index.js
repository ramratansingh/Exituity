import fs from "fs";
import path from "path";
import csvParser from "csv-parser";

const synonymMap = {
  revenue: ["revenue", "turnover", "sales", "income"],
  net_profit: ["net profit", "profit after tax", "net income", "net earnings"],
  growth_rate: ["growth rate", "year over year growth", "yoy growth", "revenue growth"],
};

function normalizeString(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function getStandardKey(inputKey = "") {
  const normalized = normalizeString(inputKey);
  for (const [standardKey, synonyms] of Object.entries(synonymMap)) {
    if (synonyms.some((s) => normalizeString(s) === normalized)) {
      return standardKey;
    }
  }
  return null;
}

function parseJSON(inputData) {
  const result = { revenue: null, net_profit: null, growth_rate: null };
  for (const [key, value] of Object.entries(inputData)) {
    const standardKey = getStandardKey(key);
    if (standardKey) result[standardKey] = value;
  }
  return result;
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const result = { revenue: null, net_profit: null, growth_rate: null };
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        for (const [key, value] of Object.entries(row)) {
          const standardKey = getStandardKey(key);
          if (standardKey) result[standardKey] = value;
        }
      })
      .on("end", () => resolve(result))
      .on("error", reject);
  });
}

function parseText(text) {
  const result = { revenue: null, net_profit: null, growth_rate: null };
  const lines = text.split("\n");
  for (const line of lines) {
    const [keyPart, valuePart] = line.split(":");
    if (keyPart && valuePart) {
      const standardKey = getStandardKey(keyPart.trim());
      if (standardKey) result[standardKey] = valuePart.trim();
    }
  }
  return result;
}

async function extractAndNormalize(inputData, format) {
  switch (format) {
    case "json":
      return parseJSON(inputData);
    case "csv":
      return await parseCSV(inputData);
    case "text":
      return parseText(inputData);
    default:
      throw new Error("Unsupported input format");
  }
}

(async () => {
  const jsonInput = {
    Turnover: "5000000",
    "Net Profit": "2000000",
    "YoY Growth": "5%",
  };

  const textInput = `
  Turnover: 5000000
  Net Profit: 2000000
  YoY Growth: 5%
  `;

  const csvFilePath = path.join(process.cwd(), "test.csv");
  fs.writeFileSync(csvFilePath, "Turnover,Net Profit,YoY Growth\n5000000,2000000,5%");

  console.log("JSON Output:", await extractAndNormalize(jsonInput, "json"));
  console.log("Text Output:", await extractAndNormalize(textInput, "text"));
  console.log("CSV Output:", await extractAndNormalize(csvFilePath, "csv"));
})();

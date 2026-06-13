import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Dynamic check and creation of local storage folder
const userdataDir = path.join(process.cwd(), "userdata");
if (!fs.existsSync(userdataDir)) {
  fs.mkdirSync(userdataDir, { recursive: true });
}

// Increase payload bounds for handling image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Serve custom user images and metadata statically
app.use("/userdata", express.static(userdataDir));

// API endpoint to upload a customized card config and image
app.post("/api/upload-card", (req, res) => {
  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: "Missing required configuration state" });
    }

    // Generate a unique 9-char card ID
    const cardId = Math.random().toString(36).substring(2, 11);
    
    let savedPortraitUrl = config.personalPortraitUrl;

    // Check if there is an uploaded base64 data URL to write to disk
    if (config.portraitSrc === "personal" && config.personalPortraitUrl && config.personalPortraitUrl.startsWith("data:")) {
      try {
        const matches = config.personalPortraitUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split("/")[1] || "jpg";
          const buffer = Buffer.from(matches[2], "base64");
          const filename = `${cardId}.${extension}`;
          const filePath = path.join(userdataDir, filename);
          
          fs.writeFileSync(filePath, buffer);
          
          // Set the accessible url endpoint path
          savedPortraitUrl = `/userdata/${filename}`;
        }
      } catch (imgError) {
        console.error("Error saving uploaded image to file system:", imgError);
        return res.status(500).json({ error: "Failed to persist uploaded image file" });
      }
    }

    // Prepare complete serialized configuration
    const savedConfig = {
      ...config,
      personalPortraitUrl: savedPortraitUrl
    };

    // Save final JSON config file
    fs.writeFileSync(path.join(userdataDir, `${cardId}.json`), JSON.stringify(savedConfig, null, 2));

    return res.json({ success: true, cardId });
  } catch (error) {
    console.error("Server error handling card creation upload:", error);
    return res.status(500).json({ error: "An unexpected server error occurred writing card state" });
  }
});

// API endpoint to retrieve custom greeting configuration
app.get("/api/card/:id", async (req, res) => {
  try {
    const cardId = req.params.id;
    const configPath = path.join(userdataDir, `${cardId}.json`);

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      return res.json(JSON.parse(data));
    }

    // Fallback sync from development environment to shared site dynamic proxy
    const host = req.headers.host || "";
    if (host.includes("ais-pre-")) {
      const devHost = host.replace("ais-pre-", "ais-dev-");
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const devUrl = `${protocol}://${devHost}/api/card/${cardId}`;
      console.log(`Config not found on pre-production. Fetching from dev fallback: ${devUrl}`);
      try {
        const fetchRes = await fetch(devUrl);
        if (fetchRes.ok) {
          const fetchedData = await fetchRes.json();
          fs.writeFileSync(configPath, JSON.stringify(fetchedData, null, 2));
          return res.json(fetchedData);
        }
      } catch (fetchErr) {
        console.error("Failed to fetch card config from dev fallback:", fetchErr);
      }
    }

    return res.status(404).json({ error: "Birthday card not found or has expired" });
  } catch (error) {
    console.error("Server error retrieving custom card data:", error);
    return res.status(500).json({ error: "Server error reading card state" });
  }
});

// Serve custom user images with fallback sync from development environment
app.get("/userdata/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(userdataDir, filename);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Dynamic asset fetch from dev-container
    const host = req.headers.host || "";
    if (host.includes("ais-pre-")) {
      const devHost = host.replace("ais-pre-", "ais-dev-");
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const devUrl = `${protocol}://${devHost}/userdata/${filename}`;
      console.log(`Media asset not found on pre-production. Fetching from dev container: ${devUrl}`);
      try {
        const fetchRes = await fetch(devUrl);
        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(filePath, buffer);
          res.setHeader("Content-Type", fetchRes.headers.get("content-type") || "image/jpeg");
          return res.send(buffer);
        }
      } catch (fetchErr) {
        console.error("Failed to pull asset image file from dev container:", fetchErr);
      }
    }
    
    return res.status(404).send("File not found");
  } catch (error) {
    console.error("Error in userdata fallback proxy:", error);
    return res.status(500).send("Server error fetching media");
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Integrate SPA UI Bundles & Development Vite middleware
async function setupFrontend() {
  if (process.env.NODE_ENV !== "production") {
    // In dev: mount Vite dev server as middleware helper
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as custom middleware");
  } else {
    // In production: serve built bundle assets statically from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production assets statically from", distPath);
  }
}

setupFrontend().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running actively on http://localhost:${PORT}`);
  });
});

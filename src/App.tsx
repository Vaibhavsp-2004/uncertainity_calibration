import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardPage } from "@/pages/DashboardPage";
import { DatasetPage } from "@/pages/DatasetPage";
import { DatabasePage } from "@/pages/DatabasePage";
import { SearchPage } from "@/pages/SearchPage";
import { IngestPage } from "@/pages/IngestPage";
import { LivePage } from "@/pages/LivePage";
import { LoginPage } from "@/pages/LoginPage";
import { PresentationGuidePage } from "@/pages/PresentationGuidePage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-ink text-paper">
        <Navbar />
        <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 py-8 relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/database" element={<DatabasePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/ingest" element={<IngestPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/guide" element={<PresentationGuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

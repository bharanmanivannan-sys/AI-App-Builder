import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [insights, setInsights] = useState(null);
  const [actions, setActions] = useState([]);
  const [demoVisible, setDemoVisible] = useState(null); // null=auto
  const [loading, setLoading] = useState(true);

  const q = useCallback(() => (demoVisible === null ? {} : { include_demo: demoVisible }), [demoVisible]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [d, c, ins, act] = await Promise.all([
        api.get("/dashboard", { params: q() }),
        api.get("/competitors", { params: q() }),
        api.get("/insights"),
        api.get("/actions"),
      ]);
      setDashboard(d.data);
      setCompetitors(c.data);
      setInsights(ins.data && Object.keys(ins.data).length ? ins.data : null);
      setActions(act.data);
    } finally {
      setLoading(false);
    }
  }, [user, q]);

  useEffect(() => { if (user) loadAll(); }, [user, demoVisible, loadAll]);

  const generateInsights = async () => {
    const { data } = await api.post("/insights/generate", null, { params: q() });
    setInsights(data);
    const act = await api.get("/actions");
    setActions(act.data);
    return data;
  };

  const setActionStatus = async (id, status) => {
    setActions((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
    await api.patch(`/actions/${id}`, { status });
  };

  return (
    <DataContext.Provider
      value={{
        dashboard, competitors, insights, actions, loading,
        demoVisible, setDemoVisible, loadAll, generateInsights, setActionStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

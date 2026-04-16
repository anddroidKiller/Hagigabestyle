import { create } from 'zustand';
import { siteSettingsApi } from '../services/api';

interface SiteSettingsStore {
  isMaintenanceMode: boolean;
  loaded: boolean;
  fetchStatus: () => Promise<void>;
  setMaintenance: (value: boolean) => void;
}

export const useSiteSettingsStore = create<SiteSettingsStore>((set) => ({
  isMaintenanceMode: false,
  loaded: false,

  fetchStatus: async () => {
    try {
      const data = await siteSettingsApi.getStatus();
      set({ isMaintenanceMode: data.isMaintenanceMode, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setMaintenance: (value) => set({ isMaintenanceMode: value }),
}));

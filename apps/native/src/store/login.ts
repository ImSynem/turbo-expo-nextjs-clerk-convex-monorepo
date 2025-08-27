import { create } from 'zustand';

interface LoginStore {
  email: string;
  setEmail: (email: string) => void;
  resetEmail: () => void;
}

export const useLoginStore = create<LoginStore>((set) => ({
  email: '',
  setEmail: (email: string) => set({ email }),
  resetEmail: () => set({ email: '' }),
}));

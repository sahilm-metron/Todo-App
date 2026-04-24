import { createContext, useContext, type ReactNode } from "react";
import { TaskStore } from "./task/TaskStore";

export class RootStore {
  taskStore: TaskStore;

  constructor(initialData?: { tasks?: TaskStore["tasks"] }) {
    this.taskStore = new TaskStore(initialData?.tasks ?? []);
  }
}

const StoreContext = createContext<RootStore | undefined>(undefined);

interface RootStoreProviderProps {
  store: RootStore;
  children: ReactNode;
}

export function RootStoreProvider({ store, children }: RootStoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useRootStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useRootStore must be used within a RootStoreProvider");
  }
  return context;
}

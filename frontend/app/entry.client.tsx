import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { RootStore, RootStoreProvider } from "./store/RootStore";

const store = new RootStore();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RootStoreProvider store={store}>
        <HydratedRouter />
      </RootStoreProvider>
    </StrictMode>,
  );
});

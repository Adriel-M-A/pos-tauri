import { Toaster } from "sonner";
import MainLayout from "./layout/MainLayout";

function App() {
  return (
    <>
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          duration: 4000,
          className: "rounded-none border-border font-sans font-medium shadow-sm bg-white text-text-primary",
          style: { borderRadius: '0px' }
        }}
      />
      <MainLayout />
    </>
  );
}

export default App;

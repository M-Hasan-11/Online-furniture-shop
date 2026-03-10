import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.2, 0.82, 0.23, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileBottomNav />
      <Footer />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

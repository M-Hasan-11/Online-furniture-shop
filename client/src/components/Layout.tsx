import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}

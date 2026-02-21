import { Outlet } from "react-router";
import Header from "./Header";

function AppLayout() {
  return (
    <div>
      <Header />
      <div className="bg-stone-100 h-full">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;

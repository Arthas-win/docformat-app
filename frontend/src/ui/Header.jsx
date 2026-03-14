import { NavLink } from "react-router";
import Logo from "./Logo";

function Header() {
  const link ="px-3 py-2 rounded-md text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition";

  const active = "text-blue-600 font-semibold";

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center justify-between h-16">

          <li className="flex items-center overflow-hidden h-10">
            <div className="h-10 w-auto flex items-center">
              <Logo />
            </div>
          </li>

          <div className="flex items-center gap-6 text-sm md:text-base">

            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${link} ${isActive ? active : ""}`
                }
              >
                Головна
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/format/title"
                className={({ isActive }) =>
                  `${link} ${isActive ? active : ""}`
                }
              >
                Створення титульної
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/format"
                className={({ isActive }) =>
                  `${link} ${isActive ? active : ""}`
                }
              >
                Форматування
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/docs"
                className={({ isActive }) =>
                  `${link} ${isActive ? active : ""}`
                }
              >
                Документація
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/privacy"
                className={({ isActive }) =>
                  `${link} ${isActive ? active : ""}`
                }
              >
                Політика даних
              </NavLink>
            </li>

          </div>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
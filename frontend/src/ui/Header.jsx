import { NavLink } from "react-router";
import Logo from "./Logo";

function Header() {
  return (
    <header>
      <nav>
        <ul className="flex flex-row justify-between items-center text-xl px-3 py-1 border border-stone-400/50 shadow">
          <Logo />
          <li>
            <NavLink to="/" className="text-md md:text-xl">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/format/title">Format Title</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;

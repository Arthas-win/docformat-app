import { Link } from "react-router";

function NavButton({ children, to }) {
  return (
    <li>
      <Link to={to}>{children}</Link>
    </li>
  );
}

export default NavButton;

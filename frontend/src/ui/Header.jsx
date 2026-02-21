import Logo from "./Logo";
import NavButton from "./NavButton";

function Header() {
  return (
    <header>
      <nav>
        <ul className="flex flex-row justify-between items-center text-xl px-6 py-3">
          <Logo />
          <NavButton>Home</NavButton>
          <NavButton to="/format/title">Fromat Title</NavButton>
        </ul>
      </nav>
    </header>
  );
}

export default Header;

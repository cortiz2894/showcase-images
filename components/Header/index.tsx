import Container from "../Container/index";

export const Header = () => {
  return (
    <Container>
      <header className="pt-5 md:pt-8 pb-5 md:pb-8">
        <nav className="w-full flex justify-between">
          <div className="">
            <img src="/logo_white.svg" />
          </div>
          {/* <button className="px-4 py-2 border-2 border-white/50 rounded-lg text-white text-sm hover:border-white hover:bg-white/10 transition-all duration-200 ease-in-out">
            Go to site
          </button> */}
        </nav>
      </header>
    </Container>
  );
};
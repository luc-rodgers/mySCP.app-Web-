export function AppLoading() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-8"
      style={{ backgroundColor: "#030213" }}
    >
      <img src="/myscp.jpeg" alt="MySCP" className="w-36 h-auto rounded-xl opacity-95" />
      <div className="w-6 h-6 border-2 border-white/20 border-t-[#d42b2b] rounded-full animate-spin" />
    </div>
  );
}

"use client";

export default function DemoButton() {
  const handleDemoClick = () => {
    document.getElementById("demo-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={handleDemoClick}
      className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
    >
      Watch Demo
    </button>
  );
}

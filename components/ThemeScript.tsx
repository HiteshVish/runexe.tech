import Script from "next/script";

export function ThemeScript() {
  return (
    <Script id="runexe-theme" strategy="beforeInteractive">
      {`(function(){
  try {
    var stored = localStorage.getItem('runexe-theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`}
    </Script>
  );
}
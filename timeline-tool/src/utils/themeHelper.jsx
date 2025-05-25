import { useEffect, useState } from 'react';

export default function ThemeToggleSlider() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.body.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className="theme-toggle">
      <label className="toggle-wrapper">
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
        />
        <span className="slider-thumb"></span>
      </label>
    </div>
  );
}

import React from 'react';

export default function WelcomeBanner() {
  return (
    <section className="welcome-card">
      <div className="welcome-info">
        <h2>أهلاً بكِ يا نرمين 🌸✨</h2>
        <p>استمعي لأفضل الإذاعات المصرية بث مباشر بجودة عالية، احفظي إذاعاتكِ المفضلة واستمتعي بأجمل الأوقات.</p>
      </div>
      <div className="welcome-decor">
        <div className="radio-waves">
          <span></span><span></span><span></span>
        </div>
      </div>
    </section>
  );
}

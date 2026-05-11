import React from "react";
import { Link } from "react-router-dom";
import "../index.css";

export default function AuthSplitLayout({ title, subtitle, children }) {
  return (
    <div className="authShell">
      <aside className="authBrand">
        <div className="authBrandInner">
          <div className="brandMark">BR</div>
          <h1 className="brandTitle">BIGGI REWARDS</h1>
          <p className="brandSub">
            Predict letters, win rewards. Results every Sunday 22:00.
          </p>
          <div className="brandCard">
            <div className="brandCardTitle">How it works</div>
            <ul className="brandList">
              <li>Pick 9 letters (A–Z)</li>
              <li>Results reveal 5 letters</li>
              <li>Match any 3-in-a-row to win</li>
            </ul>
          </div>
          <div className="brandFoot">Powered by Biggi ecosystem</div>
        </div>
      </aside>

      <main className="authMain">
        <div className="authCard">
          <div className="authHead">
            <div className="authKicker">Biggi Rewards</div>
            <h2 className="authTitle">{title}</h2>
            {subtitle ? <p className="authSubtitle">{subtitle}</p> : null}
          </div>
          {children}
          <div className="authLinks">
            <Link to="/">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}


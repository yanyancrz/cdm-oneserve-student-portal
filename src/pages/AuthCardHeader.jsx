import { Link } from "react-router-dom";
import CdmLogo from "../assets/images/cdm-logo.png";

export default function AuthCardHeader({ page }) {
    const registering = page === "register";

    return (
        <header className="auth-envelope">
            <div className="auth-masthead">
                <img src={CdmLogo} alt="" className="auth-logo" />
                <div>
                    <p className="text-xs font-semibold text-[#106A2E]">CDM OneServe</p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {registering ? "Create account" : "Sign in"}
                    </h1>
                </div>
            </div>
            <nav aria-label="Account access" className="auth-tabs" data-page={page}>
                <Link to="/" aria-current={registering ? undefined : "page"}>Log In</Link>
                <Link to="/register" aria-current={registering ? "page" : undefined}>Register</Link>
            </nav>
        </header>
    );
}

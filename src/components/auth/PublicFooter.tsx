import Logo from "../../assets/FleetGo.png";

export function PublicFooter() {
  return (
    <footer className="border-t mt-8" style={{ borderColor: "rgba(17, 131, 224, 0.2)" }}>
      <div
        className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-10"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2">
            <img src={Logo} alt="Logistiq Innovations" className="h-9 w-auto" />
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            AI-powered platform for smarter trucking and fleet operations.
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h4 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            Platform
          </h4>
          <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            {[
              { href: "https://logistiqinnovations.ca/ai", label: "AI Platform" },
              { href: "https://logistiqinnovations.ca/manifest", label: "Manifest" },
              { href: "https://logistiqinnovations.ca/compliance", label: "Compliance" },
              { href: "https://logistiqinnovations.ca/driver-app", label: "Driver App" },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company links */}
        <div>
          <h4 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            Company
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://logistiqinnovations.ca/contact"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Contact
              </a>
            </li>
            <li>
              <a
                href="https://portal.logistiqinnovations.ca/"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Customer login
              </a>
            </li>
          </ul>
        </div>

        {/* Get started */}
        <div>
          <h4 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            Get started
          </h4>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
            Ready to modernize your fleet?
          </p>
          <a
            href="https://logistiqinnovations.ca/contact"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200"
            style={{ backgroundColor: "var(--accent-navyblue)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0d6fc7")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--accent-navyblue)")
            }
          >
            Start free trial
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t py-6 text-center text-xs"
        style={{
          borderColor: "rgba(17, 131, 224, 0.2)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-main)",
        }}
      >
        © {new Date().getFullYear()} Logistiq Innovations. All rights reserved.
      </div>
    </footer>
  );
}

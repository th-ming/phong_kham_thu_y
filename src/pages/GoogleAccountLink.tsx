import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  iss?: string;
  aud?: string;
}

const mockAccounts = [
  { username: "nguyenvana", password: "pass123", role: "customer", hoTen: "Nguyễn Văn A" },
  { username: "admin", password: "admin123", role: "admin", hoTen: "Admin Rexi" },
  { username: "staff", password: "staff123", role: "staff", hoTen: "Nhân viên Rexi" },
];

const GoogleAccountLink: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = window.sessionStorage.getItem("pending_google_user");
    if (!stored) {
      navigate("/dang-nhap");
      return;
    }
    const user = JSON.parse(stored);
    user.iss = "https://accounts.google.com";
    user.aud = "rexi-phong-kham-thu-y.apps.googleusercontent.com";
    setGoogleUser(user);
  }, [navigate]);

  const createNewAccount = async () => {
    if (!googleUser) return;
    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newAccount = {
      id: `google_${Date.now()}`,
      email: googleUser.email,
      hoTen: googleUser.name,
      username: `google_${Date.now()}`,
      role: "customer",
      vaiTro: "khach-hang",
      google_login: true,
      google_user: googleUser,
      created_at: new Date().toISOString(),
    };

    window.localStorage.setItem("user", JSON.stringify(newAccount));
    window.sessionStorage.removeItem("pending_google_user");
    setSuccess(true);
    
    setTimeout(() => {
      navigate("/khach-hang/dashboard");
    }, 500);
  };

  const handleLinkExisting = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    const account = mockAccounts.find(
      (acc) => acc.username === username && acc.password === password,
    );

    if (!account) {
      setError("❌ Tên đăng nhập hoặc mật khẩu không đúng.");
      setIsLoading(false);
      return;
    }

    const linkedAccount = {
      id: account.username,
      email: googleUser?.email || "",
      hoTen: account.hoTen,
      username: account.username,
      role: account.role,
      vaiTro: account.role === "admin" ? "quan-ly" : account.role === "staff" ? "nhan-vien" : "khach-hang",
      google_login: true,
      google_user: googleUser,
      linked_at: new Date().toISOString(),
    };

    window.localStorage.setItem("user", JSON.stringify(linkedAccount));
    window.sessionStorage.removeItem("pending_google_user");
    setSuccess(true);

    setTimeout(() => {
      if (account.role === "admin") {
        navigate("/quan-ly/dashboard");
      } else if (account.role === "staff") {
        navigate("/quan-ly/dashboard");
      } else {
        navigate("/khach-hang/dashboard");
      }
    }, 500);
  };

  if (!googleUser) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 20px", background: "var(--gray-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>
        {success && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ background: "white", borderRadius: "24px", padding: "48px 32px", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>✓</div>
              <h2 style={{ margin: 0, marginBottom: "8px", color: "var(--ink)" }}>Đăng nhập thành công!</h2>
              <p style={{ margin: 0, color: "var(--gray-600)" }}>Đang chuyển hướng...</p>
            </div>
          </div>
        )}

        <div style={{ background: "white", borderRadius: "28px", boxShadow: "var(--shadow)", padding: "40px", animation: "slideUp 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: 56, height: 56, objectFit: "contain" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "var(--teal)" }}>Rexi</h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--gray-600)", fontWeight: 600 }}>Phòng khám thú y</p>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", padding: "20px", background: "var(--teal-light)", borderRadius: "20px", border: "1px solid #b2e8e2"
          }}>
            <img src={googleUser.picture} alt={googleUser.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: "2px" }}>{googleUser.name}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--gray-600)" }}>{googleUser.email}</div>
            </div>
            <span style={{ fontSize: "20px" }}>✓</span>
          </div>

          <div style={{ fontSize: "0.95rem", color: "var(--gray-600)", marginBottom: "28px", lineHeight: "1.6" }}>
            Tài khoản Google của bạn đã được xác minh. Chọn một trong hai tùy chọn dưới:
          </div>

          <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={createNewAccount}
              disabled={isLoading || success}
              style={{
                width: "100%",
                background: "var(--teal)",
                color: "white",
                border: "none",
                borderRadius: "16px",
                padding: "14px",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: isLoading || success ? "not-allowed" : "pointer",
                opacity: isLoading || success ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => !isLoading && !success && (e.currentTarget.style.background = "var(--teal-dark)")}
              onMouseLeave={(e) => !isLoading && !success && (e.currentTarget.style.background = "var(--teal)")}
            >
              {isLoading && !showLinkForm ? "⏳ Đang xử lý..." : "+ Tạo tài khoản mới"}
            </button>

            {!showLinkForm && (
              <button
                onClick={() => setShowLinkForm(true)}
                disabled={isLoading || success}
                style={{
                  width: "100%",
                  background: "white",
                  border: "2px solid var(--teal)",
                  color: "var(--teal)",
                  borderRadius: "16px",
                  padding: "14px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: isLoading || success ? "not-allowed" : "pointer",
                  opacity: isLoading || success ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => !isLoading && !success && (e.currentTarget.style.background = "var(--teal-light)")}
                onMouseLeave={(e) => !isLoading && !success && (e.currentTarget.style.background = "white")}
              >
                🔗 Liên kết với tài khoản đã có
              </button>
            )}
          </div>

          {showLinkForm && (
            <form onSubmit={handleLinkExisting} style={{ animation: "slideDown 0.3s ease" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "0.9rem" }}>👤 Tên đăng nhập</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: nguyenvana"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid var(--gray-200)",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "0.9rem" }}>🔐 Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid var(--gray-200)",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  required
                />
              </div>
              {error && <div style={{ marginBottom: "14px", fontSize: "0.9rem", color: "#c0392b", fontWeight: 600 }}>{error}</div>}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: "var(--teal-dark)",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  transition: "all 0.2s",
                  marginBottom: "14px",
                }}
              >
                {isLoading ? "⏳ Đang xác thực..." : "✓ Liên kết tài khoản"}
              </button>
              <button
                type="button"
                onClick={() => { setShowLinkForm(false); setError(null); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "var(--gray-600)",
                  padding: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Quay lại
              </button>
            </form>
          )}

          {!showLinkForm && (
            <div style={{ marginTop: "24px", padding: "16px", background: "#f0f7f5", borderRadius: "12px", fontSize: "0.85rem", color: "var(--gray-600)", borderLeft: "3px solid var(--teal)" }}>
              <strong>💡 Demo:</strong><br />
              Admin: <code style={{ color: "var(--teal)", fontWeight: 700 }}>admin / admin123</code><br />
              Customer: <code style={{ color: "var(--teal)", fontWeight: 700 }}>nguyenvana / pass123</code>
            </div>
          )}

          <div style={{ marginTop: "28px", textAlign: "center", paddingTop: "20px", borderTop: "1px solid var(--gray-200)" }}>
            <Link to="/dang-nhap" style={{ color: "var(--teal)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          input:disabled { background: var(--gray-50); }
          button:disabled { opacity: 0.6 !important; }
        `}</style>
      </div>
    </div>
  );
};

export default React.memo(GoogleAccountLink);

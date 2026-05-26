import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { normalizeUserRole } from "@utils/index";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  iss?: string;
  aud?: string;
}

const GoogleAccountLink: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    setError(null);

    try {
      // Gửi TOKEN JWT của Google để tạo tài khoản mới an toàn
      const token = window.sessionStorage.getItem("pending_google_token");
      const res = await axiosInstance.post("/api/auth/google-register", {
        token: token
      });

      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("user", JSON.stringify(res.data.user));
      window.sessionStorage.removeItem("pending_google_user");
      window.sessionStorage.removeItem("pending_google_token");
      setSuccess(true);

      setTimeout(() => navigate("/khach-hang/dashboard"), 500);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng!");
      } else {
        setError(err.response?.data?.message || "Lỗi tạo tài khoản mới.");
      }
      setIsLoading(false);
    }
  };

  const handleLinkExisting = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = window.sessionStorage.getItem("pending_google_token");
      const res = await axiosInstance.post("/api/auth/google-link", {
        username,
        password,
        token: token
      });

      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("user", JSON.stringify(res.data.user));
      window.sessionStorage.removeItem("pending_google_user");
      window.sessionStorage.removeItem("pending_google_token");
      setSuccess(true);

      setTimeout(() => {
        navigate(normalizeUserRole(res.data.user) === 'khach_hang' ? "/khach-hang/dashboard" : "/quan-ly/dashboard");
      }, 500);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng!");
      } else {
        setError(err.response?.data?.message || "❌ Tên đăng nhập hoặc mật khẩu không đúng.");
      }
      setIsLoading(false);
    }
  };

  if (!googleUser) {
    return null;
  }

  return (
    <div className="google-link-page" style={{ minHeight: "100vh", padding: "40px 20px", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)", colorScheme: "normal" }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>
        {success && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "48px 32px", textAlign: "center", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>✓</div>
              <h2 style={{ margin: 0, marginBottom: "8px", color: "#1e293b" }}>Đăng nhập thành công!</h2>
              <p style={{ margin: 0, color: "#64748b" }}>Đang chuyển hướng...</p>
            </div>
          </div>
        )}

        <div style={{ background: "#ffffff", borderRadius: "28px", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)", border: "1px solid #e2e8f0", padding: "40px", animation: "slideUp 0.4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            {/* avatar logo ở trang liên kết google */}
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: 56, height: 56, objectFit: "contain" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#0d9488" }}>Rexi</h1>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Phòng khám thú y</p>
            </div>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px", padding: "20px", background: "#e6f4ea", borderRadius: "20px", border: "1px solid #b2e8e2"
          }}>
            <img src={googleUser.picture} alt={googleUser.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: "2px" }}>{googleUser.name}</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{googleUser.email}</div>
            </div>
            <span style={{ fontSize: "20px" }}>✓</span>
          </div>

          <div style={{ fontSize: "0.95rem", color: "#64748b", marginBottom: "28px", lineHeight: "1.6" }}>
            Tài khoản Google của bạn đã được xác minh. Chọn một trong hai tùy chọn dưới:
          </div>

          <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
            <button data-ai-id="button-googleaccountlink-6nph"
              onClick={createNewAccount}
              disabled={isLoading || success}
              style={{
                width: "100%",
                background: "#0d9488",
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
              onMouseEnter={(e) => !isLoading && !success && (e.currentTarget.style.background = "#0f766e")}
              onMouseLeave={(e) => !isLoading && !success && (e.currentTarget.style.background = "#0d9488")}
            >
              {isLoading && !showLinkForm ? "⏳ Đang xử lý..." : "+ Tạo tài khoản mới"}
            </button>

            {!showLinkForm && (
              <button data-ai-id="button-googleaccountlink-ype6"
                onClick={() => setShowLinkForm(true)}
                disabled={isLoading || success}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "2px solid #0d9488",
                  color: "#0d9488",
                  borderRadius: "16px",
                  padding: "14px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: isLoading || success ? "not-allowed" : "pointer",
                  opacity: isLoading || success ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => !isLoading && !success && (e.currentTarget.style.background = "#e6f4ea")}
                onMouseLeave={(e) => !isLoading && !success && (e.currentTarget.style.background = "transparent")}
              >
                🔗 Liên kết với tài khoản đã có
              </button>
            )}
          </div>

          {showLinkForm && (
            <form onSubmit={handleLinkExisting} style={{ animation: "slideDown 0.3s ease" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>👤 Tên đăng nhập</label>
                <input data-ai-id="input-googleaccountlink-148d"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: nguyenvana"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#1e293b",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>🔐 Mật khẩu</label>
                <div style={{ position: "relative" }}>
                  <input data-ai-id="input-googleaccountlink-82dm"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "12px 48px 12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      color: "#1e293b",
                      fontSize: "0.95rem",
                      boxSizing: "border-box",
                      opacity: isLoading ? 0.6 : 1,
                    }}
                    required
                  />
                  <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8", userSelect: "none", zIndex: 10 }}>
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </div>
              </div>
              {error && <div style={{ marginBottom: "14px", fontSize: "0.9rem", color: "#c0392b", fontWeight: 600 }}>{error}</div>}
              <button data-ai-id="button-googleaccountlink-psea"
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: "#0f766e",
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
              <button data-ai-id="button-googleaccountlink-rz40"
                type="button"
                onClick={() => { setShowLinkForm(false); setError(null); }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
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
            <div style={{ marginTop: "24px", padding: "16px", background: "#e6f4ea", borderRadius: "12px", fontSize: "0.85rem", color: "#64748b", borderLeft: "3px solid #0d9488" }}>
              <strong>💡 Ghi chú:</strong><br />
              Nếu bạn đã từng khám ở Rexi, hãy liên kết tài khoản để đồng bộ dữ liệu. Nếu chưa, hãy tạo tài khoản mới để bắt đầu.
            </div>
          )}

          <div style={{ marginTop: "28px", textAlign: "center", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
            <Link to="/dang-nhap" style={{ color: "#0d9488", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>
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
          .google-link-page input:disabled { background: #f8fafc; }
          [data-theme='dark'] .google-link-page {
            background: #020617 !important;
            color: #e5eefb !important;
            color-scheme: dark;
          }
          [data-theme='dark'] .google-link-page > div > div {
            background: #0f172a !important;
            border-color: rgba(20, 184, 166, 0.24) !important;
            color: #f8fafc !important;
            box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45) !important;
          }
          [data-theme='dark'] .google-link-page h2 { color: #f8fafc !important; }
          [data-theme='dark'] .google-link-page p { color: #94a3b8 !important; }
          [data-theme='dark'] .google-link-page input {
            background: #111827 !important;
            border-color: rgba(20, 184, 166, 0.28) !important;
            color: #f8fafc !important;
          }
          [data-theme='dark'] .google-link-page input::placeholder { color: #94a3b8 !important; }
          [data-theme='dark'] .google-link-page input:disabled { background: #111827 !important; }
          button:disabled { opacity: 0.6 !important; }
        `}</style>
      </div>
    </div>
  );
};

export default React.memo(GoogleAccountLink);

import re

def search_accounts():
    try:
        with open(r'd:\QLy Phòng Khám Thú Y\PhongKhamThuY.sql', 'r', encoding='utf-16', errors='ignore') as f:
            content = f.read()
            print("Total size:", len(content))
            
            # Find lines matching TaiKhoan insert
            lines = content.split('\n')
            
            print("\n--- TAI KHOAN INSERTS ---")
            tk_inserts = [line for line in lines if "dbo.TaiKhoan" in line]
            for tk in tk_inserts[:15]:
                print(tk[:250])
                
            print("\n--- KHACH HANG INSERTS ---")
            kh_inserts = [line for line in lines if "dbo.KhachHang" in line]
            for kh in kh_inserts[:15]:
                print(kh[:250])
                
            print("\n--- NHAN VIEN INSERTS ---")
            nv_inserts = [line for line in lines if "dbo.NhanVien" in line]
            for nv in nv_inserts[:15]:
                print(nv[:250])
    except Exception as e:
        print("Error:", e)

search_accounts()

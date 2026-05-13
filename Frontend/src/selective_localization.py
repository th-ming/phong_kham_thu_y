import os

# CHỈ ĐỔI NHỮNG TỪ KỸ THUẬT, GIỮ NGUYÊN CHATBOT VÀ MEMECAT
mappings = {
    "RevealSection": "HieuUngHienDan",
    "Typewriter": "ChuChay",
    "LottiePlayer": "TrinhPhatLottie",
    "ScrollToTop": "CuonLenDau",
    "TransparentVideo": "VideoTrongSuot",
    "CustomCursor": "ConTroChuot",
    "SpecialEffects": "HieuUngDacBiet"
}

root_dir = r"d:\QLy Phòng Khám Thú Y\Frontend\src"

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            file_path = os.path.join(subdir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old_name, new_name in mappings.items():
                new_content = new_content.replace(old_name, new_name)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Selective Update: {file_path}")

print("--- SELECTIVE LOCALIZATION COMPLETED! ---")

import os

mappings = {
    "RobotTroChuyen": "ChatBot",
    "HieuUngHienDan": "RevealSection",
    "ChuChay": "Typewriter",
    "TrinhPhatLottie": "LottiePlayer",
    "CuonLenDau": "ScrollToTop",
    "MeoMeme": "MemeCat",
    "VideoTrongSuot": "TransparentVideo",
    "HieuUngDacBiet": "SpecialEffects"
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
                print(f"Updated: {file_path}")

print("--- REVERT COMPLETED SUCCESSFULLY! ---")

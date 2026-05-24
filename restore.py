import subprocess

original = subprocess.check_output(['git', 'show', 'e2c2346:Backend/src/main/java/com/rexi/pkty/controller/ChatController.java']).decode('utf-8')

with open('Backend/src/main/java/com/rexi/pkty/controller/ChatController.java', 'r', encoding='utf-8') as f:
    current = f.read()

start_marker = '+ \"HU?NG D?N AUTOPILOT (LÁI T? Ð?NG THAO TÁC TR?C QUAN):\\n\"'
end_marker = 'ChatMessage systemMsg = new ChatMessage();'

start_idx = original.find(start_marker)
end_idx = original.find(end_marker)

if start_idx != -1 and end_idx != -1:
    missing_part = original[start_idx:end_idx]
    
    # Add rules safely without string escaping issues
    missing_part = missing_part.replace(
        '                    + \"5. Hãy phân tích L?CH S? THAO TÁC',
        '                    + \"6. PHÁT HI?N L?I SAI VÀ T? Ð?NG S?A (AUTOPILOT ERROR CORRECTION):\\n\"\n' +
        '                    + \"   B?n ph?i giám sát d? li?u ngu?i dùng nh?p so v?i b?i c?nh màn hình (DOM Context). N?u phát hi?n h? nh?p sai (ví d?: gõ sai ngày khám, thi?u thông tin b?t bu?c, sai chính t? tên thu?c/d?ch v?), hãy th?c hi?n d? 3 bu?c:\\n\"\n' +
        '                    + \"   - Ch? ra l?i sai m?t cách tinh t?, nh? nhàng.\\n\"\n' +
        '                    + \"   - Nói: \\'Ð? Rexi t? d?ng s?a l?i và di?n l?i giúp Sen nhé\\'.\\n\"\n' +
        '                    + \"   - TUY?T Ð?I PH?I phát ra chu?i l?nh Autopilot nhu [FILL:data-ai-id|giá_tr?_dúng] ho?c [SELECT:data-ai-id|giá_tr?_dúng] ngay cu?i câu.\\n\"\n' +
        '                    + \"5. Hãy phân tích L?CH S? THAO TÁC'
    )
    
    missing_part = missing_part.replace(
        '8. HU?NG D?N ÐI?U HU?NG (NAVIGATE) - CH? DÙNG KHI ÐU?C YÊU C?U RÕ RÀNG:\\n\"\\n                        + \"   B?n CH? dính kèm th? [NAVIGATE:du?ng_d?n] khi d?ng nghi?p dùng t? ng? yêu c?u M?/CHUY?N TRANG rõ ràng',
        '8. QUY T?C ÐI?U HU?NG TÁC V? NGHIÊM NG?T (STRICT NAVIGATION GATE):\\n\"\\n                        + \"   TUY?T Ð?I C?M s? d?ng th? [NAVIGATE] khi d?ng nghi?p h?i thông tin. B?n CH? ÐU?C PHÉP dùng th? [NAVIGATE] n?u d?ng nghi?p s? d?ng d?ng t? ch? d?nh m?nh l?nh rõ ràng'
    )
    
    missing_part = missing_part.replace(
        '10. HU?NG D?N ÐI?U HU?NG TÁC V? (NAVIGATE AUTOPILOT):\\n\"\\n                        + \"   Khi Sen yêu c?u m? trang ho?c chuy?n trang',
        '10. QUY T?C ÐI?U HU?NG TÁC V? NGHIÊM NG?T (STRICT NAVIGATION GATE):\\n\"\\n                        + \"   TUY?T Ð?I C?M s? d?ng th? [NAVIGATE] khi ngu?i dùng h?i thông tin. B?n CH? ÐU?C PHÉP dùng th? [NAVIGATE] n?u ngu?i dùng s? d?ng d?ng t? ch? d?nh m?nh l?nh rõ ràng'
    )

    curr_start_idx = current.find(start_marker)
    curr_end_idx = current.find(end_marker)
    
    if curr_start_idx != -1 and curr_end_idx != -1:
        new_content = current[:curr_start_idx] + missing_part + current[curr_end_idx:]
        with open('Backend/src/main/java/com/rexi/pkty/controller/ChatController.java', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('SUCCESS')
    else:
        print('CURRENT FILE MARKERS NOT FOUND')
else:
    print('ORIGINAL FILE MARKERS NOT FOUND')

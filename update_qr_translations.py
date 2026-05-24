import json

def update_json(filepath, updates):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for page, page_data in updates.items():
        if page not in data:
            data[page] = {}
        for k, v in page_data.items():
            if isinstance(v, dict) and k in data[page] and isinstance(data[page][k], dict):
                data[page][k].update(v)
            else:
                data[page][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_updates = {
    "ForgotPasswordPage": {
        "fields": {
            "identifier": "Email or Phone Number"
        },
        "placeholders": {
            "identifier": "e.g. user@example.com or +201000000000"
        }
    },
    "ConfirmationPage": {
        "qr": {
            "loading": "Loading QR...",
            "unavailable": "QR unavailable",
            "instruction": "Show this QR code at the clinic for fast check-in."
        }
    }
}

ar_updates = {
    "ForgotPasswordPage": {
        "fields": {
            "identifier": "البريد الإلكتروني أو رقم الهاتف"
        },
        "placeholders": {
            "identifier": "مثال: user@example.com أو +201000000000"
        }
    },
    "ConfirmationPage": {
        "qr": {
            "loading": "جاري تحميل رمز الاستجابة...",
            "unavailable": "الرمز غير متاح",
            "instruction": "أظهر هذا الرمز في العيادة لتسريع الدخول."
        }
    }
}

update_json('frontend/messages/en.json', en_updates)
update_json('frontend/messages/ar.json', ar_updates)
print("QR Translations updated successfully.")

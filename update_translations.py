import json

def update_json(filepath, updates):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Merge updates
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
    "LoginPage": {
        "fields": {
            "identifier": "Email or Phone Number",
            "password": "Password"
        },
        "placeholders": {
            "identifier": "e.g. user@example.com or +201000000000",
            "password": "••••••••"
        },
        "actions": {
            "forgotPassword": "Forgot password?",
            "loginPassword": "Log In with Password",
            "back": "Back to login options"
        },
        "or": "or",
        "verifyTitle": "Verify your code",
        "verifyBody": "We've sent a 4-digit code to {identifier}",
        "otpSent": "Login code sent to {phone}"
    },
    "RegisterPage": {
        "fields": {
            "identifier": "Email or Phone Number",
            "passwordOptional": "Password (Optional)",
            "preferredChannel": "Preferred Notification Channel"
        },
        "placeholders": {
            "password": "Set a password for future logins",
            "identifier": "e.g. user@example.com or +201000000000"
        },
        "verifyTitle": "Verify your account",
        "verifyBody": "We've sent a 4-digit code to your preferred channel."
    },
    "ForgotPasswordPage": {
        "title": "Reset Password",
        "subtitle": "Enter your email or phone number to receive a reset link.",
        "successTitle": "Check your messages",
        "tryAnother": "Try another email or phone number",
        "actions": {
            "submit": "Send Reset Link"
        }
    },
    "ResetPasswordPage": {
        "title": "Create New Password",
        "subtitle": "Enter your reset token and your new secure password.",
        "successTitle": "Password Updated",
        "redirecting": "Redirecting to login...",
        "fields": {
            "token": "Reset Token",
            "newPassword": "New Password"
        },
        "placeholders": {
            "token": "Paste token here",
            "newPassword": "••••••••"
        },
        "actions": {
            "submit": "Update Password"
        }
    }
}

ar_updates = {
    "LoginPage": {
        "fields": {
            "identifier": "البريد الإلكتروني أو رقم الهاتف",
            "password": "كلمة المرور"
        },
        "placeholders": {
            "identifier": "مثال: user@example.com أو +201000000000",
            "password": "••••••••"
        },
        "actions": {
            "forgotPassword": "هل نسيت كلمة المرور؟",
            "loginPassword": "الدخول بكلمة المرور",
            "back": "العودة لخيارات الدخول"
        },
        "or": "أو",
        "verifyTitle": "تأكيد الرمز",
        "verifyBody": "أرسلنا رمزاً من 4 أرقام إلى {identifier}",
        "otpSent": "تم إرسال رمز الدخول إلى {phone}"
    },
    "RegisterPage": {
        "fields": {
            "identifier": "البريد الإلكتروني أو رقم الهاتف",
            "passwordOptional": "كلمة المرور (اختياري)",
            "preferredChannel": "وسيلة التواصل المفضلة"
        },
        "placeholders": {
            "password": "ضع كلمة مرور للدخول مستقبلاً",
            "identifier": "مثال: user@example.com أو +201000000000"
        },
        "verifyTitle": "تأكيد الحساب",
        "verifyBody": "أرسلنا رمزاً من 4 أرقام إلى وسيلة التواصل المفضلة لديك."
    },
    "ForgotPasswordPage": {
        "title": "استعادة كلمة المرور",
        "subtitle": "أدخل بريدك الإلكتروني أو رقم الهاتف لاستلام رابط الاستعادة.",
        "successTitle": "راجع رسائلك",
        "tryAnother": "جرب بريداً أو رقماً آخر",
        "actions": {
            "submit": "إرسال رابط الاستعادة"
        }
    },
    "ResetPasswordPage": {
        "title": "كلمة مرور جديدة",
        "subtitle": "أدخل رمز الاستعادة وكلمة المرور الجديدة.",
        "successTitle": "تم تحديث كلمة المرور",
        "redirecting": "جاري التوجيه لتسجيل الدخول...",
        "fields": {
            "token": "رمز الاستعادة",
            "newPassword": "كلمة المرور الجديدة"
        },
        "placeholders": {
            "token": "ضع الرمز هنا",
            "newPassword": "••••••••"
        },
        "actions": {
            "submit": "تحديث كلمة المرور"
        }
    }
}

update_json('frontend/messages/en.json', en_updates)
update_json('frontend/messages/ar.json', ar_updates)
print("Translations updated successfully.")

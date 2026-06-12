export const ar = {
    "accountStatus": {
        "archived": {
            "body": "هذا الحساب مؤرشف ولم يعد بإمكانه الوصول إلى ميزات المنصة المحمية. تواصل مع الدعم للمساعدة.",
            "title": "تمت أرشفة الحساب"
        },
        "suspended": {
            "body": "تم تعليق وصول حسابك مؤقتاً. تواصل مع الدعم إذا كنت بحاجة إلى مساعدة أو تعتقد أن هذا تم بالخطأ.",
            "title": "تم تعليق الحساب"
        }
    },
    "admin": {
        "backToSite": "Back to site",
        "debug": {
            "accessTest": "اختبار وصول المسؤول",
            "bypassingClient": "التجاوز عن عميل Supabase JS تماماً - استخدام الجلب الخام",
            "clientProblem": "هذا يعني أن سياسات RLS بخير، لكن عميل JS به مشكلة.",
            "directQueries": "استعلامات Supabase المباشرة (بدون React Query)",
            "executionLog": "سجل التنفيذ:",
            "queryHanging": "الاستعلام معلق. قد يشير إلى مشكلة سياسة RLS تسبب حلقات لا نهائية أو مشكلة شبكة.",
            "queryWorks": "استعلام قاعدة البيانات يعمل. المشكلة في React Query أو دورة حياة المكون.",
            "requestTimedOut": "استغرق الطلب أكثر من 5 ثوان. مشكلة في الشبكة أو قاعدة البيانات.",
            "restApiTest": "اختبار REST API المباشر",
            "rlsBlocking": "RLS يحجب الاستعلام. حسابك غير معترف به كمسؤول.",
            "successMsg": "يعمل REST API بشكل مباشر. المشكلة في عميل Supabase JS."
        },
        "subtitle": "System Control Center",
        "tabs": {
            "disputes": "Disputes",
            "jobs": "Jobs",
            "overview": "Overview",
            "payments": "Payments",
            "reports": "Reports",
            "settings": "Settings",
            "users": "Users",
            "verifications": "Verification"
        },
        "title": "Admin Dashboard"
    },
    "auth": {
        "accountPanel": {
            "adminDashboard": "لوحة الإدارة",
            "clientDesc": "انشر مشاريع، قارن العروض، وحرر مدفوعات الضمان.",
            "clientFeatureEscrow": "مدفوعات محمية بالضمان",
            "clientFeaturePostProjects": "انشر المشاريع مجاناً",
            "clientFeatureReviewProposals": "راجع عروضاً موثقة",
            "clientHint": "أنهِ أساسيات العميل هنا أولاً، ثم أدر الفوترة وتفاصيل الشركة في الإعدادات.",
            "clientLabel": "عميل",
            "completeSetup": "إكمال الإعداد",
            "current": "الحالي",
            "darkTheme": "المظهر الداكن",
            "defaultUser": "مستخدم خدمة",
            "enable": "تفعيل",
            "enableBothAction": "Enable both roles",
            "enableBothDesc": "Access client hiring dashboard and freelancer profile under a single credentials login.",
            "enableBothLabel": "Enable both workspace roles",
            "freelancerDesc": "ابحث عن عمل، أرسل عروضاً، واقبض بالدينار التونسي.",
            "freelancerFeatureBrowseJobs": "تصفح الوظائف والتقدم لها",
            "freelancerFeaturePortfolio": "أنشئ معرض أعمال عام",
            "freelancerFeatureReceivePayments": "استلم المدفوعات بالدينار التونسي",
            "freelancerHint": "أكمل البيانات الأساسية للمستقل هنا، ثم صقل البقية لاحقاً في الإعدادات.",
            "freelancerLabel": "مستقل",
            "goToWorkspace": "الانتقال إلى {{workspace}}",
            "language": "اللغة",
            "logoutAction": "تسجيل الخروج",
            "logoutDesc": "إنهاء هذه الجلسة بأمان على هذا الجهاز.",
            "manageProfile": "إدارة الملف الشخصي",
            "needsSetup": "يحتاج إلى إعداد",
            "onlineForMessages": "متصل للرسائل",
            "profileAction": "الملف الشخصي",
            "progressLabel": "اكتمال الملف",
            "ready": "جاهز",
            "sectionLabel": "مساحة العمل",
            "settingsAction": "الإعدادات",
            "setupInFiveMinutes": "أكمل الإعداد خلال 5 دقائق",
            "statusPending": "قيد الانتظار",
            "statusPro": "احترافي",
            "switchAction": "تبديل",
            "switchError": "لم نتمكن من تبديل مساحة عملك حالياً.",
            "switchInstantly": "بدّل فوراً",
            "switchOver": "التبديل الآن",
            "switchWorkspace": "تبديل مساحة العمل",
            "switchWorkspaceBoth": "استخدم نفس الحساب للتوظيف والعمل الحر دون تسجيلات دخول منفصلة.",
            "switchWorkspaceSingle": "فعل مساحة العمل الثانية فقط عندما تحتاجها فعلياً.",
            "switchedClient": "مساحة عمل العميل نشطة الآن.",
            "switchedFreelancer": "مساحة عمل المستقل نشطة الآن.",
            "switching": "جاري التبديل",
            "tools": "أدوات الحساب",
            "walletAndEarnings": "المحفظة والأرباح",
            "workspaceActive": "مساحة العمل الحالية"
        },
        "both": "الاثنان",
        "client": "عميل",
        "completeProfile": "إكمال التسجيل",
        "confirmPassword": "تأكيد كلمة المرور",
        "confirmPasswordPlaceholder": "أعد إدخال كلمة المرور",
        "createAccount": "إنشاء حساب",
        "email": "البريد الإلكتروني",
        "emailExists": "هذا البريد الإلكتروني مسجل بالفعل",
        "emailNotConfirmed": "البريد الإلكتروني غير مفعل",
        "emailPlaceholder": "أدخل بريدك الإلكتروني",
        "forgotPassword": "نسيت كلمة المرور؟",
        "forgotPasswordForm": {
            "error": "حدث خطأ أثناء إرسال الرابط",
            "rateLimited": "تم تجاوز عدد المحاولات. حاول مرة أخرى لاحقاً.",
            "sendTitle": "إرسال رابط إعادة التعيين",
            "sent": "تم إرسال رابط إعادة التعيين"
        },
        "freelancer": "مستقل",
        "googleLogin": "المتابعة بواسطة Google",
        "googleLoginError": "فشل تسجيل الدخول عبر Google",
        "hasAccount": "لديك حساب بالفعل؟",
        "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        "invalidEmail": "أدخل بريداً إلكترونياً صحيحاً",
        "loggingOut": "جارٍ تسجيل الخروج...",
        "login": "تسجيل الدخول",
        "loginSubtitle": "أهلاً بعودتك. عملك في انتظارك.",
        "loginTitle": "سجّل الدخول إلى خدمة",
        "noAccount": "ليس لديك حساب؟",
        "or": "أو",
        "password": {
            "hide": "إخفاء كلمة المرور",
            "label": "كلمة المرور",
            "new": "New Password",
            "show": "إظهار كلمة المرور"
        },
        "passwordMinLength": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        "passwordMismatch": "كلمتا المرور غير متطابقتين",
        "passwordPlaceholder": {
            "new": "Enter your new password"
        },
        "passwordRequirements": {
            "req1": "• At least 8 characters",
            "req2": "• At least one uppercase letter",
            "req3": "• At least one lowercase letter",
            "req4": "• At least one number",
            "title": "Password Requirements:"
        },
        "passwordStrength": {
            "label": "Password strength",
            "medium": "متوسطة",
            "strong": "قوية",
            "weak": "ضعيفة"
        },
        "passwordValidation": {
            "lowercase": "يجب أن تحتوي على حرف صغير واحد على الأقل",
            "minLength": "كلمة مرور يجب أن تكون 8 أحرف على الأقل",
            "number": "يجب أن تحتوي على رقم واحد على الأقل",
            "uppercase": "يجب أن تحتوي على حرف كبير واحد على الأقل"
        },
        "phone": "رقم الهاتف",
        "phonePlaceholder": "أدخل رقم هاتفك",
        "resendCode": "إعادة إرسال الرمز",
        "resendIn": "إعادة الإرسال خلال",
        "resetPassword": {
            "error": "حدث خطأ أثناء تغيير كلمة المرور",
            "expiredLink": "Expired Link",
            "invalidLinkDesc": "Invalid reset link.",
            "linkExpired": "رابط إعادة التعيين منتهي الصلاحية",
            "redirecting": "Redirecting to login...",
            "requestNewLink": "Request New Link",
            "setNew": "Set New Password",
            "setNewDesc": "Enter your new password",
            "setNewTitle": "تعيين كلمة المرور الجديدة",
            "success": "تم تغيير كلمة المرور بنجاح",
            "successDesc": "You can now log in with your new password."
        },
        "seconds": "ثانية",
        "selectUserType": "كيف ستستخدم خدمة؟",
        "selectUserTypeSubtitle": "يمكنك دائماً إضافة الدور الآخر لاحقاً من الإعدادات.",
        "sendCode": "إرسال رمز التحقق",
        "sessionExpired": "Your session has expired. Please sign in again.",
        "signOut": "تسجيل الخروج",
        "signup": "إنشاء حساب",
        "signupSubtitle": "انضم لأكثر من 2500 محترف يبنون مسيرتهم على خدمة.",
        "signupTitle": "أنشئ حسابك",
        "socialProof": "professionals already on WorkedIn",
        "userTypeBothDesc": "أقوم بالاثنين — أعمل وأوظف",
        "userTypeClientDesc": "لدي مشاريع وأحتاج محترفين موثوقين",
        "userTypeFreelancerDesc": "أقدم مهارات وأريد أجراً على عملي",
        "validation": {
            "invalidEmail": "أدخ�\u001e بر�`د إ�\u001eْتر��� �` صح�`ح",
            "password": {
                "lowercase": "Must contain at least one lowercase letter",
                "match": "Passwords do not match",
                "minLength": "Password must be at least 8 characters",
                "number": "Must contain at least one number",
                "uppercase": "Must contain at least one uppercase letter"
            }
        },
        "verify": "تحقق",
        "verifyCode": "رمز التحقق"
    },
    "authPages": {
        "login": {
            "badge": "سوق توظيف موثوق",
            "createAccountAction": "إنشاء حساب",
            "featureCards": {
                "escrow": {
                    "sub": "الأموال محفوظة حتى التسليم",
                    "title": "مدفوعات بالضمان"
                },
                "local": {
                    "sub": "محسن لتونس",
                    "title": "محلي وعالمي"
                },
                "verified": {
                    "sub": "كل هوية مؤكدة",
                    "title": "ملفات موثقة"
                }
            },
            "finishingSignIn": "إنهاء دخولك",
            "finishingSignInDescription": "نحن نؤكد جلستك الآمنة وننقلك إلى مساحة العمل الصحيحة.",
            "form": {
                "createOne": "إنشاء حساب",
                "emailLabel": "البريد الإلكتروني",
                "forgotPassword": "هل نسيت كلمة المرور؟",
                "google": "المتابعة باستخدام Google",
                "noAccount": "ليس لديك حساب؟",
                "orEmail": "أو سجّل الدخول بالبريد الإلكتروني",
                "passwordLabel": "كلمة المرور",
                "signInButton": "تسجيل الدخول →",
                "signingIn": "جارٍ تسجيل الدخول...",
                "subtitle": "سجّل الدخول إلى مساحة عمل WorkedIn.",
                "welcomeBack": "مرحباً بعودتك."
            },
            "hero": {
                "earnFairly": "واكسب بعدل.",
                "workSmarter": "اعمل بذكاء."
            },
            "heroDescription": "تدفق مصادقة أهدأ للعملاء والموظفين المستقلين، مع حالات أوضح، دفعات موثوقة، وتبديل مساحات عمل يبقى بعيداً عن طريقك.",
            "heroTitle": "سجل الدخول بدون الفوضى واعد إلى العمل بسرعة.",
            "highlightLocaleDescription": "تدفقات اللغة العربية والفرنسية والإنجليزية معدلة للعمل الحر المحلي.",
            "highlightLocaleTitle": "مبني لتونس",
            "highlightPaymentsDescription": "تدفقات الضمان أولاً تحافظ على توافق دفعات العميل وتسليم الموظف المستقل.",
            "highlightPaymentsTitle": "مدفوعات آمنة",
            "highlightTrustDescription": "تبقى الملفات الشخصية والعقود وإشارات التحقق مرئية عبر مساحة عملك.",
            "highlightTrustTitle": "هويات موثقة",
            "platformSubtitle": "تواصل مع المواهب الموثقة، أدر مشاريعك بأمان، واحصل على مدفوعاتك بالدينار التونسي — في كل مرة.",
            "platformTagline": "منصة العمل الحر التونسية",
            "rateLimitError": "عدد محاولات كثير جداً. يرجى المحاولة مرة أخرى لاحقاً."
        },
        "signup": {
            "alreadyHaveAccount": "هل لديك حساب بالفعل؟",
            "badge": "أطلق مساحة عملك",
            "confirmPasswordLabel": "تأكيد كلمة المرور",
            "continueWithGoogle": "المتابعة باستخدام Google",
            "createAccountButton": "إنشاء حساب →",
            "creatingAccount": "جارٍ إنشاء الحساب...",
            "emailLabel": "البريد الإلكتروني",
            "emailPlaceholder": "example@example.com",
            "featureCards": {
                "escrow": {
                    "sub": "الأموال محفوظة حتى التسليم",
                    "title": "مدفوعات بالضمان"
                },
                "local": {
                    "sub": "محسن لتونس",
                    "title": "محلي وعالمي"
                },
                "verified": {
                    "sub": "كل هوية مؤكدة",
                    "title": "ملفات موثقة"
                }
            },
            "formSubtitle": "انضم إلى أكثر من 2500 محترف في WorkedIn",
            "formTitle": "إنشاء حسابك",
            "heroDescription": "اختر دورك، قم بإعداد مساحة عملك، وانتقل إلى الإعداد باستخدام تجربة مصادقة أنظف وأكثر تركيزاً.",
            "heroTitle": "قم بإنشاء انطباع أول أقوى لكل مشروع تبدأه.",
            "heroTitleAccent": "القادم الكبير؟",
            "heroTitleTop": "جاهز لمشروعك",
            "highlightRoleDescription": "ابدأ كعميل أو موظف مستقل وصل إلى مساحة العمل الصحيحة من الخطوة الأولى.",
            "highlightRoleTitle": "إعداد قائم على الدور",
            "highlightTrustDescription": "التحقق وفحوصات الهوية وبنية الملف الشخصي مدمجة في الرحلة.",
            "highlightTrustTitle": "إشارات الثقة جاهزة",
            "highlightWorkDescription": "انتقل من التسجيل إلى نشر الوظائف وبناء ملف شخصي وإغلاق العقود بسرعة أكبر.",
            "highlightWorkTitle": "معد للعمل الحقيقي",
            "orSignUpWithEmail": "أو سجّل بالبريد الإلكتروني",
            "passwordLabel": "كلمة المرور",
            "rateLimitError15Min": "عدد محاولات كثير جداً. يرجى المحاولة مرة أخرى في 15 دقيقة.",
            "rateLimitErrorMinutes": "عدد محاولات كثير جداً. يرجى المحاولة مرة أخرى في {{minutes}} دقيقة.",
            "signInAction": "تسجيل الدخول",
            "signInLink": "تسجيل الدخول",
            "validation": {
                "passwordLowercase": "يجب أن تحتوي على حرف واحد على الأقل بأحرف صغيرة",
                "passwordMinLength": "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
                "passwordNumber": "يجب أن تحتوي على رقم واحد على الأقل",
                "passwordUppercase": "يجب أن تحتوي على حرف واحد على الأقل بأحرف كبيرة"
            }
        }
    },
    "auto": {
        "escrow_not_funded_ye": "الضمان لم يتم تمويله بعد"
    },
    "categories": {
        "availableJobs": "مهمة متاحة",
        "contentWriting": "كتابة محتوى",
        "dataEntry": "إدخال بيانات",
        "digitalMarketing": "تسويق رقمي",
        "graphicDesign": "تصميم جرافيكي",
        "mobileApp": "برمجة تطبيقات",
        "photography": "تصوير",
        "title": "التخصصات",
        "translation": "ترجمة",
        "uiux": "تصميم UI/UX",
        "videoEditing": "مونتاج فيديو",
        "webDev": "برمجة مواقع"
    },
    "clientProfile": {
        "activeJobs": "الوظائف النشطة المنشورة",
        "addDescription": "+ إضافة وصف",
        "apply": "التقديم",
        "avgRatingLabel": "متوسط التقييم",
        "businessOwner": "صاحب عمل",
        "by": "بواسطة",
        "client": "عميل",
        "companyInformation": "معلومات الشركة",
        "companyWebsite": "موقع الشركة الإلكتروني",
        "completedContractsLabel": "العقود المكتملة",
        "copied": "تم النسخ!",
        "exitPreview": "الخروج من المعاينة",
        "hiringAndStats": "التوظيف والإحصائيات",
        "hiringNeeds": "احتياجات التوظيف",
        "hiringPreferences": "تفضيلات وتفاصيل التوظيف",
        "hiringStatus": "حالة التوظيف",
        "jobsPostedCount": {
            "one": "وظيفة واحدة منشورة",
            "other": "{{count}} وظيفة منشورة"
        },
        "jobsPostedLabel": "الوظائف المنشورة",
        "linksTitle": "الروابط والموارد",
        "localTime": "التوقيت المحلي {{time}}",
        "locationLabel": "الموقع",
        "memberSinceLabel": "عضو منذ",
        "myProjects": "مشاريعي",
        "noActiveJobs": "لا توجد وظائف نشطة منشورة بعد",
        "noActiveJobsDesc": "انشر المشاريع، وأطلق المهام المرحلية، وتعاون مع أفضل المستقلين.",
        "noBio": "لم يتم تقديم سيرة ذاتية أو تفاصيل حول العمل بعد.",
        "noCompanyDetails": "لم يتم إضافة تفاصيل الشركة بعد.",
        "noLinks": "لم يتم إضافة روابط بعد.",
        "noReviewsYet": "لا توجد تقييمات بعد. أكمل أول عقد لك مع مستقل لتلقي التقييمات.",
        "notFound": "العميل غير موجود",
        "notFoundDesc": "هذا الملف الشخصي غير موجود أو تم حذفه.",
        "paymentVerified": "طريقة الدفع موثقة",
        "postFirstJob": "انشر أول وظيفة لك",
        "postJob": "نشر وظيفة",
        "previewDesc": "أنت تشاهد ملفك الشخصي كما يراه المستخدمون الآخرون.",
        "previewTitle": "معاينة الملف الشخصي العام",
        "proposalsCount": {
            "one": "عرض واحد",
            "other": "{{count}} عروض"
        },
        "reviewsCount": {
            "one": "تقييم واحد",
            "other": "{{count}} تقييمات"
        },
        "settings": "الإعدادات",
        "share": "مشاركة",
        "specializedIn": "متخصص في {{industry}}",
        "standardStatus": "قياسي",
        "totalSpentLabel": "إجمالي الإنفاق",
        "upTo": "يصل إلى",
        "verifications": {
            "identity": "الهوية موثقة",
            "payment": "طريقة الدفع",
            "phone": "رقم الهاتف"
        },
        "verificationsTitle": "التوثيقات",
        "workHistory": "تاريخ العمل والتقييمات",
        "workspaceControls": "عناصر التحكم في مساحة العمل"
    },
    "common": {
        "accountHolder": "اسم صاحب الحساب",
        "accountHolderPlaceholder": "الاسم كما يظهر في الحساب البنكي",
        "active": "نشط",
        "all": "الكل",
        "alreadyReportedSession": "Already reported in this session",
        "amountZero": "0.000 TND",
        "apply": "Apply Filters",
        "approved": "مقبول",
        "attachments": "المرفقات",
        "available": "متاح",
        "availableForWork": "متاح للعمل",
        "back": "رجوع",
        "bankName": "اسم البنك",
        "bankNamePlaceholder": "مثال: البنك الوطني الفلاحي",
        "busy": "مشغول",
        "cancel": "إلغاء",
        "cancelled": "ملغى",
        "client": "عميل",
        "close": "إغلاق",
        "closeMenu": "غلق القائمة",
        "completed": "مكتمل",
        "completionDate": "تاريخ الإنجاز",
        "confirm": "تأكيد",
        "contactSupport": "تواصل مع الدعم",
        "currency": "TND",
        "currencyPerHour": "TND/h",
        "delete": "حذف",
        "dinar": "دينار",
        "download": "Download",
        "edit": "تعديل",
        "emailPlaceholder": "بريدك الإلكتروني",
        "error": "خطأ",
        "errors": {
            "unexpected": "حدث خطأ غير متوقع"
        },
        "fileSize": {
            "bytes": "Bytes",
            "kilobytes": "Kilobytes",
            "megabytes": "Megabytes"
        },
        "fileTooLarge": "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        "fileUpload": {
            "chooseFiles": "اختر ملفات",
            "dropzoneHint": "اسحب الملفات هنا أو انقر للتصفح",
            "fileTooLarge": "{{name}} أكبر من {{size}}MB",
            "maxFilesExceeded": "الحد الأقصى {{count}} ملفات",
            "removeFileAria": "حذف {{name}}",
            "unsupportedType": "{{name}} نوع غير مدعوم"
        },
        "filter": "تصفية",
        "fixedPrice": "سعر ثابت",
        "freelancer": "مستقل",
        "from": "من",
        "general": "عام",
        "goBack": "العودة",
        "hide": "Hide details",
        "hourly": "بالساعة",
        "hourlyExample": "مثال: 20",
        "hoursExample": "مثال: 10-20",
        "identityVerified": "هوية موثقة",
        "inactive": "غير نشط",
        "invalidFileType": "يرجى اختيار صورة بصيغة JPG أو PNG أو WebP",
        "loading": "جاري التحميل...",
        "loadingContent": "تحميل المحتوى",
        "messageContent": "محتوى الرسالة",
        "messageContentPlaceholder": "اكتب تفاصيل رسالتك هنا...",
        "messageSubject": "موضوع الرسالة",
        "messageSubjectPlaceholder": "مثال: استفسار بخصوص مشروع تصميم...",
        "more": "More",
        "navigate": "تنقل",
        "next": "التالي",
        "no": "لا",
        "none": "بلا",
        "notAuthenticated": "Not authenticated",
        "offline": "غير متصل",
        "older": "Older",
        "open": "فتح",
        "openMenu": "فتح القائمة",
        "optional": "اختياري",
        "pending": "قيد الانتظار",
        "posted1DayAgo": "نُشر منذ يوم",
        "postedDaysAgo": "نُشر منذ {{days}} أيام",
        "postedRecently": "نُشر مؤخراً",
        "postedToday": "نُشر اليوم",
        "postedWeeksAgo": "نُشر منذ {{weeks}} أسبوع",
        "projectDescription": "وصف المشروع",
        "projectDescriptionPlaceholder": "اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة...",
        "projectTitle": "عنوان المشروع",
        "projectTitlePlaceholder": "مثال: تصميم شعار لشركة مواد غذائية",
        "projectUrl": "رابط المشروع",
        "proposalPlaceholder": "اشرح لماذا أنت الشخص المناسب لهذا المشروع...",
        "refresh": "تحديث",
        "rejected": "مرفوض",
        "reload": "إعادة تحميل",
        "removeImage": "إزالة الصورة",
        "replyToReview": "الرد على التقييم",
        "report": "إبلاغ",
        "reportContent": "محتوى البلاغ",
        "reportContentTitle": "Report content",
        "reportDescribePlaceholder": "يرجى وصف المشكلة...",
        "reportError": "فشل في إرسال البلاغ",
        "reportFailed": "Failed to submit report",
        "reportSubmitButton": "إرسال البلاغ",
        "reportSubmitted": "تم الإبلاغ. سيقوم فريقنا بالمراجعة قريباً.",
        "reportSubmittedSuccess": "Report submitted. Our team will review it shortly.",
        "reportTitle": "الإبلاغ عن هذا المحتوى",
        "reported": "Reported",
        "retry": "إعادة المحاولة",
        "returnHome": "العودة للرئيسية",
        "reviewPlaceholder": "ما الذي أعجبك؟ ما الذي يمكن تحسينه؟ هل توصي به للآخرين؟",
        "save": "حفظ",
        "saveFreelancer": "حفظ المستقل",
        "saving": "Saving...",
        "scrollToTop": "العودة إلى الأعلى",
        "search": "بحث",
        "searchPlaceholder": "ابحث...",
        "searchProposals": "بحث في العروض...",
        "select": "اختيار",
        "selectReason": "Please select a reason",
        "shareExperience": "شارك تجربتك مع هذا الشخص...",
        "show": "Show details",
        "skill": "مهارة",
        "skillsUsed": "المهارات المستخدمة",
        "skillsUsedPlaceholder": "مثال: Photoshop, React, UI Design (افصل بينها بفاصلة)",
        "skipForNow": "يمكنك تخطي هذه الخطوة والتحميل لاحقاً",
        "sort": "ترتيب",
        "submit": "إرسال",
        "success": "نجاح",
        "thumbnailUrl": "رابط صورة العرض (URL)",
        "time": {
            "ago": "",
            "ago_prefix": "منذ",
            "day": "يوم",
            "hour": "ساعة",
            "minute": "دقيقة",
            "now": "الآن"
        },
        "tnd": "د.ت",
        "tndPerHour": "د.ت/ساعة",
        "to": "إلى",
        "today": "اليوم",
        "toggleDarkMode": "تبديل الوضع الداكن",
        "toggleLightMode": "تبديل الوضع الفاتح",
        "tryAgain": "Try again",
        "tunisia": "تونس",
        "typeMessage": "اكتب رسالتك هنا...",
        "unknownUser": "Unknown User",
        "unsave": "إلغاء الحفظ",
        "unsaveFreelancer": "إلغاء الحفظ",
        "uploadFailed": "تعذر رفع الصورة، يمكنك إضافتها لاحقاً",
        "verified": "موثق",
        "view": "عرض",
        "viewJob": "عرض المهمة",
        "visibilityNote": "إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار \"دعوة فقط\" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن \"عام للجميع\" يضمن لك تنافسية أفضل في الأسعار.",
        "whyReport": "Why Report",
        "writeReply": "اكتب ردك هنا...",
        "yes": "نعم",
        "yesterday": "Yesterday",
        "you": "أنت"
    },
    "components": {
        "profileCompletion": {
            "badge": "Visibility score",
            "completeDescription": "Everything important is filled in. Keep proposals active and your portfolio fresh to stay visible.",
            "completeTitle": "Your freelancer profile is market-ready",
            "cta": "Improve profile now",
            "excellent": "Standout",
            "good": "Looking solid",
            "medium": "Getting there",
            "moreSteps": "more improvements waiting",
            "nextPriority": "Helpful next improvement",
            "nextSteps": "Highest-impact next steps",
            "nextStepsDescription": "Focus on the items below first for the fastest profile lift.",
            "progressLabel": "Completion",
            "readyBadge": "Profile ready",
            "steps": {
                "avatar": "Add a profile photo",
                "bio": "Write a stronger bio",
                "education": "Add education details",
                "fullName": "Complete your full name",
                "hourlyRate": "Set your hourly rate",
                "languages": "Add your languages",
                "location": "Set your location",
                "phone": "Add your phone number",
                "portfolio": "Show your past work",
                "skills": "Add at least 3 skills",
                "title": "Add your professional title"
            },
            "stepsCount": "steps done",
            "stepsLeft": "left",
            "subtitle": "Complete the strongest remaining items to increase trust and hiring chances.",
            "title": "Profile completion",
            "topPriority": "Top priority right now",
            "weak": "Needs work"
        }
    },
    "contract": {
        "acceptAndPay": "قبول وإتمام الدفع",
        "acceptAndPayConfirm": "This will mark the contract as completed and release payment.",
        "acceptError": "حدث خطأ في قبول العمل",
        "actions": {
            "reviewExperience": "Leave a review"
        },
        "addReview": "أضف تقييمك",
        "amount": "Amount",
        "attachFile": "إرفاق ملف",
        "awaitingApproval": "في انتظار القبول",
        "awaitingDelivery": "في انتظار التسليم",
        "backToContracts": "Back to contracts",
        "blockedReasons": {
            "noAttachments": "المرفقات معطلة لهذه المحادثة.",
            "noVoiceNotes": "الرسائل الصوتية معطلة لهذه المحادثة.",
            "readOnly": "هذه المحادثة للقراءة فقط حالياً.",
            "safetyBlocked": "هذه الرسالة محظورة بموجب قواعد سلامة العقد."
        },
        "chat": "المحادثة",
        "chatSafetyBlocked": "Chat Safety Blocked",
        "completed": "مكتمل",
        "completionBanner": {
            "dismiss": "تجاهل",
            "leaveReview": "ساعد {{name}} في تعزيز سمعته — اترك تقييماً.",
            "readOnly": "هذه المحادثة للقراءة فقط الآن.",
            "reviewAction": "تقييم",
            "title": "تم إكمال العقد!"
        },
        "confirmDelivery": "Confirm Delivery",
        "contextBar": {
            "btnAcceptPay": "قبول وإتمام الدفع",
            "btnDeliverWork": "تسليم العمل",
            "btnFullWorkspace": "مساحة العمل الكاملة",
            "btnFundEscrow": "تمويل الضمان",
            "btnLeaveReview": "اترك تقييماً",
            "btnRequestRevision": "طلب تعديل ({{remaining}} متبقية)",
            "infoDeadline": "الموعد النهائي",
            "infoDeliveredOn": "تم التسليم في",
            "infoEscrowNotFunded": "الضمان غير ممول",
            "infoEscrowSecured": "الضمان مؤمن",
            "infoEscrowStatus": "حالة الضمان",
            "infoReviewBy": "المراجعة بحلول {{date}}",
            "infoReviewPeriod": "فترة المراجعة",
            "infoRevisionsUsed": "التعديلات المستخدمة",
            "statusActive": "نشط",
            "statusAwaitingPayment": "بانتظار الدفع",
            "statusCancelled": "ملغي",
            "statusCompleted": "مكتمل",
            "statusContract": "عقد",
            "statusDisputed": "متنازع عليه",
            "statusInProgress": "قيد التنفيذ",
            "statusRevisionRequested": "طلب تعديلات",
            "statusUnderReview": "قيد المراجعة"
        },
        "days": "أيام",
        "daysLeft": "باقي",
        "daysRemaining": "{{days}} يوم متبقية",
        "deliverBlocked": "Only the freelancer can deliver work for this contract.",
        "deliverError": "حدث خطأ في تسليم العمل",
        "deliverNoteAria": "Delivery notes",
        "deliverNoteLabel": "Add a note for the client",
        "deliverNotePlaceholder": "Deliver Note Placeholder",
        "deliverWork": "تسليم العمل",
        "details": "التفاصيل",
        "disputeBlocked": "A dispute cannot be opened in the current contract state.",
        "disputeError": "حدث خطأ في فتح النزاع",
        "disputeOpened": "تم فتح نزاع",
        "disputeReasonAria": "Dispute reason",
        "disputeReasonPlaceholder": "Explain reason for dispute...",
        "disputeReview": "سيتم المراجعة خلال 48 ساعة",
        "disputeWarning": "Opening a dispute will suspend the contract while it is reviewed.",
        "employer": "صاحب العمل",
        "error": "حدث خطأ",
        "escrowBanner": {
            "clientFundDetail": "قم بتمويل {{amount}} د.ت في الضمان لبدء العمل مع {{name}}.",
            "clientFundSafe": "الأموال محفوظة بأمان حتى توافق على التسليم.",
            "clientSecureTitle": "قم بتأمين عقدك",
            "dismiss": "تجاهل",
            "freelancerNotified": "سيتم إعلامك بمجرد تأكيد الأموال.",
            "freelancerWaiting": "بانتظار أن يقوم العميل بتأمين الضمان قبل بدء العمل.",
            "fundAmount": "تمويل {{amount}} د.ت",
            "topUpNeeded": "تحتاج إلى تعبئة رصيد",
            "walletBalance": "رصيد المحفظة: {{balance}} د.ت"
        },
        "fileUploadError": "حدث خطأ في رفع الملف",
        "fileUploaded": "File uploaded:",
        "filesListEmpty": "Files List Empty",
        "finalDelivery": "التسليم النهائي",
        "firstMessageHint": "Share context, files, and next steps to keep the project moving.",
        "hideWorkspace": "إخفاء مساحة العمل",
        "inProgress": "جاري العمل",
        "jobInfo": "معلومات المهمة",
        "lifecycle": {
            "noComment": "لم يتم تقديم تعليق",
            "provideBothError": "يرجى تقديم التسليمات لكل من مرحلتي المراجعة والتسليم النهائي.",
            "uploadFailed": "فشل تحميل {{stage}} للملف {{name}}: {{message}}",
            "workDeliveredMessage": "[[contract_completed]] تم قبول العمل وإطلاق الدفع"
        },
        "loadFailedMessage": "Unable to load this contract right now.",
        "loadFailedTitle": "Contract unavailable",
        "milestones": "محطات العمل",
        "noDueDate": "لا يوجد تاريخ استحقاق",
        "noSharedFiles": "لا توجد ملفات مشتركة بعد",
        "notFoundDescription": "This contract may still be syncing. You can retry or return to your contracts list.",
        "notFoundTitle": "Contract not found",
        "onlineNow": "متصل الآن",
        "openDispute": "فتح نزاع",
        "openDisputeAction": "Open Dispute",
        "paymentInfo": "معلومات الدفع",
        "pending": "معلق",
        "requestChanges": "طلب تعديلات",
        "requestChangesBlocked": "Changes can only be requested after a delivery is submitted.",
        "requestRevision": "طلب تعديلات",
        "requiredActions": "الإجراءات المطلوبة",
        "resubmitDelivery": "Resubmit Delivery",
        "reviewExperience": "Review Experience",
        "reviewExpired": "انتهت فترة المراجعة",
        "reviewSent": "تم إرسال تقييمك بنجاح",
        "revisionLimitReached": "Revision limit reached for this contract.",
        "revisionSent": "تم إرسال طلب التعديلات",
        "revisionSentCompatibilityNotice": "Revision request sent. Status update will apply once the latest contract enum migration is available.",
        "role": "Role",
        "send": "إرسال",
        "sendMessage": "إرسال رسالة...",
        "sendMessageError": "حدث خطأ في إرسال الرسالة",
        "seoDescription": "Track conversation, files, and payment status for your contract from the workspace.",
        "sharedFiles": "الملفات المشتركة",
        "startConversation": "ابدأ المحادثة الآن",
        "startedAt": "Started",
        "statusLabel": "Status:",
        "statusUnavailable": "الحالة غير متاحة",
        "statusUnavailableHint": "بيانات الحالة غير متاحة مؤقتاً. تظل هذه المحادثة متاحة.",
        "tabs": {
            "ariaLabel": "Workspace tabs",
            "chat": "Chat",
            "chatAria": "Show chat",
            "details": "Details",
            "detailsAria": "Show details",
            "files": "Files",
            "filesAria": "Show files"
        },
        "tnd": "TND",
        "typeMessage": "اكتب رسالتك هنا...",
        "untitledJob": "Untitled job",
        "workAccepted": "تم قبول العمل وإتمام الدفع!",
        "workDelivered": "تم تسليم العمل بنجاح!",
        "workingOnProject": "يعمل على المشروع",
        "workspaceTitle": "مساحة العمل"
    },
    "contractWorkspace": {
        "clientView": "عرض العميل",
        "deliveryFailed": "Failed to submit delivery.",
        "deliverySubmitted": "Delivery submitted! The client will review your work.",
        "disputeFailed": "Failed to open dispute.",
        "disputeOpened": "Dispute opened. Our team will review the case.",
        "freelancerView": "عرض المستقل",
        "loadError": "فشل تحميل تفاصيل العقد. يرجى المحاولة مرة أخرى.",
        "notFound": "العقد غير موجود أو ليس لديك صلاحية الوصول.",
        "notParticipant": "أنت لست مشاركاً في هذا العقد.",
        "openToDeliver": "افتح هذا العقد في الرسائل لتسليم العمل.",
        "openToDispute": "افتح هذا العقد في الرسائل لفتح نزاع.",
        "openToReleasePay": "افتح هذا العقد في الرسائل لتحرير الدفع.",
        "openToRequestChanges": "افتح هذا العقد في الرسائل لطلب تعديلات.",
        "paymentReleased": "Payment released and contract completed.",
        "releaseFailed": "Failed to release payment.",
        "revisionFailed": "Failed to request revision.",
        "revisionRequested": "Revision requested. The freelancer has been notified.",
        "unableToLoad": "تعذر تحميل مساحة العمل"
    },
    "contracts": {
        "activeCount": "{{count}} نشط",
        "empty": {
            "clientCta": "نشر مشروع",
            "clientDescription": "قم بتوظيف مستقل لإنشاء أول عقد لك.",
            "freelancerCta": "تصفح الوظائف",
            "freelancerDescription": "أرسل عروضاً لتحصل على أول عقد لك.",
            "title": "لا توجد عقود بعد"
        },
        "emptyCancelledDescription": "ليس لديك أي عقود ملغاة.",
        "emptyCancelledTitle": "لا توجد عقود ملغاة",
        "emptyDescription": "جرّب علامة تبويب أخرى أو اضبط البحث للعثور على العقود بشكل أسرع.",
        "emptyTitle": "لم يتم العثور على عقود",
        "milestonesProgress": "1 من 3 مراحل مكتملة",
        "openWorkspace": "فتح مساحة العمل ->",
        "paymentProtectionDesc": "تواصل دائماً واطلب المدفوعات عبر WorkedIn. العقود المدفوعة خارج المنصة غير محمية بنظام الضمان الآمن لدينا.",
        "paymentProtectionTitle": "حماية الدفع",
        "role": {
            "client": "العميل",
            "freelancer": "المستقل"
        },
        "searchPlaceholder": "البحث في العقود أو المستخدمين...",
        "startedOn": "بدأ في {{date}}",
        "status": {
            "active": "نشط",
            "cancelled": "ملغى",
            "completed": "مكتمل",
            "disputed": "متنازع عليه"
        },
        "subtitle": "إدارة عقودك النشطة، وأعمالك السابقة، والتواصل مع العملاء.",
        "tabs": {
            "active": "نشطة",
            "all": "الكل",
            "completed": "مكتملة",
            "disputed": "متنازع عليها"
        },
        "title": "العقود",
        "unknownProject": "مشروع غير معروف",
        "unknownUser": "مستخدم غير معروف"
    },
    "counter": {
        "title": "دينار ربحها التونسيون هذا الشهر"
    },
    "ctaSection": {
        "badge": "هل أنت مستعد؟",
        "browseJobs": "تصفح الوظائف",
        "clientDashboard": "لوحة تحكم العميل",
        "findFreelancers": "البحث عن مستقلين",
        "goToDashboard": "الذهاب إلى لوحة التحكم",
        "primary": "ابدأ مجاناً",
        "secondary": "انشر مشروعاً",
        "subtitle": "انضم إلى آلاف المحترفين الذين يربحون بعدالة على خدمة.",
        "title": "اقتصاد التوظيف المستقل في تونس يبدأ هنا."
    },
    "dashboard": {
        "admin": {
            "activeContracts": "العقود النشطة",
            "activeJobs": "المشاريع النشطة",
            "adminDashboard": "لوحة الإدارة",
            "allStatuses": "جميع الحالات",
            "allTransactionsSuccess": "جميع المعاملات نجحت",
            "allUsers": "جميع المستخدمين",
            "allVerificationsProcessed": "تم معالجة جميع طلبات التحقق",
            "backSide": "الوجه الخلفي",
            "backToSite": "العودة للموقع",
            "cancelled": "ملغي",
            "clients": "العملاء",
            "completed": "مكتمل",
            "controlCenter": "مركز التحكم",
            "disputes": "النزاعات",
            "failedToLoadUsers": "فشل تحميل المستخدمين",
            "freelancers": "الموظفون",
            "frontSide": "الوجه الأمامي",
            "identityVerificationRequests": "طلبات التحقق من الهوية",
            "inProgress": "قيد التنفيذ",
            "jobs": {
                "actions": "Actions",
                "allStatuses": "All statuses",
                "budget": "Budget",
                "cancel": "Cancel",
                "checkPermissions": "Check database permissions",
                "clearFilters": "Clear filters",
                "client": "Client",
                "confirm": "Confirm",
                "consistencyCount": "Consistency Count",
                "consistencyDescription": "Compares jobs.status with the latest linked contract status.",
                "consistencyHealthy": "No status mismatch detected between jobs and latest contracts.",
                "consistencyLoading": "Checking consistency...",
                "consistencyMore": "Consistency More",
                "consistencyTitle": "Lifecycle consistency check",
                "currentStatus": "Current",
                "delete": "Delete",
                "deleteConfirm": "Are you sure you want to delete this job?",
                "deleteError": "An error occurred while deleting",
                "deleteTitle": "Delete Job",
                "deletedSuccess": "Job deleted successfully",
                "expectedStatus": "Expected",
                "fromContract": "from contract",
                "job": "Job",
                "loadError": "Failed to load jobs",
                "loading": "Loading jobs...",
                "noResults": "No jobs match your filters",
                "notSpecified": "Not specified",
                "refreshCheck": "Refresh check",
                "refreshReviewTimeouts": "Refresh watch",
                "review": "Review",
                "reviewDueAt": "Review due",
                "reviewTimeoutStageOverdue": "Overdue",
                "reviewTimeoutStageReminder": "Due soon",
                "reviewTimeoutsCount": "Review Timeouts Count",
                "reviewTimeoutsDescription": "Tracks due-soon and overdue client review windows after delivery.",
                "reviewTimeoutsHealthy": "No due-soon or overdue review windows detected.",
                "reviewTimeoutsLoading": "Checking review windows...",
                "reviewTimeoutsTitle": "Contract review timeout watch",
                "searchPlaceholder": "Search jobs...",
                "status": "Status",
                "statusCancelled": "Cancelled",
                "statusCompleted": "Completed",
                "statusDisputed": "Disputed",
                "statusInProgress": "In progress",
                "statusOpen": "Open",
                "tryAdjusting": "Try adjusting your search or filter criteria"
            },
            "loading": "جاري التحميل...",
            "loadingUsers": "جاري تحميل المستخدمين...",
            "nightModeReady": "الوضع الليلي جاهز",
            "noPendingRequests": "لا توجد طلبات معلقة",
            "noPendingVerifications": "لا توجد طلبات تحقق معلقة",
            "noStuckPayments": "لا توجد مدفوعات معلقة",
            "open": "مفتوح",
            "operationsCenter": "مركز المراقبة",
            "overview": "نظرة عامة",
            "pageDescription": "مراجعة وإدارة طلبات التحقق من الهوية المقدمة",
            "pageTitle": "طلبات التحقق من الهوية - لوحة الإدارة",
            "payments": {
                "allSuccess": "All transactions completed successfully",
                "approvedSuccess": "Withdrawal payout executed successfully",
                "loading": "Loading...",
                "noPayments": "No stuck payments",
                "refresh": "Refresh",
                "rejectedSuccess": "Withdrawal request rejected and refunded",
                "retry": "Retry",
                "title": "Title"
            },
            "pending": "معلق",
            "pendingRequests": "الطلبات المعلقة",
            "refresh": "تحديث",
            "reports": "التقارير",
            "revenue": "الإيرادات (د.ت)",
            "settings": "الإعدادات",
            "stuckPayments": "المدفوعات المعلقة (أكثر من ساعة)",
            "todayActivity": "نشاط اليوم",
            "totalUsers": "إجمالي المستخدمين",
            "users": {
                "accountStatus": "Account status",
                "accountStatusMigrationMissing": "Action blocked: account_status is missing in database. Apply latest Supabase migrations.",
                "accountType": "Account type",
                "actions": "Actions",
                "active": "Active",
                "activeMode": "Active mode",
                "activityCounts": "Activity counts",
                "admin": "Admin",
                "adminPermissionsOutOfSync": "Action blocked by database permissions. Confirm this user is admin in production DB and latest RLS migrations are applied.",
                "adminPrivilegesRequired": "Action blocked: your account is not marked as admin in profiles.",
                "allUsers": "All users",
                "archiveUser": "Archive user",
                "archiveUserConfirm": "Archive this user account and anonymize profile data while keeping legal and financial history?",
                "archived": "Archived",
                "cancel": "Cancel",
                "cannotDeleteAdminAccount": "Admin accounts cannot be permanently deleted from this action.",
                "checkDatabasePermissions": "Check Database Permissions",
                "clearSearch": "Clear search",
                "client": "Client",
                "clients": "Clients",
                "close": "Close",
                "confirm": "Confirm",
                "daysAbbr": "d",
                "deletePermanently": "Delete permanently",
                "deleteUserPermanentWarning": "This action is irreversible. User auth account and all cascading records will be removed if policy checks pass.",
                "deleteUserPermanently": "Delete user permanently",
                "edgeFunctionDeployHint": "If this is a hard delete, deploy admin-user-control edge function and verify ALLOWED_ORIGINS.",
                "email": "Email",
                "failedToLoadUsers": "Failed to load users",
                "failedToSwitchUserMode": "Failed to switch user mode",
                "freelancer": "Freelancer",
                "freelancers": "Freelancers",
                "fullAccessData": "Full access data",
                "hoursAbbr": "h",
                "identityVerification": "Identity verification",
                "justNow": "Just now",
                "lastActivity": "Last activity",
                "loadingUsers": "Loading users...",
                "minutesAbbr": "m",
                "mode": "Mode",
                "monthsAbbr": "mo",
                "name": "Name",
                "no": "No",
                "noUsersMatch": "No users match your search",
                "notificationFunctionConflict": "Database function conflict detected for notifications. Apply latest Supabase SQL fixes.",
                "reactivate": "Reactivate",
                "reactivateUser": "Reactivate user",
                "reactivateUserConfirm": "Do you want to restore access for user",
                "revoke": "Revoke",
                "revokeReasonLabel": "Revoke Reason Label",
                "revokeReasonPlaceholder": "e.g., ID document is expired...",
                "revokeVerification": "Revoke Verification",
                "revokeVerificationConfirm": "Are you sure you want to revoke verification for this user? They will need to submit their ID again.",
                "searchByNameOrEmail": "Search by name or email...",
                "sortEmailAZ": "Sort Email A Z",
                "sortEmailZA": "Sort Email Z A",
                "sortNameAZ": "Sort Name A Z",
                "sortNameZA": "Sort Name Z A",
                "sortNewest": "Newest first",
                "sortOldest": "Oldest first",
                "sortStatusAsc": "Sort Status Asc",
                "sortStatusDesc": "Sort Status Desc",
                "status": "Status",
                "superAdmin": "Super admin",
                "superAdminOnlyDelete": "Permanent deletion requires super admin privileges.",
                "superAdminProtected": "Super admin accounts cannot be moderated from this control.",
                "suspend": "Suspend",
                "suspendUser": "Suspend user",
                "suspendUserConfirm": "Do you want to suspend user",
                "suspended": "Suspended",
                "suspensionKeepsHistory": "Their contracts, payments, disputes, and audit history will be kept.",
                "switch": "Switch",
                "switchMode": "Switch mode",
                "tryAdjustingSearch": "Try adjusting your search criteria or filters",
                "type": "Type",
                "unableToDeleteUser": "Unable to delete user",
                "unableToRevokeVerification": "Unable to revoke verification",
                "unableToUpdateStatus": "Unable to update user status",
                "unverified": "Unverified",
                "user": "User",
                "userArchived": "User archived successfully",
                "userDeletedPermanently": "User deleted permanently",
                "userDetails": "User details",
                "userModeSwitchedTo": "User mode switched to",
                "userReactivated": "User reactivated successfully",
                "userSuspended": "User suspended successfully",
                "verified": "Verified",
                "view": "View",
                "weeksAbbr": "w",
                "yes": "Yes"
            },
            "verification": {
                "actionFailed": "Action failed",
                "allProcessed": "All verification requests are processed",
                "approve": "Approve",
                "backSide": "Back side",
                "frontSide": "Front side",
                "hide": "Hide",
                "idNumber": "ID number",
                "loadError": "Failed to load verification requests",
                "noImage": "No image",
                "noPending": "No pending requests",
                "notUpdated": "Verification request was not updated.",
                "pending": "pending",
                "refresh": "Refresh",
                "reject": "Reject",
                "selfie": "Selfie",
                "title": "Identity verification requests",
                "user": "User",
                "viewDocs": "View documents"
            },
            "verificationQueue": {
                "approve": "Approve",
                "approveFailed": "Failed to approve verification",
                "cancel": "Cancel",
                "cardBack": "Card back",
                "cardBackAlt": "ID card back side",
                "cardFront": "Card front",
                "cardFrontAlt": "ID card front side",
                "checkBack": "Barcode is clear on back image",
                "checkDigits": "ID number contains 8 digits",
                "checkFront": "Details are clear on front image",
                "checkMatch": "Selfie matches ID card photo",
                "checklist": "Verification checklist:",
                "confirmReject": "Confirm rejection",
                "days": "days",
                "description": "Review and manage identity verification requests submitted by users",
                "errorTitle": "Loading error",
                "hours": "hours",
                "idNumber": "ID number",
                "loadError": "Failed to load verification requests",
                "minutesAgo": "Minutes ago",
                "noPending": "No pending verification requests",
                "pending": "Pending",
                "queueTitle": "Pending requests",
                "reject": "Reject",
                "rejectDescription": "Please provide the rejection reason so the user can fix the issue",
                "rejectExample": "Example: The image is unclear, please retake it...",
                "rejectFailed": "Failed to reject verification",
                "rejectReason": "Rejection reason",
                "retry": "Retry",
                "reviewTitle": "Review verification",
                "selectRequest": "Select a request from the list to review",
                "selfie": "Selfie",
                "selfieAlt": "Selfie",
                "seoDescription": "Review and manage submitted identity verification requests",
                "seoTitle": "Identity verification requests - Admin dashboard",
                "since": "Since",
                "title": "Identity verification requests"
            }
        },
        "all": "الكل",
        "availableJobs": "وظائف تناسب مهاراتك",
        "browseJobs": "تصفح الوظائف",
        "client": {
            "acrossActiveContracts": "عبر {{count}} عقود نشطة",
            "activeBadge": "نشط",
            "activeContracts": "العقود النشطة",
            "activeContractsDescription": "العقود الجارية حالياً مع مستقلين تم تعيينهم.",
            "activeJobs": "مهام نشطة",
            "activeJobsDetail": "المشاريع المفتوحة أو قيد التنفيذ والتي تتطلب حالياً اتخاذ قرارات أو تقييم عروض أو متابعة التسليم.",
            "activeLabel": "نشط",
            "activeProjects": "المشاريع النشطة",
            "allCaughtUp": "أنت على اطلاع بكل شيء",
            "allCaughtUpDescription": "عندما تصل تحديثات العروض أو تغييرات العقود أو التذكيرات، ستظهر هنا بتسلسل واضح.",
            "assigneeLabel": "المستقل المكلّف",
            "awaitingReview": "بانتظار المراجعة",
            "badgeUnverified": "Project Owner",
            "badgeVerified": "Verified Client",
            "clientFallback": "Client",
            "commandCenter": "مركز قيادة العميل",
            "commandCenterSubtitle": "Track projects, proposals & spending",
            "completedContracts": "عقود مكتملة",
            "completedContractsDetail": "المشاريع التي أشرفت عليها حتى مرحلة التسليم وتم إغلاقها بنجاح.",
            "contractsBadge": "التسليم النشط",
            "defaultName": "عميل",
            "defaultNotificationBody": "حدث في المشروع يحتاج لاهتمامك.",
            "defaultNotificationTitle": "تحديث المشروع",
            "focusDeliveryDescription": "تتبع المراحل والرسائل والموافقات لتستمر المشاريع النشطة دون أي عوائق.",
            "focusDeliveryTitle": "ابق قريباً من التسليمات النشطة",
            "focusFirstJobDescription": "توضيح تفاصيل المهمة يفتح لك باب العروض والمقاولات. ابدأ من هنا قبل أي شيء آخر.",
            "focusFirstJobTitle": "انشر أول تفاصيل لمشروعك",
            "focusLabel": "تركيز اليوم",
            "focusReviewDescription": "مهمتك \"{{title}}\" تحتوي بالفعل على عروض في انتظار مراجعتك.",
            "focusReviewTitle": "مراجعة العروض المستلمة",
            "focusScaleDescription": "لوحة التحكم لديك هادئة في الوقت الحالي. حدد تفاصيل مشروعك القادم بشكل أفضل.",
            "focusScaleTitle": "افتح مشروعاً جديداً بقوة",
            "freelancerFallback": "مستقل",
            "heroDescription": "حافظ على سير عمل التوظيف لديك: انشر تفاصيل مهام أوضح، راجع العروض بشكل أسرع، وانقل المشاريع النشطة نحو التسليم بسهولة.",
            "heroGreeting": "مرحباً، {{name}}",
            "inProgressProjects": "قيد التنفيذ",
            "jobBudget": "الميزانية",
            "jobsWithProposals": "مهام بها عروض",
            "manageWorkspace": "إدارة مساحة العمل",
            "monitorDelivery": "متابعة التسليم",
            "needSomethingDone": "هل تحتاج إلى شيء؟",
            "nextActionLabel": "الإجراء التالي",
            "nextMoves": "أفضل الخطوات التالية",
            "noActiveContracts": "لا توجد عقود نشطة",
            "noActiveContractsDescription": "بمجرد قبول عرض وتمويل الضمان، ستظهر العقود النشطة هنا.",
            "noActiveProjects": "لا توجد مشاريع نشطة",
            "noJobsDescription": "ستبدأ لوحة التحكم بالامتلاء بمجرد نشر تفاصيل مشروع ودعوة العروض إلى مسار التوظيف.",
            "noJobsYet": "لم تنشر أي مهام بعد",
            "notifications": "الإشعارات",
            "openNotifications": "افتح الإشعارات",
            "openProjects": "المشاريع المفتوحة",
            "pipeline": {
                "openJobs": "مهام مفتوحة",
                "totalProposals": "إجمالي العروض",
                "unreadUpdates": "تحديثات غير مقروءة"
            },
            "pipelineBadge": "دعم القرار",
            "pipelineSummary": "ملخص التوظيف",
            "playbookBadge": "دليل العميل",
            "postAProject": "نشر مشروع",
            "postFirstProject": "انشر مشروعك الأول للعثور على موظفين موهوبين",
            "postJob": "نشر مهمة جديدة",
            "postJobToReceiveProposals": "انشر مشروعاً لبدء استقبال العروض",
            "postProjectFree": "انشر مشروعاً مجاناً. احصل على عروض من موظفين تونسيين موثوقين.",
            "postProjectFreeCta": "انشر مشروعاً — إنها مجانية",
            "profileUnavailable": "Profile unavailable",
            "profileUnavailableDesc": "We could not load your account profile yet. Please try again.",
            "projectsBadge": "مسار التوظيف",
            "projectsDescription": "أحدث تفاصيل المشاريع وتنبيهات العروض وحالات التسليم النشطة في مكان واحد.",
            "projectsLabel": "المشاريع",
            "proposalsCountText": "عروض",
            "proposalsLabel": "العروض",
            "proposalsSubmitted": "{{count}} عرض مقدم",
            "proposalsWaiting": "مشاريع في انتظار المراجعة",
            "proposalsWaitingDetail": "المشاريع المفتوحة التي تلقت عروضاً بالفعل ويجب مراجعتها قبل أن تفقد أهميتها.",
            "recentProposals": "العروض الحديثة",
            "refineProfile": "تحسين ملف العميل",
            "refineProfileDescription": "ملف الشركة الواضح يساعد المستقلين على الثقة بالملخص والرد بشكل أسرع.",
            "reviewBadge": "مراجعة",
            "reviewPipeline": "مراجعة مسار المشروع",
            "reviewPipelineDescription": "قارن الملخصات المفتوحة ونشاط العروض والتسليم النشط في مكان واحد.",
            "reviewProposals": "مراجعة العروض",
            "spentLabel": "تم الإنفاق",
            "stats": {
                "active": "Active",
                "activeDesc": "open & in progress",
                "projects": "Projects",
                "projectsDesc": "projects posted",
                "proposals": "Proposals",
                "proposalsDesc": "received total",
                "totalSpent": "Total Spent",
                "totalSpentDesc": "across all projects"
            },
            "status": {
                "cancelled": "ملغي"
            },
            "thisMonth": "هذا الشهر",
            "totalSpent": "إجمالي الإنفاق",
            "totalSpentDetail": "المدفوعات المكتملة التي تم تحويلها عبر محفظتك كعميل وحسابات الضمان.",
            "untitledContract": "عقد بدون عنوان",
            "untitledJob": "مشروع بدون عنوان",
            "updatesBadge": "نبض البريد الوارد",
            "viewAll": "عرض الكل",
            "viewAllContracts": "عرض الكل",
            "viewProject": "عرض المشروع",
            "viewWallet": "عرض المحفظة",
            "welcomeBack": "مرحباً بعودتك"
        },
        "clientSubtitle": "لوحة تحكم العميل",
        "freelancer": {
            "activeContracts": "العقود النشطة",
            "addSkillsToMatch": "أضف مهارات إلى ملفك الشخصي للحصول على مشاريع معروضة",
            "apply": "تقديم",
            "badgeUnverified": "Pro Freelancer",
            "badgeVerified": "Verified Pro",
            "browseAndSendProposal": "استعرض المشاريع المفتوحة وأرسل عرضك الأول",
            "browseJobs": "استعرض المشاريع",
            "checklist": {
                "avatar": "تم تحميل الصورة الشخصية",
                "bio": "تم كتابة السيرة الذاتية",
                "identity": "تم التحقق من الهوية",
                "preferences": "تفضيلات المشروع",
                "skills": "تم إضافة المهارات",
                "title": "العنوان الوظيفي",
                "tools": "الأدوات المضافة"
            },
            "clientFallback": "عميل",
            "contractsLabel": "العقود",
            "defaultName": "موظف",
            "earningsLabel": "الأرباح",
            "earningsThisMonth": "Earnings This Month",
            "matchedForYou": "معروضة لك",
            "myProposals": "My Proposals",
            "noActiveContracts": "لا توجد عقود نشطة",
            "noMatchesYet": "لا توجد مطابقات حتى الآن",
            "noProposalsYet": "لم تقدم أي عروض بعد",
            "profileCompletion": "Profile Strength",
            "profileStrength": "قوة الملف الشخصي",
            "proposalsLabel": "العروض",
            "quickActions": "الإجراءات السريعة",
            "ratingLabel": "التقييم",
            "recentProposals": "العروض الحديثة",
            "seeAllJobs": "عرض جميع المشاريع",
            "stats": {
                "contracts": "Contracts",
                "contractsDesc": "active now",
                "earnings": "This Month",
                "proposals": "Proposals",
                "proposalsDesc": "awaiting reply",
                "views": "Views",
                "viewsDesc": "profile views",
                "vsLastMonth": "vs last month"
            },
            "submitProposalsToStart": "قدم عروضاً لبدء الحصول على عقود",
            "thisMonth": "هذا الشهر",
            "untitledJob": "مشروع بدون عنوان",
            "updateProfile": "تحديث الملف الشخصي",
            "viewAll": "عرض الكل",
            "viewWallet": "عرض المحفظة",
            "vsLastMonth": "مقارنة بالشهر الماضي",
            "withdrawFunds": "Withdraw Funds"
        },
        "freelancerSubtitle": "لوحة تحكم الموظف الحر",
        "greeting": {
            "afternoon": "مساء الخير",
            "evening": "تصبح على خير",
            "morning": "صباح الخير"
        },
        "jobsCompleted": "مهمة منجزة",
        "loading": "Loading...",
        "new": "جديد",
        "postNewJob": "نشر مهمة جديدة",
        "postNewJobDesc": "أخبرنا عن مهمتك وسنجد لك أفضل 3 موظفين",
        "profileCompletion": "اكتمال البروفايل",
        "quickActions": "إجراءات سريعة",
        "rating": "التقييم",
        "recentActivity": "النشاط الأخير",
        "responseTime": "ساعة",
        "totalEarnings": "دينار",
        "updateProfile": "تحديث البروفايل",
        "urgent": "مستعجل",
        "viewAll": "عرض الكل",
        "viewDetails": "عرض التفاصيل",
        "viewProfile": "عرض البروفايل",
        "welcome": "مرحبا بعودتك",
        "yourJobs": "مهامك"
    },
    "dashboards": {
        "admin": {
            "headers": {
                "adminDashboard": "لوحة الإدارة",
                "backToSite": "العودة إلى الموقع",
                "nightModeReady": "وضع الليل جاهز",
                "operationsCenter": "مركز العمليات"
            },
            "labels": {
                "action": "إجراء",
                "createdAt": "تم الإنشاء في",
                "date": "التاريخ",
                "email": "البريد الإلكتروني",
                "role": "الدور",
                "status": "الحالة",
                "updatedAt": "تم التحديث في",
                "user": "مستخدم"
            },
            "messages": {
                "error": "خطأ في تحميل البيانات",
                "loading": "جاري التحميل...",
                "noData": "لم يتم العثور على بيانات"
            },
            "tabs": {
                "disputes": "النزاعات",
                "jobs": "الوظائف",
                "overview": "نظرة عامة",
                "payments": "المدفوعات",
                "reports": "التقارير",
                "settings": "الإعدادات",
                "users": "المستخدمون",
                "verifications": "التحقق"
            },
            "users": {
                "suspend": "تعليق",
                "suspendUser": "تعليق المستخدم",
                "suspendUserConfirm": "هل تريد تعليق المستخدم",
                "suspensionKeepsHistory": "سيتم الاحتفاظ بالعقود والمدفوعات والنزاعات وسجل التدقيق.",
                "switch": "تبديل",
                "unableToUpdateStatus": "تعذر تحديث حالة المستخدم"
            },
            "verification": {
                "approve": "وافق",
                "approved": "موافق عليه",
                "pending": "قيد التحقق",
                "reject": "رفض",
                "rejected": "مرفوض",
                "resubmit": "إعادة تقديم",
                "title": "قائمة التحقق",
                "viewDetails": "عرض التفاصيل"
            }
        },
        "client": {
            "actions": {
                "postProject": "انشر مشروعاً",
                "viewAll": "عرض الكل",
                "viewWallet": "عرض المحفظة"
            },
            "cta": {
                "needSomethingDone": "هل تحتاج إلى شيء ما؟",
                "needSomethingDoneDesc": "انشر مشروعاً مجاناً. احصل على عروض من الموهوبين التونسيين الموثقين.",
                "postProjectFree": "انشر مشروعاً — إنه مجاني"
            },
            "empty": {
                "noActiveProjects": "لا توجد مشاريع نشطة",
                "noActiveProjectsDesc": "انشر مشروعك الأول للعثور على موظفين مستقلين موهوبين",
                "noProposals": "لا توجد عروض حتى الآن",
                "noProposalsDesc": "ستظهر العروض من الموظفين المستقلين هنا"
            },
            "labels": {
                "freelancer": "موظف مستقل",
                "review": "مراجعة",
                "untitledJob": "مشروع بدون عنوان"
            },
            "stats": {
                "active": "نشطة",
                "projects": "المشاريع",
                "proposals": "العروض",
                "spent": "المبلغ المنفق"
            },
            "widgets": {
                "activeContracts": "العقود النشطة",
                "activeProjects": "المشاريع النشطة",
                "recentProposals": "العروض الأخيرة",
                "thisMonth": "هذا الشهر"
            }
        },
        "freelancer": {
            "actions": {
                "browseJobs": "تصفح الوظائف",
                "updateProfile": "تحديث الملف الشخصي",
                "viewWallet": "عرض المحفظة"
            },
            "checklist": {
                "avatarUploaded": "تم تحميل الصورة الرمزية",
                "bioWritten": "تمت كتابة السيرة الذاتية",
                "identityVerified": "تم التحقق من الهوية",
                "professionalTitle": "العنوان الوظيفي",
                "skillsAdded": "تمت إضافة المهارات"
            },
            "empty": {
                "checkBackSoon": "تحقق قريباً من فرص جديدة",
                "noActiveContracts": "لا توجد عقود نشطة",
                "noActiveContractsDesc": "قدم عروضاً لبدء الحصول على عقود",
                "noMatches": "لا توجد مطابقات بعد"
            },
            "labels": {
                "client": "عميل",
                "untitledJob": "مشروع بدون عنوان",
                "vsLastMonth": "مقابل الشهر الماضي"
            },
            "profileStrength": {
                "complete": "مكتمل"
            },
            "stats": {
                "contracts": "العقود",
                "earnings": "الأرباح",
                "proposals": "العروض",
                "rating": "التقييم"
            },
            "widgets": {
                "activeContracts": "العقود النشطة",
                "matchedForYou": "متطابق لك",
                "profileStrength": "قوة الملف الشخصي",
                "recentProposals": "العروض الأخيرة",
                "thisMonth": "هذا الشهر"
            }
        }
    },
    "dynamic_key_1004386723": "سيتم مراجعة طلب السحب من قبل الإدارة وتحويل المبلغ خلال 2-5 أيام عمل.",
    "dynamic_key_1015995410": "بحث في العروض...",
    "dynamic_key_1016245850": "تقييمك لـ",
    "dynamic_key_1039014200": "نبذة عني",
    "dynamic_key_1053149402": "فشلت عملية الدفع",
    "dynamic_key_1072185127": "اشرح لماذا أنت الشخص المناسب لهذا المشروع...",
    "dynamic_key_1080932848": "عنوان المشروع",
    "dynamic_key_1087307158": "التقييمات دائمة ولا يمكن تعديلها. يمكن للطرف الآخر الرد على تقييمك.",
    "dynamic_key_1102070523": "إجمالي التكلفة",
    "dynamic_key_1109099118": "إجمالي الأرباح",
    "dynamic_key_1111663922": "💡 الدفع معلق بشكل آمن في حساب الضمان حتى يتم تسليم العمل والموافقة عليه.",
    "dynamic_key_1113257013": "رسالة العرض",
    "dynamic_key_1115664379": "(500 حرف كحد أقصى)",
    "dynamic_key_1144928517": "سنقوم بدعم رفع الملفات قريباً. يرجى استخدام رابط مباشر للصورة حالياً.",
    "dynamic_key_1163187178": "وصف المشروع",
    "dynamic_key_1225650541": "جاري التشغيل...",
    "dynamic_key_1253092729": "قمنا بتحليل متطلباتك ووجدنا 3 مستقلين يطابقون مشروعك بنسبة 95%.",
    "dynamic_key_1259492927": "ساعة تقريباً",
    "dynamic_key_1262868023": "اللغة الأم",
    "dynamic_key_1265703203": "رسوم الخدمة",
    "dynamic_key_128175915": "الصفحة الرئيسية",
    "dynamic_key_131381918": "إعادة المحاولة",
    "dynamic_key_1333999920": "المهارات المستخدمة",
    "dynamic_key_1337275137": "قراءة المزيد...",
    "dynamic_key_1347768947": "رابط المشروع (اختياري)",
    "dynamic_key_1348454276": "نصائح لحل المشكلة:",
    "dynamic_key_1393796300": "جاري رفع الملف...",
    "dynamic_key_1475699192": "متوسط الخبرة",
    "dynamic_key_1500402850": "There are no items to display at the moment.",
    "dynamic_key_1501241012": "إبلاغ",
    "dynamic_key_1501416850": "إخفاء",
    "dynamic_key_1502065525": "إلغاء",
    "dynamic_key_1503344713": "الأعلى تقييماً",
    "dynamic_key_1505988461": "تحديث",
    "dynamic_key_1506640045": "تقييم",
    "dynamic_key_1506801489": "توظيف",
    "dynamic_key_1524267": "د.ت",
    "dynamic_key_1529240342": "إعدادات الخصوصية",
    "dynamic_key_1530768926": "مبتدئ",
    "dynamic_key_1530851603": "متقدم",
    "dynamic_key_1530855304": "متميز",
    "dynamic_key_1543783939": "عرض الوظيفة",
    "dynamic_key_1544269147": "رسوم المنصة (",
    "dynamic_key_1545985538": "مستوى المستقل",
    "dynamic_key_1546829780": "مراجعة مكتوبة (اختياري)",
    "dynamic_key_1573622": "ربح",
    "dynamic_key_1581598": "عرض",
    "dynamic_key_158612530": "• تحقق من توفر رصيد كافي",
    "dynamic_key_1591556203": "شارك تجربتك مع الآخرين",
    "dynamic_key_1593775": "منذ",
    "dynamic_key_1594354": "نعم",
    "dynamic_key_1598663": "يوم",
    "dynamic_key_1607514557": "آخر المعاملات",
    "dynamic_key_1608485352": "مرفقات (اختياري)",
    "dynamic_key_1611325765": "يجب كتابة 100 حرف على الأقل",
    "dynamic_key_1637895873": "اسم البنك",
    "dynamic_key_1647529322": "تخطي الآن",
    "dynamic_key_1655363803": "إرسال العرض",
    "dynamic_key_1659410812": "• تأكد من اتصال الإنترنت",
    "dynamic_key_1659906949": "نسبة النجاح",
    "dynamic_key_1679990796": "إرسال التقييم",
    "dynamic_key_1693322708": "المهارات",
    "dynamic_key_1707230249": "• تأكد من صحة بيانات البطاقة",
    "dynamic_key_1712849267": "المرفقات",
    "dynamic_key_1716602825": "الأقل سعراً",
    "dynamic_key_1718339647": "تم التقديم منذ",
    "dynamic_key_1725907738": "We couldn't load your data. Please try again.",
    "dynamic_key_1739654371": "نموذج عمل",
    "dynamic_key_1761004867": "الأكثر فائدة",
    "dynamic_key_1762109572": "فشل التحقق من الدفع",
    "dynamic_key_1785209048": "اشرح تفاصيل المشروع وما قمت بإنجازه...",
    "dynamic_key_1789330939": "التقييمات (",
    "dynamic_key_1793704877": "جاري الإرسال...",
    "dynamic_key_1797922455": "حساب موثق فقط",
    "dynamic_key_1798326885": "تم الدفع بنجاح! 🎉",
    "dynamic_key_1805513405": "مثال: تصميم متجر إلكتروني",
    "dynamic_key_1821001923": "يرجى الانتظار بينما نتحقق من عملية الدفع",
    "dynamic_key_1824767388": "وظيفة مكتملة",
    "dynamic_key_18255446": "اكتب ردك على تقييم",
    "dynamic_key_1827230247": "الفرنسية",
    "dynamic_key_1828865552": "تقييم 4 نجوم وأكثر",
    "dynamic_key_1842506838": "سجل العمل غير متوفر في هذه المعاينة",
    "dynamic_key_1842976832": "أفضل تطابق",
    "dynamic_key_1933160140": "العودة للعقد",
    "dynamic_key_193923978": "سيتم إنشاء عقد بينك وبين هذا الموظف. هل أنت متأكد؟",
    "dynamic_key_1954172192": "عرض الكل",
    "dynamic_key_1972795761": "تاريخ الإنجاز",
    "dynamic_key_197805234": "توصيات الذكاء الاصطناعي",
    "dynamic_key_1991592213": "رفع ملف",
    "dynamic_key_1999631066": "الرئيسية",
    "dynamic_key_2001555607": "الرد على التقييم",
    "dynamic_key_2009227315": "تم تسجيل مقدمتك الصوتية",
    "dynamic_key_201330750": "• جرب استخدام بطاقة أخرى",
    "dynamic_key_2053478334": "تاريخ النشر",
    "dynamic_key_2071077264": "توظيف الآن",
    "dynamic_key_2071445136": "إرسال طلب السحب",
    "dynamic_key_208308034": "الرصيد المتاح",
    "dynamic_key_2123673725": "لم يتم إنشاء محفظتك بعد",
    "dynamic_key_2132806281": "المهمة:",
    "dynamic_key_2133212330": "مثال عمل 1 (صورة)",
    "dynamic_key_2134028980": "لا توجد تقييمات بعد",
    "dynamic_key_2137084368": "التقييم",
    "dynamic_key_2144569262": "العربية",
    "dynamic_key_214509631": "محفظتي",
    "dynamic_key_215587664": "الاسم كما يظهر في الحساب البنكي",
    "dynamic_key_217425117": "مراسلة",
    "dynamic_key_218823582": "حدث خطأ غير متوقع",
    "dynamic_key_220193727": "مشاركة",
    "dynamic_key_220511911": "مشروع:",
    "dynamic_key_223878144": "رقم الهاتف",
    "dynamic_key_229505028": "الطرف الآخر يكتب الآن",
    "dynamic_key_232051787": "عرض التوصيات",
    "dynamic_key_233190025": "مفيد (",
    "dynamic_key_234965878": "ملاحظة",
    "dynamic_key_236480406": "المدة المتوقعة",
    "dynamic_key_238952578": "عرض التفاصيل",
    "dynamic_key_243096717": "قيد الانتظار",
    "dynamic_key_257908957": "لديه معرض أعمال",
    "dynamic_key_29050573": "سرعة الرد",
    "dynamic_key_300689867": "تم إرسال طلب السحب",
    "dynamic_key_322511046": "professionals already on WorkedIn",
    "dynamic_key_331518742": "إذا استمرت المشكلة، تواصل مع الدعم الفني",
    "dynamic_key_365411007": "خطاب التقديم",
    "dynamic_key_374761519": "جاري التحقق من الدفع...",
    "dynamic_key_380610698": "التقييم العام",
    "dynamic_key_392258297": "رابط صورة العرض",
    "dynamic_key_403517891": "ستحصل على",
    "dynamic_key_418944631": "مثال عمل 2 (صورة)",
    "dynamic_key_41921266": "التقييمات غير متوفرة في هذه المعاينة",
    "dynamic_key_422731376": "عرض مدروس",
    "dynamic_key_426109629": "عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.",
    "dynamic_key_432874841": "الأعلى سعراً",
    "dynamic_key_451961555": "مدة التنفيذ",
    "dynamic_key_452524680": "مدة التسليم",
    "dynamic_key_454607345": "مثال: تصميم واجهات، تطوير واجهات، تحرير صور (افصل بينها بفاصلة)",
    "dynamic_key_475558032": "اسم صاحب الحساب",
    "dynamic_key_476684698": "الترتيب حسب",
    "dynamic_key_480999927": "جاري تحويلك تلقائياً...",
    "dynamic_key_481289425": "لا توجد معاملات بعد",
    "dynamic_key_48695393": "خبير",
    "dynamic_key_48788556": "رجوع",
    "dynamic_key_49410394": "موثق",
    "dynamic_key_49413132": "نجاح",
    "dynamic_key_496366041": "الأقل تقييماً",
    "dynamic_key_50718": "رد",
    "dynamic_key_51299": "لا",
    "dynamic_key_525136044": "خصائص أخرى",
    "dynamic_key_545901654": "يمكنك رفع ملفات بصيغة PDF أو صور حتى 10MB",
    "dynamic_key_549959251": "قيمة العرض",
    "dynamic_key_571944939": "Get started by creating your first project.",
    "dynamic_key_596156750": "تقييم المستقل",
    "dynamic_key_611934998": "مشاريع مكتملة",
    "dynamic_key_614661587": "الإجمالي للدفع",
    "dynamic_key_617719072": "تفاصيل العرض",
    "dynamic_key_623032746": "اللغات",
    "dynamic_key_624028093": "الأحدث",
    "dynamic_key_639337527": "إرسال الرد",
    "dynamic_key_669258706": "تعليقك (اختياري)",
    "dynamic_key_6717295": "أرشفة العرض",
    "dynamic_key_685712071": "تقييمات تفصيلية",
    "dynamic_key_71417736": "سيتم مراجعة طلبك وتحويل المبلغ خلال 2-5 أيام عمل",
    "dynamic_key_72742741": "شارك تجربتك مع هذا الشخص...",
    "dynamic_key_730815621": "الذهاب للعقد",
    "dynamic_key_76026069": "مثال: البنك الوطني الفلاحي",
    "dynamic_key_764967864": "العودة للوحة التحكم",
    "dynamic_key_812168715": "المبلغ المطلوب",
    "dynamic_key_829255241": "ما الذي أعجبك؟ ما الذي يمكن تحسينه؟ هل توصي به للآخرين؟",
    "dynamic_key_831489996": "تم تمويل الضمان بنجاح. الأموال محفوظة حتى اكتمال العمل.",
    "dynamic_key_854531310": "Try adjusting your search or filters to find what you're looking for.",
    "dynamic_key_857615762": "الميزانية",
    "dynamic_key_860054720": "رد المالك",
    "dynamic_key_872049934": "تصفية العروض",
    "dynamic_key_890920977": "رد الموظف:",
    "dynamic_key_891367863": "طلب سحب",
    "dynamic_key_928208723": "قيمة العرض (د.ت)",
    "dynamic_key_934974283": "الموصى به (الأفضل تطابقاً)",
    "dynamic_key_936673124": "تفاصيل الوظيفة",
    "dynamic_key_939059608": "طريقة السحب",
    "dynamic_key_979253881": "اكتب ردك هنا...",
    "dynamic_key_9853380": "عميل متكرر",
    "editJob": {
        "error": "Failed to update job",
        "goBack": "Go to jobs",
        "heroDescription": "Update the details, budget, or visibility of your existing project.",
        "heroTitle": "Edit your project brief",
        "notEditable": "Only open jobs can be edited",
        "notFound": "Job not found",
        "notFoundDescription": "This job may have been deleted or does not exist.",
        "notOwner": "You can only edit your own jobs",
        "saveChanges": "Save Changes",
        "seo": {
            "description": "Update your job posting",
            "title": "Edit Job"
        },
        "steps": {
            "reviewDescription": "Validate the changes before saving."
        },
        "success": "Job updated successfully"
    },
    "error": {
        "jobCard": "فشل تحميل بطاقة الوظيفة",
        "retry": "حاول مرة أخرى",
        "title": "حدث خطأ ما",
        "unexpected": "حدث خطأ غير متوقع أثناء عرض هذا القسم."
    },
    "errors": {
        "generic": {
            "retry": "Try again",
            "title": "Something went wrong"
        },
        "jobCard": {
            "loadFailed": "Failed to load job card"
        }
    },
    "faqPage": {
        "categories": {
            "client": {
                "items": [{"q":"كيف أنشر مشروعاً؟","a":"انقر على \"انشر مشروعاً\"، صف عملك، حدد ميزانيتك والمدة الزمنية، ثم انشرها. ستتلقى عروضاً من الموظفين المستقلين الموثقين."},{"q":"ماذا لو لم أكن راضياً عن العمل؟","a":"إذا لم يستوفي العمل الشروط المتفق عليها، تحصل على استرجاع كامل. تظل الأموال محتفظاً بها في الضمان حتى تعتمد التسليم."},{"q":"كيف يتم حماية أموالي؟","a":"تُحتفظ الأموال بأمان في الضمان. يتلقى الموظف المستقل الدفع فقط عندما توافق على العمل المنجز."}],
                "title": "للعملاء"
            },
            "freelancer": {
                "items": [{"q":"كيف أبدأ كموظف مستقل؟","a":"قم بالتسجيل، أكمل ملفك الشخصي بمهاراتك والمحفظة، ثم ابدأ بتصفح المشاريع المتاحة التي تناسب خبرتك."},{"q":"كم يمكنني أن أربح؟","a":"يعتمد دخلك على المشاريع التي تأخذها والأسعار التي تحددها. يربح العديد من الموظفين التونسيين بين 500-5000 دينار تونسي شهرياً."},{"q":"كيف أتقاضى راتبي؟","a":"يتم الدفع عبر D17 والتحويل البنكي أو طرق دفع محلية أخرى. تحدد طريقة الدفع المفضلة لديك في إعدادات المحفظة."}],
                "title": "للموظفين المستقلين"
            },
            "general": {
                "items": [{"q":"ما هي خدمة.TN؟","a":"خدمة.TN هي سوق توظيف تونسية تربط الشركات بالمحترفين الموهوبين. نحن نؤمن بالدفع العادل والملفات الشخصية الموثقة والمعاملات الآمنة المحمية بالضمان."},{"q":"هل التسجيل مجاني؟","a":"نعم، التسجيل مجاني تماماً للموظفين المستقلين والعملاء. نحن فقط نفرض عمولة صغيرة على المشاريع المنجزة بنجاح."},{"q":"كم من الوقت يستغرق التحقق؟","a":"يستغرق التحقق من الهوية عادةً 24-48 ساعة. يمكنك بدء إعداد ملفك الشخصي فوراً، والتحقق يحدث في الخلفية."}],
                "title": "عام"
            },
            "payment": {
                "items": [{"q":"ما طرق الدفع التي تقبلونها؟","a":"ندعم جميع الطرق المحلية التونسية: البطاقات، D17، التحويل البنكي والنقد بمبالغ صغيرة."},{"q":"متى سأتقاضى راتبي؟","a":"يتم الدفع للموظفين المستقلين في غضون 48 ساعة بعد موافقة العميل وإطلاق الضمان."},{"q":"هل هناك رسوم مخفية؟","a":"لا. رسومنا شفافة وواضحة. نحن فقط نفرض عمولة صغيرة على المشاريع المنجزة."},{"q":"ما هي طرق الدفع المتاحة؟","a":"ندعم حالياً الضمان عبر Dhmad للمعاملات الآمنة. محفظة Flouci و D17 (البريد التونسي) قادمة قريباً. تحافظ Dhmad على أموالك بأمان حتى يتم الموافقة على العمل — نفس النظام المستخدم من قبل Tunisie Freelance."},{"q":"هل Dhmad آمن؟","a":"نعم. Dhmad هي منصة ضمان تونسية مصرح لها بالاحتفاظ بالأموال كطرف ثالث موثوق. أموالك محمية حتى توافق على العمل."},{"q":"متى ستتوفر Flouci و D17؟","a":"نحن نعمل بنشاط على إضافة Flouci و D17. ستتوفر قريباً وسنقوم بإعلام جميع المستخدمين عند إطلاقها."},{"q":"ماذا يحدث في حال وجود نزاع؟","a":"إذا كان هناك خلاف، تحتفظ Dhmad بالأموال حتى يتم حل النزاع. لا يمكن لأي من الطرفين الوصول إلى الأموال حتى تتم تسوية المشكلة."}],
                "title": "الدفع والأرباح"
            },
            "security": {
                "items": [{"q":"هل معلوماتي الشخصية آمنة؟","a":"نعم. نستخدم التشفير ومقاييس الأمان المعيارية. لا يتم مشاركة بياناتك بدون إذنك."},{"q":"لماذا تحتاجون التحقق من الهوية؟","a":"التحقق من الهوية يضمن الثقة والسلامة للموظفين المستقلين والعملاء. كل محترف على خدمة يتم فحصه بالهوية."},{"q":"هل يمكنني البقاء مجهول الهوية؟","a":"لا. يجب التحقق من كل من الموظفين المستقلين والعملاء. هذا يحمي الجميع ويضمن المسؤولية."}],
                "title": "الأمان والخصوصية"
            }
        },
        "page": {
            "contactButton": "اتصل بنا",
            "noAnswer": "لم تجد إجابتك؟",
            "searchPlaceholder": "ابحث عن الأسئلة...",
            "subtitle": "إجابات على الأسئلة الأكثر شيوعاً حول استخدام خدمة.TN",
            "supportReady": "فريق الدعم لدينا مستعد لمساعدتك 24/7",
            "title": "الأسئلة الشائعة"
        }
    },
    "findFreelancers": {
        "activeFilters": "نشط",
        "all": "All",
        "allLocations": "جميع المواقع",
        "anyJobsAmount": "أي عدد من الوظائف",
        "anyJobsAmountDesc": "عرض الجميع",
        "anySuccessRate": "أي نسبة نجاح",
        "anySuccessRateDesc": "عرض جميع المستقلين",
        "availableNow": "متاح الآن",
        "availableNowDesc": "متاح للبدء فوراً",
        "category": "التصنيف",
        "clearAll": "مسح الكل",
        "clearFilters": "مسح جميع الفلاتر",
        "filterTitle": "تصفية البحث",
        "filterToggle": "تصفية النتائج",
        "hero": {
            "badge": "محترفون تونسيون موثقون",
            "subtitle": "أكثر من 2500 مطور، مصمم، مترجم ومستشار تونسي — موثقون، مُقيَّمون، جاهزون.",
            "subtitleDesktop": "",
            "title": "ابحث عن الشخص المناسب،",
            "titleHighlight": "وليس أي شخص."
        },
        "heroStats": {
            "fastReplies": "متوسط التقييم",
            "talentPool": "ملفات موثقة",
            "verified": "هوية متحقق منها"
        },
        "hourlyRate": "السعر بالساعة (د.ت)",
        "jobSuccessRate": "نسبة نجاح العمل",
        "jobs10plus": "10 وظائف فأكثر",
        "jobs10plusDesc": "مستقل متمرس",
        "jobs1plus": "وظيفة واحدة فأكثر",
        "jobs1plusDesc": "لديه خبرة في السوق",
        "jobs5plus": "5 وظائف فأكثر",
        "jobs5plusDesc": "سجل حافل",
        "jobsCompleted": "الوظائف المنجزة",
        "location": "الموقع",
        "max": "أقصى",
        "min": "أدنى",
        "nLocations": "{{count}} مواقع",
        "noMatchesFound": "لا توجد نتائج",
        "noResults": {
            "action": "مسح جميع الفلاتر",
            "description": "لم نعثر على مستقلين يطابقون معاييرك. جرّب كلمات أخرى أو امسح الفلاتر.",
            "title": "لا توجد نتائج مطابقة"
        },
        "noSkillsFound": "لا توجد مهارات مطابقة",
        "rate80up": "80% وأكثر",
        "rate80upDesc": "ثبات على مستوى عالٍ",
        "rate90up": "90% وأكثر",
        "rate90upDesc": "محترفون بتقييم عالٍ جداً",
        "rateAny": "أي سعر",
        "rating": "Min Rating",
        "resultStats": {
            "availableNow": "متاحون الآن",
            "averageRate": "متوسط السعر",
            "topRating": "أعلى تقييم"
        },
        "resultsCount": "عرض {{count}} نتيجة",
        "searchLocations": "ابحث عن الموقع...",
        "searchPlaceholder": "ابحث عن مستقلين...",
        "searchSkills": "ابحث عن مهارة...",
        "skills": "المهارات",
        "sort": {
            "label": "الترتيب حسب:",
            "priceLow": "الأقل سعراً",
            "rating": "الأعلى تقييماً",
            "recommended": "الأكثر ملاءمة"
        },
        "status": "Status",
        "to": "إلى",
        "toasts": {
            "removedFromSaved": "Removed from saved freelancers",
            "savedFreelancer": "Saved freelancer",
            "updateSavedFailed": "Could not update saved freelancers"
        },
        "verifiedOnly": "هوية موثقة فقط",
        "verifiedOnlyDesc": "الأعلى تقييماً (4.5+)"
    },
    "footer": {
        "about": "من نحن",
        "city": "تونس العاصمة، تونس",
        "contact": "اتصل بنا",
        "copyright": "(c) 2026 WorkedIn.tn - جميع الحقوق محفوظة",
        "description": "منصة للمحترفين في تونس، بهويات موثقة، ومدفوعات محمية بالضمان، ومشاريع تُدفع بالدينار التونسي.",
        "faq": "الأسئلة",
        "legal": "قانوني",
        "madeInTunisia": "صُنع في تونس.",
        "newsletterAction": "اشترك",
        "newsletterDescription": "احصل على تحديثات المنتج والإطلاقات الجديدة وأهم تغييرات الثقة والدفع من خدمة.",
        "newsletterPlaceholder": "بريدك الإلكتروني",
        "newsletterTitle": "مستجدات المنصة",
        "privacy": "الخصوصية",
        "quickLinks": "روابط سريعة",
        "socialFacebook": "فيسبوك",
        "socialInstagram": "إنستغرام",
        "socialLinkedin": "لينكدإن",
        "socialTwitter": "إكس",
        "subscribed": "You're subscribed!",
        "terms": "الشروط"
    },
    "forClients": {
        "benefits": {
            "local": {
                "desc": "تعامل مع أشخاص يفهمون السوق المحلي واللغة والثقافة.",
                "title": "محترفون تونسيون"
            },
            "secure": {
                "desc": "الأموال محتجزة في الضمان. تُحرر فقط عند موافقتك.",
                "title": "ادفع عند رضاك"
            },
            "speed": {
                "desc": "انشر مشروعك واستقبل عروضاً موثوقة في نفس اليوم.",
                "title": "توظيف في 24 ساعة"
            }
        },
        "categories": {
            "items": {
                "admin": "فيديو وأنيميشن",
                "data": "تعليم",
                "design": "تصميم وإبداع",
                "dev": "تطوير وبرمجة",
                "finance": "هندسة",
                "marketing": "مبيعات وتسويق",
                "video": "دعم",
                "writing": "كتابة وترجمة"
            },
            "title": "كل المهارات. منصة واحدة."
        },
        "cta": {
            "button": "إنشاء حساب عميل مجاني",
            "text": "أكثر من 2500 محترف موثق جاهزون للعمل. انشر مشروعك مجاناً — بدون اشتراك، بدون التزام.",
            "title": "مشروعك القادم يبدأ هنا."
        },
        "hero": {
            "badge": "وظّف محترفين تونسيين موثوقين",
            "cta": "انشر مشروعك — مجاناً",
            "secondary": "اكتشف كيف يعمل",
            "subtitle": "انشر مجاناً. استقبل عروضاً من محترفين موثوقين. ادفع فقط عند موافقتك — كل مدفوعة محمية بالضمان.",
            "title": "مشروعك، منجَز.",
            "titleHighlight": "في الوقت. في الميزانية."
        },
        "talent": {
            "title": "من ستعمل معهم"
        }
    },
    "globalSearch": {
        "clearSearch": "مسح البحث",
        "freelancers": "المستقلون",
        "jobs": "الوظائف",
        "noResultsFor": "لا توجد نتائج مطابقة لـ \"{{query}}\"",
        "placeholder": "ابحث في الوظائف، المستقلين، والمهارات...",
        "recent": "عمليات البحث الأخيرة",
        "searching": "جارٍ البحث...",
        "suggestions": "اقتراحات",
        "toNavigate": "للتنقل",
        "toSelect": "للاختيار"
    },
    "hero": {
        "activity": {
            "eyebrow": "نشاط المنصة الحي",
            "metrics": {
                "activeProjects": "المشاريع النشطة",
                "avgProjectValue": "متوسط قيمة المشروع",
                "projectsCompleted": "المشاريع المكتملة",
                "verifiedFreelancers": "المستقلون الموثقون"
            },
            "tag": "متاح الآن في تونس",
            "title": "عمل حقيقي. مدفوعات حقيقية."
        },
        "badge": "صُنع في تونس. لتونس.",
        "ctaClient": "انشر مشروعك مجاناً",
        "ctaFreelancer": "ابدأ الكسب اليوم",
        "headlineHighlight": "بأجر عادل",
        "headlineStart": "حيث يلتقي الموهوب",
        "rating": "4.9/5 — مُقيَّم من مستقلين وعملاء موثوقين",
        "socialProof": "أكثر من 2500 محترف يعملون بالفعل على خدمة",
        "stats": {
            "escrow": "دينار في الضمان",
            "professionals": "محترفون نشطون",
            "projects": "مشاريع مكتملة"
        },
        "subtitle": "بدون مزايدات. بدون وسطاء. انشر مشروعك، اتفق على الشروط، واستلم أجرك بالدينار التونسي — محمي بالضمان.",
        "title": "حيث يلتقي الموهوب بأجر عادل",
        "trust": {
            "secure": "مدفوعات محمية بالضمان",
            "secureBody": "تُحتجز الأموال بأمان وتُحرر فقط عند الموافقة على العمل.",
            "users": "مستخدم",
            "verified": "محترفون موثوق هويتهم",
            "verifiedBody": "كل مستقل يخضع لتحقق الهوية قبل قبول أول مشروع."
        }
    },
    "heroSection": {
        "auth": {
            "dashboard": "الذهاب للوحة التحكم",
            "welcomeBack": "مرحباً بعودتك، {{name}} 👋"
        },
        "client": {
            "cta": "وظّف خبيراً",
            "eyebrow": "مشروع تونسي. جاهز للتوظيف الجاد.",
            "features": {
                "manage": {
                    "subtitle": "تبقى الدفعات محمية حتى الموافقة",
                    "title": "إدارة المراحل مع الضمان"
                },
                "post": {
                    "subtitle": "لا توجد حروب المزاد الصاخبة، فقط ردود عالية الجودة",
                    "title": "انشر مرة واحدة واحصل على عروض ذات صلة"
                },
                "review": {
                    "subtitle": "تظهر إشارات الثقة قبل الرسالة الأولى",
                    "title": "راجع الملفات الشخصية المحلية الموثقة"
                }
            },
            "panelTitle": "لماذا WorkedIn",
            "promise": "عرض أفضل يساعد العملاء الجادين على الثقة في المنصة قبل نشر المشروع.",
            "secondary": "تصفح الكفاءات",
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "متخصصون"
                },
                "projects": {
                    "default": "120",
                    "label": "مشاريع مفتوحة"
                },
                "trust": {
                    "label": "متوسط درجة الثقة",
                    "value": "4.9/5"
                }
            },
            "subtitle": "أضف مشروعك، لا تخاطر بوقتك، وظّف كفاءات موثقة فقط.",
            "titleAccent": "واعمل مع النخبة.",
            "titleTop": "تجاوز الهواة.",
            "trust": {
                "escrow": "ضمان محمي",
                "faster": "توظيف أسرع",
                "verified": "ملفات تعريف موثقة"
            }
        },
        "freelancer": {
            "cta": "ابدأ الربح اليوم",
            "eyebrow": "مشروع تونسي. موجه للتونسيين.",
            "features": {
                "apply": {
                    "subtitle": "وظائف تناسب مستوى مهاراتك وسعرك",
                    "title": "تقدم للمشاريع المتطابقة"
                },
                "track": {
                    "subtitle": "كل شيء في مكان واحد، محمي بالضمان",
                    "title": "تتبع المراحل والرواتب"
                },
                "verify": {
                    "subtitle": "بناء الثقة قبل أن تقول كلمة واحدة",
                    "title": "أظهر حالة التحقق"
                }
            },
            "panelTitle": "كيف يعمل",
            "promise": "عرض أفضل يساعد الموظفين المستقلين الرائعين على الظهور بمصداقية قبل أن يقولوا كلمة واحدة.",
            "secondary": "تصفح المشاريع",
            "stats": {
                "contracts": {
                    "default": "120",
                    "label": "عقود منجزة"
                },
                "professionals": {
                    "default": "2,500",
                    "label": "متخصصون"
                },
                "rating": {
                    "label": "متوسط التقييم",
                    "value": "4.9/5"
                }
            },
            "subtitle": "بدون مزادات. بدون وسطاء. انشر مشروعاً، اتفق على الشروط، واحصل على رواتب بالدينار التونسي - محمي بالضمان.",
            "titleAccent": "رواتب عادلة.",
            "titleTop": "حيث يتقاضى الموهوبون التونسيون",
            "trust": {
                "matched": "عمل متطابق",
                "payouts": "رواتب محمية",
                "reputation": "بناء السمعة"
            }
        },
        "liveBadge": "مباشر",
        "promise": {
            "label": "وعد خدمة"
        },
        "typewriter": {
            "client": {
                "qualityCollaboration": "تعاون بجودة عالية.",
                "securePayments": "مدفوعات آمنة.",
                "trustedConnections": "علاقات موثوقة."
            },
            "freelancer": {
                "buildYourCareer": "ابنِ مسيرتك.",
                "getPaidOnTime": "احصل على مستحقاتك في وقتها.",
                "workWithBest": "اعمل مع الأفضل."
            }
        }
    },
    "home": {
        "sections": {
            "categories": {
                "badge": "التخصصات",
                "subtitle": "اكتشف المهارات المطلوبة في السوق التونسي."
            },
            "cta": {
                "badge": "ابدأ الآن",
                "btnStart": "أنشئ حسابك",
                "btnWatch": "اكتشف كيف يعمل",
                "subtitle": "سواء كنت مستقلاً أو عميلاً، خدمة تمنحك مساراً أوضح من أول مشروع إلى آخر دفعة.",
                "title": "ابدأ من تونس. واشتغل بثقة."
            },
            "howItWorks": {
                "badge": "كيف يعمل",
                "clientDesc": "اعثر على المحترف المناسب بسرعة",
                "freelancerDesc": "ابنِ حضورك وابدأ الكسب",
                "subtitle": "أربع خطوات واضحة تربط بين الفكرة، التنفيذ، والدفع بثقة."
            },
            "testimonials": {
                "badge": "قصص نجاح",
                "earned": "ربح"
            }
        },
        "stats": {
            "activeJobs": "مهمة نشطة",
            "live": "إحصائيات مباشرة",
            "rating": "تقييم",
            "users": "مستخدم"
        }
    },
    "howItWorks": {
        "brandName": "خدمة",
        "clientSteps": {
            "step1": {
                "description": "صف العمل، حدد ميزانيتك، اختر ثابتاً أو بالساعة.",
                "title": "انشر في دقيقتين"
            },
            "step2": {
                "description": "كل مستقل موثق الهوية. صَفِّ حسب التقييم، المهارة، والسعر.",
                "title": "راجع العروض الموثوقة"
            },
            "step3": {
                "description": "تسليمات واضحة، مواعيد نهائية، وتقدم — كل شيء في مكان واحد.",
                "title": "تتبع المراحل لا التخمينات"
            },
            "step4": {
                "description": "وافق على العمل، حرر الأموال من الضمان، قيّم التجربة.",
                "title": "حرر الدفع، اترك تقييماً"
            }
        },
        "cta": {
            "client": "انشر مشروعك مجاناً",
            "freelancer": "ابدأ الكسب اليوم"
        },
        "faq": {
            "item1": {
                "a": "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successful projects.",
                "q": "Is registration free?"
            },
            "item2": {
                "a": "WorkedIn acts as a trusted intermediary. Clients pay us, we hold funds until delivery is approved, then release to the freelancer.",
                "q": "How is my money secured?"
            },
            "item3": {
                "a": "A",
                "q": "What payment methods?"
            },
            "item4": {
                "a": "Yes, you can register a company account to hire staff or offer services as a team.",
                "q": "Can I register as a company?"
            },
            "items": {
                "item1": {
                    "a": "نعم، التسجيل مجاني بالكامل للمستقلين والعملاء. نأخذ عمولة صغيرة فقط عند إنجاز المشروع بنجاح.",
                    "q": "هل التسجيل مجاني؟"
                },
                "item2": {
                    "a": "تعمل خدمة كوسيط موثوق. يدفع العميل المبلغ إلى المنصة، ويُحتجز حتى تسليم العمل والموافقة عليه.",
                    "q": "كيف تُحمى أموالي؟"
                },
                "item3": {
                    "a": "ندعم وسائل الدفع المحلية في تونس مثل البطاقات، D17، التحويل البنكي، وحتى الدفع النقدي للحالات المناسبة.",
                    "q": "ما وسائل الدفع المتاحة؟"
                },
                "item4": {
                    "a": "نعم، يمكنك إنشاء حساب شركة لتوظيف محترفين أو تقديم خدماتك كفريق.",
                    "q": "هل يمكن التسجيل كشركة؟"
                }
            },
            "title": "أسئلة شائعة"
        },
        "freelancerSteps": {
            "step1": {
                "description": "أضف مهاراتك، محفظتك، وسعرك. يجدك العملاء — بدون مزايدة.",
                "title": "أنشئ ملفك مرة واحدة"
            },
            "step2": {
                "description": "يعرضك نظامنا على العملاء الباحثين عن مهاراتك تحديداً.",
                "title": "احصل على مشاريع حقيقية"
            },
            "step3": {
                "description": "تحدث، تفاوض، وحدد النطاق قبل أي تحريك للأموال.",
                "title": "اتفق على الشروط وابدأ العمل"
            },
            "step4": {
                "description": "الأموال في الضمان منذ اليوم الأول. وافق على المرحلة — واستلم دينارك.",
                "title": "احصل على أجرك عند الموافقة"
            }
        },
        "heroTitle": "بسيط في التصميم.",
        "heroTitleHighlight": "آمن بالافتراضي.",
        "subtitle": "أربع خطوات من فكرة المشروع إلى استلام الدفع — كل خطوة محمية، كل دينار محسوب.",
        "tabs": {
            "client": "للعملاء",
            "freelancer": "للمستقلين"
        },
        "title": "كيف تعمل خدمة",
        "trust": {
            "money": {
                "desc": "إذا لم يطابق العمل الشروط المتفق عليها، تسترجع دينارك كاملاً.",
                "title": "استرجاع كامل عند عدم الرضا"
            },
            "support": {
                "desc": "بشر حقيقيون، توقيت محلي، وثلاث لغات.",
                "title": "دعم بالعربية والفرنسية والإنجليزية"
            },
            "verified": {
                "desc": "نتحقق من بطاقة الهوية الوطنية قبل ظهور أي مستقل على خدمة.",
                "title": "كل محترف موثق الهوية"
            }
        }
    },
    "howItWorksSection": {
        "badge": "كيف نعمل",
        "heading": "من التسجيل إلى الراتب في 4 خطوات.",
        "steps": {
            "1": {
                "step": "01",
                "subtitle": "اضبط مهاراتك وسعرك والمحفظة في دقائق.",
                "title": "أنشئ ملفك الشخصي"
            },
            "2": {
                "step": "02",
                "subtitle": "تصفح المشاريع التي تناسب خبرتك.",
                "title": "تقدم للوظائف المتطابقة"
            },
            "3": {
                "step": "03",
                "subtitle": "فاوض مباشرة. لا وسطاء.",
                "title": "اتفق على الشروط"
            },
            "4": {
                "step": "04",
                "subtitle": "يتم الإفراج عن الأموال عبر الضمان عند الموافقة.",
                "title": "احصل على الراتب بأمان"
            }
        }
    },
    "inviteModal": {
        "alreadyApplied": "This freelancer has already applied to this job. You can hire them directly from the proposals.",
        "createNew": "Create a new job for this freelancer",
        "description": "Description",
        "error": "Failed to send offer. Please try again.",
        "existingJobs": "Your Open Jobs",
        "hire": "Hire",
        "noJobs": "You have no open jobs at the moment.",
        "success": "Success",
        "title": "Hire or Invite Freelancer"
    },
    "job": {
        "bankTransfer": "تحويل بنكي",
        "budget": "الميزانية",
        "budgetHelp": "أدخل ميزانيتك الإجمالية",
        "cash": "كاش عند التسليم",
        "d17": "D17",
        "deadline": "موعد التسليم",
        "description": "وصف المهمة",
        "descriptionPlaceholder": "اشرح المهمة بالتفصيل...",
        "estimatedTime": "خلال ساعة",
        "matchesFound": "تم إيجاد 3 موظفين!",
        "matching": "جاري البحث عن موظفين...",
        "paymentMethod": "طريقة الدفع",
        "postJob": "نشر المهمة",
        "preview": "معاينة",
        "requiredSkills": "المهارات المطلوبة",
        "saveDraft": "حفظ كمسودة",
        "title": "عنوان المهمة",
        "titlePlaceholder": "مثال: تصميم لوجو لمطعم",
        "within1Day": "خلال يوم",
        "within1Week": "خلال أسبوع",
        "within3Days": "خلال 3 أيام"
    },
    "jobDetail": {
        "aboutClient": "عن العميل",
        "approxHours": {
            "replace": "Replace"
        },
        "attachmentLabel": "مرفق {{index}}",
        "attachments": "الملفات المرفقة",
        "avgHourlyPaid": "متوسط سعر الساعة المدفوع",
        "avgHourlyPaidFormat": "{{rate}} د.ت/ساعة",
        "balance": "المستخدم اليوم",
        "browseJobs": "تصفح الوظائف",
        "budget": "الميزانية",
        "cannotApplyTitle": "لا يمكن التقديم بعد",
        "category": {
            "data": "بيانات",
            "design": "تصميم",
            "development": "برمجة",
            "marketing": "تسويق",
            "other": "أخرى",
            "translation": "ترجمة",
            "video": "فيديو",
            "writing": "كتابة"
        },
        "clientCantApplyTitle": "حسابات العملاء لا يمكنها التقديم",
        "clientRatingText": "{{rating}} من أصل 5 تقييمات",
        "clientVerifications": "التوثيقات",
        "completeNow": "أكمل الآن",
        "completeOnboardingTitle": "أكمل إعداد الحساب أولاً",
        "completeProfileTitle": "أكمل ملفك الشخصي",
        "confirmWithdrawal": "تأكيد السحب",
        "dailyApplyAvailable": "متاح اليوم",
        "dailyApplyLimitDescription": "لتقليل الرسائل المزعجة، يمكنك إرسال حتى {{limit}} عروض يومياً.",
        "dailyApplyLimitReached": "لقد وصلت إلى الحد اليومي وهو {{limit}} طلبات. يمكنك المحاولة مرة أخرى غداً.",
        "dailyApplyLimitTitle": "الحد اليومي للتقديم",
        "dailyApplyReached": "تم بلوغ الحد",
        "dailyApplyRemainingHint": "متبقٍ {{remaining}} طلبات تقديم اليوم.",
        "dailyApplyResetHint": "تم الوصول إلى الحد اليومي. يمكنك التقديم مرة أخرى غداً.",
        "deadline": "الموعد النهائي",
        "defaultCity": "تونس",
        "defaultClient": "عميل",
        "defaultMemberSince": "مارس 2026",
        "defaultTotalSpent": "أكثر من 15 ألف د.ت",
        "description": "وصف المشروع",
        "emailAddressVerified": "البريد الإلكتروني موثق",
        "error": "حدث خطأ",
        "experience": {
            "beginner": "مبتدئ",
            "expert": "خبير",
            "intermediate": "متوسط"
        },
        "file": "ملف {{index}}",
        "fileType": "ملف",
        "fixedPrice": "سعر ثابت",
        "hireRate": "معدل التوظيف",
        "hourly": "بالساعة",
        "inlineRechargingHint": "إعادة الشحن خلال",
        "inlineRemainingHint": "متبقي {{remaining}} تقديمات متاحة",
        "insufficientBalance": "تم الوصول إلى الحد اليومي",
        "jobNotFound": "الوظيفة غير موجودة",
        "jobRemoved": "تم إزالة الوظيفة من المحفوظات",
        "jobSaved": "تم حفظ الوظيفة",
        "jobStats": "إحصائيات الوظيفة",
        "limit": "الحد",
        "linkCopied": "تم نسخ الرابط",
        "loginRequiredTitle": "سجل الدخول للتقديم",
        "loginToSave": "سجل الدخول لحفظ الوظيفة",
        "manageJob": "إدارة الوظيفة",
        "memberSince": "عضو منذ",
        "openFile": "فتح الملف",
        "paymentMethodVerified": "طريقة الدفع موثقة",
        "perHour": "/ساعة",
        "phoneNumberVerified": "رقم الهاتف موثق",
        "postedJobs": "الوظائف المنشورة",
        "postedLabel": "نُشرت",
        "proposalAccepted": "تم قبول عرضك",
        "proposalAcceptedStatus": "مقبول",
        "proposalDeclined": "تم رفض عرضك",
        "proposalDeclinedStatus": "مرفوض",
        "proposalError": "حدث خطأ في إرسال العرض",
        "proposalPendingStatus": "معلق",
        "proposalSent": "تم إرسال العرض بنجاح!",
        "proposalSubmitted": "تم تقديم عرضك",
        "proposalWithdrawn": "تم سحب العرض بنجاح",
        "proposalWithdrawnStatus": "مسحوب",
        "proposalWithdrawnTitle": "تم سحب عرضك",
        "proposals": "العروض",
        "rating": "التقييم",
        "readyToSubmit": "جاهز للتقديم",
        "referenceLinks": "الروابط المرجعية",
        "remaining": "المتبقي",
        "removeFromSaves": "إلغاء الحفظ",
        "reportJob": "الإبلاغ عن هذه الوظيفة",
        "reportJobDescription": "أخبرنا لماذا تنتهك هذه الوظيفة إرشادات المجتمع الخاصة بنا.",
        "reportJobTitle": "الإبلاغ عن وظيفة",
        "reportReason": {
            "fraud": "احتيال",
            "inappropriate": "غير لائق",
            "misleading": "مضلل",
            "other": "أخرى",
            "spam": "محتوى غير مرغوب فيه"
        },
        "required": "الحد اليومي",
        "requiredSkills": "المهارات المطلوبة",
        "saveJob": "حفظ هذه الوظيفة",
        "shareJob": "مشاركة هذه الوظيفة",
        "signIn": "تسجيل الدخول",
        "similarJobs": "وظائف مشابهة",
        "submissionRequirements": "متطلبات التقديم",
        "submitProposal": "إرسال عرض",
        "submitReport": "تقديم البلاغ",
        "switchToFreelancer": "التبديل إلى مستقل",
        "timeAgo": {
            "day": "منذ {{count}} يوم",
            "hour": "منذ {{count}} ساعة",
            "minute": "منذ {{count}} دقيقة",
            "month": "منذ {{count}} شهر",
            "week": "منذ {{count}} أسبوع"
        },
        "totalSpending": "إجمالي الإنفاق",
        "used": "المستخدم",
        "viewProfile": "عرض الملف الشخصي",
        "viewProposal": "عرض العرض",
        "views": "المشاهدات",
        "withdrawConfirmDesc": "هل أنت متأكد من رغبتك في سحب هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.",
        "withdrawError": "حدث خطأ في سحب العرض",
        "withdrawProposal": "سحب العرض",
        "yesWithdraw": "نعم، اسحب العرض",
        "yourBid": "عرضك:",
        "yourJob": "هذه وظيفتك"
    },
    "jobMatches": {
        "contractCreated": "تم بدء العقد بنجاح!",
        "contractError": "حدث خطأ في إنشاء العقد",
        "searchError": "حدث خطأ في البحث عن تطابقات"
    },
    "jobProposals": {
        "addedToShortlist": "تمت الإضافة إلى القائمة المختصرة",
        "aiDesc": "قمنا بتحليل متطلباتك وعثرنا على 3 مستقلين يتطابقون مع مشروعك بنسبة 95%.",
        "aiTitle": "توصيات الذكاء الاصطناعي",
        "allProposals": "كل العروض",
        "archiveError": "فشل أرشفة العرض",
        "archived": "مؤرشفة",
        "clearFilters": "مسح الفلاتر",
        "days": "أيام",
        "defaultCountry": "تونس",
        "defaultFreelancer": "مستقل",
        "defaultUser": "مستخدم",
        "deliveryTbd": "غير محدد",
        "durationOngoing": "Ongoing",
        "edit": "تعديل",
        "expectedDuration": "المدة المتوقعة",
        "extraFilters": "فلاتر أخرى",
        "filterAndShow": "تصفية وعرض",
        "filterTitle": "تصفية العروض",
        "freelancerLevel": "مستوى المستقل",
        "hasPortfolio": "لديه أعمال",
        "highRated": "4 نجوم فأكثر",
        "hire": "توظيف",
        "hireDisabled": "Cannot hire declined proposal",
        "hireError": "فشل توظيف المستقل. حاول مرة أخرى",
        "hireFirst": "يجب توظيف المستقل أولاً لبدء المحادثة",
        "hireSuccess": "تم توظيف المستقل بنجاح! 🎉",
        "interviews": "مقابلات",
        "jobDetails": "تفاصيل الوظيفة",
        "jobsDone": "مشروع منجز",
        "loadJobError": "فشل تحميل بيانات المشروع",
        "loadProposalsError": "فشل تحميل العروض",
        "loading": "تحميل...",
        "message": "محادثة",
        "modal": {
            "about": "نبذة شخصية",
            "accepted": "مقبول",
            "archive": "أرشفة العرض",
            "attachments": "المرفقات",
            "available": "متاح للعمل",
            "busy": "مشغول حالياً",
            "confirmHire": "توظيف هذا المستقل؟",
            "confirmHireDesc": "سيتم إنشاء عقد والاحتفاظ بالدفع في حساب الضمان.",
            "confirmYes": "نعم، وظّفه!",
            "coverLetter": "خطاب التقديم",
            "delivery": "مدة التسليم",
            "escrowNote": "الدفع معلق بشكل آمن في حساب الضمان حتى يتم تسليم العمل والموافقة عليه.",
            "freelancer": "مستقل",
            "freelancerBid": "قيمة العرض",
            "jobsDone": "المشاريع المكتملة",
            "noPortfolio": "لا توجد أعمال في المعرض",
            "noPortfolioHint": "لم يضف المستقل أي أعمال بعد.",
            "noProfile": "لا توجد معلومات شخصية متاحة.",
            "noReviews": "لا توجد تقييمات بعد",
            "noReviewsHint": "تظهر التقييمات بعد إتمام العقود.",
            "proposalDetails": "تفاصيل العرض",
            "rating": "التقييم",
            "reject": "Decline",
            "rejected": "غير مختار",
            "responseTime": "سرعة الرد",
            "responseTimeValue": "ساعة تقريباً",
            "reviews": "التقييمات",
            "serviceFee": "رسوم الخدمة (5%)",
            "submittedOn": "تم التقديم في",
            "successRate": "نسبة النجاح",
            "tabPortfolio": "معرض الأعمال",
            "tabProfile": "الملف الشخصي",
            "tabProposal": "العرض",
            "tabReviews": "التقييمات",
            "total": "الإجمالي للدفع",
            "unarchive": "إلغاء أرشفة العرض"
        },
        "new": "جديدة",
        "noCoverLetter": "لم يتم تقديم خطاب تقديم.",
        "noProposals": "لا توجد عروض بعد",
        "noProposalsDesc": "لم تتلقى أي عروض لهذا المشروع حتى الآن. جرب مشاركة المشروع لزيادة المشاهدات.",
        "open": "مفتوح",
        "proposalAccepted": "تم قبول عرضك!",
        "proposalArchived": "تم أرشفة العرض",
        "proposalBid": "مبلغ العرض",
        "proposalUnarchived": "تمت إعادة العرض إلى النشط",
        "proposals": "عروض",
        "readMore": "قراءة المزيد",
        "receivedOn": "تم الاستلام",
        "removedFromShortlist": "تمت الإزالة من القائمة المختصرة",
        "save": "حفظ",
        "saved": "محفوظ",
        "searchPlaceholder": "البحث في العروض...",
        "share": "مشاركة",
        "shareProject": "مشاركة المشروع",
        "shortlist": "القائمة المختصرة",
        "shortlistError": "حدث خطأ أثناء تحديث القائمة المختصرة",
        "shortlisted": "في القائمة المختصرة",
        "showLess": "عرض أقل",
        "sort": {
            "highestBid": "أعلى سعر",
            "label": "Sort proposals",
            "lowestBid": "أقل سعر",
            "newest": "الأحدث",
            "rating": "الأعلى تقييماً",
            "recommended": "الأنسب"
        },
        "sortBy": "ترتيب حسب",
        "successRate": "معدل النجاح",
        "topRated": "الأعلى تقييماً",
        "unarchive": "استعادة",
        "unarchiveError": "فشلت استعادة العرض",
        "verified": "موثق",
        "verifiedOnly": "حسابات موثقة فقط",
        "viewJob": "عرض الوظيفة",
        "viewSuggestions": "عرض الاقتراحات"
    },
    "jobs": {
        "apply": "قدم الآن",
        "budget": "الميزانية",
        "empty": {
            "action": "مسح الفلاتر",
            "subtitle": "جرب تغيير معايير البحث أو الفلاتر",
            "title": "لا توجد وظائف"
        },
        "filters": {
            "budget": {
                "all": "الكل",
                "max": "إلى",
                "min": "من",
                "ranges": {
                    "r0_50": "0 - 50 د.ت",
                    "r100_250": "100 - 250 د.ت",
                    "r250_500": "250 - 500 د.ت",
                    "r500_plus": "500+ د.ت",
                    "r50_100": "50 - 100 د.ت"
                },
                "title": "الميزانية (د.ت)"
            },
            "categories": {
                "business": "أعمال",
                "data": "بيانات",
                "design": "تصميم",
                "development": "برمجة",
                "marketing": "تسويق",
                "other": "أخرى",
                "title": "التصنيف",
                "translation": "ترجمة",
                "video": "فيديو وتحريك",
                "writing": "كتابة"
            },
            "clearAll": "مسح الكل",
            "clearAria": "Clear all filters",
            "closeAria": "Close filters",
            "experience": {
                "entry": "مبتدئ",
                "expert": "خبير",
                "intermediate": "متوسط",
                "title": "مستوى الخبرة"
            },
            "jobType": {
                "fixed_price": "سعر ثابت",
                "hourly": "بالساعة",
                "title": "نوع العمل"
            },
            "postedDate": {
                "any": "أي وقت",
                "d3": "آخر 3 أيام",
                "h24": "آخر 24 ساعة",
                "m1": "آخر شهر",
                "title": "تاريخ النشر",
                "w1": "آخر أسبوع"
            },
            "title": "تصفية النتائج",
            "viewResults": "عرض النتائج"
        },
        "hourlyRate": "سعر الساعة",
        "loadError": "فشل تحميل الوظائف",
        "loadMore": "تحميل المزيد",
        "location": {
            "remote": "عن بعد"
        },
        "new": {
            "actions": {
                "next": "التالي",
                "previous": "السابق",
                "publishJob": "نشر الوظيفة",
                "saveDraft": "حفظ كمسودة"
            },
            "autosave": {
                "lastSaved": "آخر حفظ: {{time}}",
                "notSaved": "لم يتم الحفظ بعد",
                "ready": "الحفظ التلقائي جاهز",
                "saved": "تم الحفظ",
                "savedAt": "تم الحفظ عند {{time}}",
                "saving": "جاري الحفظ..."
            },
            "currentPhase": "المرحلة الحالية",
            "errors": {
                "attachmentsPartial": "Attachments Partial",
                "attachmentsUnavailable": "تعذر رفع المرفقات حالياً. سيتم نشر المهمة بدونها.",
                "attachmentsUploadFailed": "Attachments upload failed. Please retry with smaller or different files.",
                "dbError": "Db Error",
                "loginRequired": "يجب تسجيل الدخول لنشر وظيفة",
                "saveFailed": "حدث خطأ أثناء حفظ الوظيفة",
                "stepIncomplete": "يرجى إكمال الحقول المطلوبة قبل المتابعة.",
                "titleRequiredForDraft": "يرجى إدخال عنوان الوظيفة لحفظ المسودة"
            },
            "expertTips": {
                "budgetModelLabel": "نموذج الميزانية:",
                "budgetModelText": "اختر السعر الثابت للمشاريع المحددة، والأجر بالساعة للمشاريع الديناميكية.",
                "deadlineBufferLabel": "هامش الموعد النهائي:",
                "deadlineBufferText": "تحديد تاريخ واقعي يشجع على تقديم طلبات ذات جودة عالية.",
                "inviteOnlyLabel": "الدعوة فقط:",
                "inviteOnlyText": "الأنسب للمشاريع الحساسة أو عندما تختار المستقلين بنفسك.",
                "lockStructureLabel": "تأكيد الهيكل:",
                "lockStructureText": "تحقق من كل المواصفات. الهيكل الأساسي يُحسم عند النشر لضمان اتساق العروض.",
                "publicBriefsLabel": "الإعلانات العامة:",
                "publicBriefsText": "ممتازة للحصول على أكبر عدد من العروض وتنافسية الأسعار.",
                "richContextLabel": "سياق غني:",
                "richContextText": "أضف معايير واضحة للنطاق والمخرجات النهائية ومعايير النجاح.",
                "specificTitleLabel": "عنوان دقيق:",
                "specificTitleText": "صف بالضبط ما تحتاجه. العنوان الواضح يجذب المتخصصين المناسبين فوراً."
            },
            "expertTipsTitle": "نصائح الخبراء",
            "fields": {
                "attachments": "المرفقات (اختياري)",
                "attachmentsDrop": "اسحب الملفات هنا أو اضغط للتصفح",
                "attachmentsHint": "PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - حد أقصى 10MB لكل ملف",
                "attachmentsHint2": "قدم الأصول والنماذج أو المواصفات التفصيلية لتوضيح المخرجات المطلوبة.",
                "categoryHint": "اختر التصنيف الأنسب لتفعيل تنبيهات مطابقة الخبراء تلقائياً.",
                "charCount": "{{current}} / {{max}} حرف",
                "chooseFiles": "اختيار الملفات",
                "description": "وصف المشروع",
                "descriptionHint": "اشرح نطاق العمل، المعايير المتوقعة، وكيف تبدو المخرجات الناجحة.",
                "descriptionPlaceholder": "أضف خلفية تفصيلية، الجمهور المستهدف، المواصفات التقنية، والمخرجات الرئيسية...",
                "mainCategory": "التصنيف الرئيسي",
                "requiredSkills": "المهارات المطلوبة (بحد أقصى 5)",
                "selectCategory": "اختر التصنيف",
                "selectSubcategory": "اختر التخصص الفرعي",
                "skillsHint": "حدد المهارات الدقيقة لاستهداف المستقلين المتخصصين ودعوتهم مباشرةً.",
                "skillsPlaceholder": "جرب: تصميم جرافيك، React، تحريك رسومي...",
                "subcategory": "التخصص الفرعي",
                "subcategoryHint": "حدد التخصص الدقيق لتصفية العروض وضمان دقة مطابقة المهارات.",
                "suggested": "مقترح:",
                "title": "عنوان المشروع",
                "titleHint": "استخدم مصطلحات تقنية دقيقة لمساعدة المستقلين المناسبين في العثور عليك.",
                "titlePlaceholder": "مثال: نظام هوية بصرية ثنائية اللغة لمقهى تونسي"
            },
            "heroDescription": "تحرك عبر مراحل مركزة: حدد العمل المطلوب، ثم الميزانية والمدة، ثم الظهور، ثم راجع كل شيء قبل النشر.",
            "heroTitle": "انشر مشروعك بوضوح واجذب المستقلين الأنسب له.",
            "links": {
                "add": "إضافة رابط",
                "description": "أضف روابط Google Drive أو ملف الأعمال أو الشبكات الاجتماعية ليتمكن المستقلون من مراجعة السياق بسرعة.",
                "duplicate": "تم إضافة هذا الرابط من قبل.",
                "invalid": "يرجى إدخال رابط صحيح.",
                "maxLinksReached": "يمكنك إضافة حتى {{count}} روابط.",
                "placeholder": "ألصق الرابط (مثال: drive.google.com/... أو linkedin.com/in/...)",
                "remove": "حذف الرابط",
                "title": "روابط مرجعية (اختياري)"
            },
            "progress": "التقدم",
            "quality": {
                "categorySelected": "التصنيف محدد",
                "clearTitle": "عنوان واضح",
                "relevantSkills": "مهارات ملائمة",
                "strongDescription": "وصف قوي",
                "title": "درجة الجودة"
            },
            "restoreDraft": {
                "description": "لدينا مسودة محفوظة من {{time}}. هل تريد استعادة البيانات والمتابعة من حيث توقفت؟",
                "jobTitle": "العنوان",
                "restore": "استعادة المسودة",
                "startFresh": "بدء من جديد",
                "title": "استعادة المسودة",
                "untitled": "(بدون عنوان)"
            },
            "seo": {
                "description": "أنشئ مشروعاً جديداً وحدد الميزانية والمدة ثم انشره لاستقبال عروض المستقلين.",
                "title": "نشر مشروع جديد"
            },
            "snippetDeliverables": "المخرجات",
            "snippetDeliverablesText": "المخرجات: الملفات المصدرية، بناء جاهز للنشر، وتوثيق موجز.",
            "snippetScope": "النطاق",
            "snippetScopeText": "النطاق: بناء تجربة متجاوبة تتماشى مع إرشادات علامتنا التجارية.",
            "snippetSuccess": "معايير النجاح",
            "snippetSuccessText": "معايير النجاح: واجهة مثالية، أداء عالٍ، وتسليم نظيف.",
            "step1": {
                "subtitle": "ابدأ بعنوان واضح وسياق قوي."
            },
            "stepBasics": {
                "attachmentLabel": "Attachment Label",
                "attachments": "المرفقات (اختياري)",
                "attachmentsDescription": "PDF, DOC, DOCX, TXT - حد أقصى 10MB لكل ملف",
                "badge": "موجز المشروع",
                "categoryDesign": "تصميم وإبداع",
                "categoryDevelopment": "برمجة وتطوير",
                "categoryMarketing": "تسويق ومبيعات",
                "categoryWriting": "كتابة وترجمة",
                "characterCount": "{{current}} / {{max}} حرف",
                "currentAttachments": "Current attachments",
                "mainCategory": "التصنيف الرئيسي",
                "projectDescription": "وصف المشروع",
                "projectDescriptionPlaceholder": "اشرح تفاصيل المشروع، المخرجات المتوقعة، وأي متطلبات خاصة...",
                "projectTitle": "عنوان المشروع",
                "projectTitlePlaceholder": "مثال: تصميم شعار لشركة مواد غذائية",
                "removeExistingAttachment": "Remove attachment",
                "requiredSkills": "المهارات المطلوبة (بحد أقصى 5)",
                "selectCategory": "اختر التصنيف",
                "selectSubcategory": "اختر التخصص الفرعي",
                "subcategory": "التخصص الفرعي",
                "subtitle": "ابدأ بعنوان واضح ووصف دقيق لمشروعك لجذب أفضل المستقلين.",
                "tip1": "كن دقيقاً في وصف المطلوب",
                "tip2": "حدد المخرجات النهائية بوضوح",
                "tip3": "أضف روابط لمشاريع مشابهة إن وجدت",
                "tip4": "وضح ما الذي يجب تسليمه ومتى تتوقع الانتهاء",
                "title": "تفاصيل المهمة"
            },
            "stepBudget": {
                "badge": "إعداد التسعير",
                "beginner": "مستوى مبتدئ",
                "beginnerSubtitle": "مهام بسيطة أو خيارات اقتصادية",
                "budgetAmount": "قيمة الميزانية",
                "deadline": "الموعد النهائي",
                "duration": "مدة المشروع",
                "duration1To3Months": "من 1 إلى 3 أشهر",
                "duration3To6Months": "من 3 إلى 6 أشهر",
                "durationLessThan1Month": "أقل من شهر",
                "durationMoreThan6Months": "أكثر من 6 أشهر",
                "estimatedBudget": "ميزانية المشروع التقديرية",
                "experienceLevel": "مستوى الخبرة المطلوب",
                "experienceLevelHint": "اختر مستوى الخبرة المطلوب لضمان الحصول على طلبات ملائمة.",
                "expert": "مستوى خبير",
                "expertSubtitle": "متخصصون من أعلى مستوى لاحتياجات معقدة",
                "fixedExact": "سعر ثابت (محدد)",
                "fixedExactDescription": "حدد ميزانية محددة لكامل نطاق العمل. الأفضل للمهام المحددة جيداً.",
                "fixedExactHint": "حدد السعر الثابت الدقيق لهذا المشروع.",
                "fixedExactSubtitle": "ميزانية ثابتة واحدة",
                "fixedPrice": "سعر ثابت",
                "fixedPriceDescription": "ادفع مبلغاً ثابتاً للمشروع بالكامل عند اكتماله.",
                "fixedRange": "سعر ثابت (نطاق)",
                "fixedRangeDescription": "حدد نطاق ميزانية لاستقطاب العروض المناسبة لتوقعاتك.",
                "fixedRangeHint": "حدد نطاقاً لاستقطاب العروض ضمن التكلفة المستهدفة.",
                "fixedRangeSubtitle": "نطاق ميزانية بين حد أدنى وأقصى",
                "fullTime30": "دوام كامل (حتى 30 ساعة/أسبوع)",
                "fullTime40": "دوام كامل (حتى 40 ساعة/أسبوع)",
                "hourly": "الأجر بالساعة",
                "hourlyDescription": "ادفع بالساعة بناءً على السجلات. الأفضل للعمل المستمر أو المتطور.",
                "hourlyHint": "حدد السعر بالساعة والحد الأقصى للساعات الأسبوعية.",
                "hourlyRate": "السعر بالساعة",
                "hourlyRateExample": "مثال: 20",
                "hourlySetup": "تفاصيل التسعير بالساعة",
                "hourlySubtitle": "الفوترة بحسب الوقت المسجّل",
                "intermediate": "مستوى متوسط",
                "intermediateSubtitle": "خبرة متينة لأهداف قياسية",
                "max": "الحد الأقصى للميزانية",
                "min": "الحد الأدنى للميزانية",
                "partTime10": "دوام جزئي (حتى 10 ساعات/أسبوع)",
                "partTime20": "دوام جزئي (حتى 20 ساعة/أسبوع)",
                "pricingMode": "نموذج التسعير",
                "selectDuration": "اختر المدة",
                "subtitle": "حدد طريقة الدفع المناسبة وميزانية المشروع",
                "title": "الميزانية والمدة",
                "weeklyHours": "حد الساعات الأسبوعية",
                "weeklyHoursExample": "مثال: 10-20"
            },
            "stepCounter": "الخطوة {{current}} من {{total}}",
            "stepReview": {
                "attachmentLabel": "Attachment Label",
                "attachments": "الملفات المرفقة",
                "badge": "المراجعة النهائية",
                "beginner": "مبتدئ",
                "budget": "الميزانية",
                "budgetRange": "Budget Range",
                "currentAttachments": "Current attachments",
                "deadline": "الموعد النهائي",
                "duration1To3Months": "1 - 3 أشهر",
                "duration3To6Months": "3 - 6 أشهر",
                "durationLessThan1Month": "أقل من شهر",
                "durationMoreThan6Months": "أكثر من 6 أشهر",
                "estimatedHours": "Estimated Hours",
                "experienceLevel": "المستوى المطلوب",
                "expert": "خبير",
                "fileSize": "File Size",
                "hourlyBudget": "{{rate}} د.ت / ساعة",
                "intermediate": "متوسط الخبرة",
                "inviteOnlyVisibility": "خاص (دعوة فقط)",
                "linkLabel": "Link Label",
                "links": "Reference links",
                "now": "الآن",
                "privacyLevel": "مستوى الخصوصية",
                "projectDescription": "وصف المشروع",
                "projectDuration": "مدة المشروع",
                "publicVisibility": "عام (الجميع)",
                "requiredSkills": "المهارات المطلوبة",
                "subtitle": "راجع موجز المشروع مرة أخيرة قبل أن يظهر للمستقلين.",
                "title": "المراجعة والنشر",
                "visibility": "الموقع",
                "warning": "يرجى مراجعة تفاصيل الوظيفة بدقة قبل النشر. بعد النشر، ستتمكن من تعديل بعض التفاصيل فقط.",
                "weeklyHoursBadge": "Weekly Schedule"
            },
            "stepVisibility": {
                "badge": "التحكم في الجمهور",
                "inviteOnlyDescription": "لن تظهر الوظيفة في البحث. فقط المستقلون الذين تقوم بدعوتهم يمكنهم تقديم العروض.",
                "inviteOnlyTitle": "دعوة فقط",
                "publicDescription": "يمكن لجميع المستقلين رؤية الوظيفة وتقديم عروضهم. الخيار الأفضل للحصول على أكبر عدد من العروض.",
                "publicTitle": "عام للجميع",
                "subtitle": "حدد مستوى الخصوصية المناسب لمشروعك.",
                "tipDescription": "إذا كنت تبحث عن مهارات نادرة أو لديك مشروع حساس، فإن خيار \"دعوة فقط\" يمنحك تحكماً أكبر. أما للمشاريع العامة، فإن \"عام للجميع\" يضمن لك تنافسية أفضل في الأسعار.",
                "tipTitle": "نصيحة:",
                "title": "من يمكنه رؤية وظيفتك؟"
            },
            "steps": {
                "basics": "تفاصيل المهمة",
                "basicsDescription": "حدد موجز المشروع، والتصنيف، والمهارات المطلوبة بوضوح.",
                "budget": "الميزانية والمدة",
                "budgetDescription": "حدد نموذج التسعير، والمدة المتوقعة، ومستوى الخبرة المطلوب.",
                "review": "المراجعة والنشر",
                "reviewDescription": "راجع تفاصيل المشروع قبل نشره وإرساله مباشرة.",
                "visibility": "الظهور",
                "visibilityDescription": "اختر ما إذا كان المشروع عاماً أو متاحاً بالدعوة فقط."
            },
            "time": {
                "hoursAgo": "منذ {{count}} ساعة",
                "minutesAgo": "منذ {{count}} دقيقة",
                "now": "الآن"
            },
            "tips": {
                "handoff": "وضح ما الذي يجب تسليمه عند الانتهاء.",
                "references": "أضف روابط ومراجع أو أمثلة إن توفرت.",
                "scope": "كن دقيقاً في تحديد النطاق والجودة المتوقعة.",
                "success": "حدد بوضوح كيف يبدو النجاح."
            },
            "titleTemplateDash": "لوحة تحكم React مع أدوات تحليل البيانات",
            "titleTemplateLanding": "إعادة تصميم صفحة هبوط لمنتج SaaS",
            "titleTemplateLogo": "تصميم شعار لشركة مواد غذائية",
            "titleTemplateVideo": "مونتاج فيديوهات قصيرة للإعلانات",
            "toasts": {
                "draftRestored": "تم استعادة المسودة بنجاح",
                "draftSaved": "تم حفظ المسودة بنجاح",
                "jobPosted": "تم نشر الوظيفة بنجاح!",
                "repostPrefilled": "Previous project loaded. Review and publish when ready."
            },
            "validation": {
                "budgetMax": "الحد الأقصى يجب أن يكون 1 على الأقل",
                "budgetMin": "الحد الأدنى يجب أن يكون 1 على الأقل",
                "budgetRange": "الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى",
                "budgetRequired": "يرجى تحديد الميزانية",
                "categoryRequired": "يرجى اختيار التصنيف",
                "deadlineFuture": "الموعد النهائي يجب أن يكون اليوم أو بعده",
                "deadlineRequired": "يرجى تحديد الموعد النهائي",
                "descriptionMin": "الوصف يجب أن يكون 80 حرفاً على الأقل",
                "durationRequired": "يرجى تحديد المدة",
                "estimatedHours": "يرجى إدخال عدد الساعات المتوقعة أسبوعياً",
                "hourlyRate": "السعر بالساعة يجب أن يكون 1 على الأقل",
                "maxFiles": "الحد الأقصى 5 ملفات",
                "maxReferenceLinks": "Max Reference Links",
                "referenceLinksInvalid": "Please enter valid links only",
                "skillsRequired": "يرجى اختيار مهارة واحدة على الأقل",
                "subcategoryInvalid": "يرجى اختيار تخصص فرعي مناسب",
                "subcategoryRequired": "يرجى اختيار التخصص الفرعي",
                "titleMin": "العنوان يجب أن يكون 8 أحرف على الأقل"
            },
            "warnings": {
                "linksTemporarilyUnavailable": "Links were saved in the form but could not be persisted yet. Please run latest migrations."
            },
            "wizard": {
                "badge": "مسار نشر المشروع",
                "currentPhase": "المرحلة الحالية",
                "metaDraft": "مسار آمن للمسودات",
                "progress": "التقدم",
                "stepsLeft": "خطوات متبقية"
            }
        },
        "newClient": "عميل جديد",
        "posted": {
            "description": "Your brief has been published successfully. Freelancers can now discover it, and proposals will start rolling in soon.",
            "goToDashboard": "Dashboard",
            "linkCopied": "Job link copied to clipboard!",
            "shareNetwork": "Share with your network",
            "title": "Your job is live and ready.",
            "viewJob": "View Job / Proposals"
        },
        "postedAgo": "نشر {{time}}",
        "proposals": "عرض",
        "save": "حفظ الوظيفة",
        "saved": "تم حفظ الوظيفة",
        "savedJobs": {
            "title": "الوظائف المحفوظة",
            "viewAll": "عرض الكل"
        },
        "searchPlaceholder": "ابحث عن وظائف...",
        "sort": {
            "budgetHigh": "الميزانية: الأعلى",
            "budgetLow": "الميزانية: الأقل",
            "newest": "الأحدث أولاً",
            "proposalsHigh": "أكثر العروض",
            "proposalsLow": "أقل العروض"
        },
        "stats": {
            "availableJobs": "وظيفة متاحة"
        },
        "time": {
            "ago": "",
            "ago_prefix": "منذ",
            "day": "يوم",
            "hour": "ساعة",
            "minute": "دقيقة",
            "now": "الآن"
        },
        "title": "الوظائف المتاحة",
        "type": {
            "fixed": "Fixed",
            "hourly": "Hourly"
        },
        "unsave": "إزالة من المحفوظات",
        "unverifiedPayment": "الدفع غير متحقق منه",
        "verifiedPayment": "تم التحقق من الدفع"
    },
    "languages": {
        "ar": {
            "code": "AR",
            "country": "TN",
            "name": "العربية"
        },
        "en": {
            "code": "EN",
            "country": "GB",
            "name": "English"
        },
        "fr": {
            "code": "FR",
            "country": "FR",
            "name": "Français"
        }
    },
    "legalPages": {
        "privacy": {
            "lastUpdated": "آخر تحديث: يناير 2026",
            "sections": {
                "contact": {
                    "emailLabel": "البريد الإلكتروني:",
                    "intro": "لأي استفسارات حول الخصوصية:",
                    "title": "7. التواصل"
                },
                "cookies": {
                    "text": "نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك التحكم في هذه الإعدادات من متصفحك.",
                    "title": "6. ملفات تعريف الارتباط (Cookies)"
                },
                "dataCollection": {
                    "intro": "نجمع المعلومات التالية عند استخدامك للمنصة:",
                    "items": {
                        "account": "معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف",
                        "payment": "معلومات الدفع: تفاصيل الحساب البنكي (مشفرة)",
                        "profile": "معلومات الملف الشخصي: المهارات، الخبرات، الصور",
                        "usage": "بيانات الاستخدام: الصفحات المزارة، الوقت المستغرق"
                    },
                    "title": "1. البيانات التي نجمعها"
                },
                "protection": {
                    "intro": "نستخدم تقنيات أمان متقدمة لحماية بياناتك:",
                    "items": {
                        "audits": "مراجعات أمنية دورية",
                        "database": "تشفير البيانات الحساسة في قاعدة البيانات",
                        "ssl": "تشفير SSL/TLS لجميع الاتصالات"
                    },
                    "title": "4. حماية البيانات"
                },
                "rights": {
                    "items": {
                        "access": "الوصول إلى بياناتك الشخصية",
                        "correction": "تصحيح البيانات غير الدقيقة",
                        "deletion": "حذف حسابك وبياناتك",
                        "export": "تصدير بياناتك"
                    },
                    "title": "5. حقوقك"
                },
                "sharing": {
                    "intro": "لا نبيع بياناتك الشخصية. قد نشاركها مع:",
                    "items": {
                        "legalAuthorities": "السلطات القانونية (عند الطلب الرسمي)",
                        "paymentProviders": "مزودي خدمات الدفع (لمعالجة المعاملات)",
                        "publicProfile": "المستخدمين الآخرين (المعلومات العامة في ملفك)"
                    },
                    "title": "3. مشاركة البيانات"
                },
                "usage": {
                    "items": {
                        "experience": "تحسين تجربة المستخدم",
                        "improve": "توفير وتحسين خدماتنا",
                        "notifications": "إرسال إشعارات مهمة",
                        "security": "منع الاحتيال وحماية الأمان",
                        "transactions": "معالجة المعاملات المالية"
                    },
                    "title": "2. كيف نستخدم بياناتك"
                }
            },
            "title": "سياسة الخصوصية"
        },
        "terms": {
            "lastUpdated": "آخر تحديث: يناير 2026",
            "sections": {
                "contact": {
                    "emailLabel": "البريد الإلكتروني:",
                    "intro": "للتواصل معنا حول هذه الشروط:",
                    "title": "6. التواصل"
                },
                "contractsPayments": {
                    "intro": "تعمل خدمة.تن كوسيط بين الموظفين الحرين والعملاء. نحن لسنا طرفًا في العقود المبرمة بينهم.",
                    "items": {
                        "fee": "رسوم المنصة: 5% من قيمة كل عقد",
                        "holdPeriod": "فترة الاحتفاظ بالمدفوعات: 7 أيام",
                        "secureMethods": "المدفوعات تتم عبر طرق آمنة ومعتمدة"
                    },
                    "title": "4. العقود والمدفوعات"
                },
                "disputes": {
                    "text": "في حالة نشوء نزاع، نوفر آلية للتحكيم. قرارات فريق الدعم نهائية وملزمة.",
                    "title": "5. حل النزاعات"
                },
                "intro": {
                    "text": "مرحبًا بك في خدمة.تن (WorkedIn.tn)، منصة العمل الحر الرائدة في تونس. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام.",
                    "title": "1. مقدمة"
                },
                "platformUse": {
                    "intro": "يحظر استخدام المنصة في:",
                    "items": {
                        "abusive": "نشر محتوى مسيء أو ضار",
                        "dataHarvesting": "جمع بيانات المستخدمين",
                        "illegal": "أي نشاط غير قانوني",
                        "impersonation": "انتحال شخصية الآخرين",
                        "paymentBypass": "التحايل على آليات الدفع"
                    },
                    "title": "3. استخدام المنصة"
                },
                "registration": {
                    "items": {
                        "accuracy": "المعلومات المقدمة يجب أن تكون دقيقة وحديثة",
                        "age": "يجب أن يكون عمرك 18 عامًا على الأقل للتسجيل",
                        "report": "يجب إبلاغنا فورًا عن أي استخدام غير مصرح به",
                        "security": "أنت مسؤول عن الحفاظ على سرية حسابك"
                    },
                    "title": "2. التسجيل والحسابات"
                }
            },
            "title": "شروط الخدمة"
        }
    },
    "messages": {
        "attachFile": "Attach file",
        "filters": {
            "unread": "Unread"
        },
        "lifecycleBanner": "Lifecycle Banner",
        "messagePlaceholder": "Write your message...",
        "noConversationsFound": "No conversations found.",
        "readOnlyThread": "Read Only Thread",
        "recordVoice": "Record voice message",
        "recording": "Recording...",
        "searchPlaceholder": "Search messages...",
        "sentAttachment": "Sent an attachment",
        "stopRecording": "Stop recording",
        "title": "Messages"
    },
    "mobileNav": {
        "client": "Client",
        "freelancer": "Freelancer"
    },
    "nav": {
        "account": "Account",
        "adminDashboard": "لوحة الإدارة",
        "client": {
            "activeProjects": "مشاريع نشطة",
            "activeProjectsDesc": "إدارة المشاريع الحالية والتوظيف",
            "browseTalent": "تصفح المواهب",
            "browseTalentDesc": "البحث عن مستقلين تونسيين مؤهلين",
            "drafts": "المسودات",
            "draftsDesc": "جميع مشاريعك المنشورة",
            "finished": "المكتملة",
            "finishedDesc": "مراجعة تاريخ المشاريع المكتملة",
            "freelancers": "المستقلون",
            "savedProfiles": "الملفات المحفوظة",
            "savedProfilesDesc": "العودة إلى المواهب المفضلة"
        },
        "contracts": "العقود",
        "dashboard": "لوحة التحكم",
        "findFreelancers": "ابحث عن موظفين",
        "findFreelancersTitle": "ابحث عن موظفين",
        "findWork": "ابحث عن عمل",
        "forClients": "للعملاء",
        "forFreelancers": "للموظفين",
        "freelancer": {
            "bestMatches": "أفضل التطابقات",
            "bestMatchesDesc": "فرص عمل متناسبة مع ملفك الشخصي",
            "browseJobs": "تصفح الوظائف",
            "browseJobsDesc": "استكشاف المشاريع المحلية المفتوحة",
            "overview": "نظرة عامة",
            "overviewDesc": "الرصيد وحالة الدفع",
            "savedJobs": "الوظائف المحفوظة",
            "savedJobsDesc": "متابعة الوظائف التي ترغب في العودة إليها",
            "transactions": "المعاملات",
            "transactionsDesc": "مراجعة حركة الدفع",
            "withdraw": "سحب",
            "withdrawDesc": "تحويل الأرباح إلى حسابك"
        },
        "home": "الرئيسية",
        "howItWorks": "كيف نعمل",
        "jobs": "الوظائف المتاحة",
        "login": "تسجيل الدخول",
        "logout": "تسجيل الخروج",
        "messages": "الرسائل",
        "myJobs": "وظائفي",
        "myProjects": "مشاريعي",
        "postProject": "نشر مشروع",
        "pricing": "التسعير",
        "profile": "البروفايل",
        "proposals": "العروض",
        "saved": "المحفوظات",
        "settings": "الإعدادات",
        "signup": "إنشاء حساب",
        "wallet": "المحفظة"
    },
    "notFound": {
        "description": "الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
        "goBack": "العودة",
        "goHome": "الصفحة الرئيسية",
        "title": "الصفحة غير موجودة"
    },
    "notificationSettings": {
        "contractUpdates": "Contracts"
    },
    "notifications": {
        "caughtUp": "أنت مطّلع على كل جديد",
        "contract": {
            "active": {
                "body": "{{body}}",
                "title": "بدء العقد"
            },
            "cancelled": {
                "body": "{{body}}",
                "title": "تم إلغاء العقد"
            },
            "completed": {
                "body": "{{body}}",
                "title": "اكتمل العقد"
            },
            "disputed": {
                "body": "{{body}}",
                "title": "نزاع على العقد"
            },
            "update": {
                "body": "{{body}}",
                "title": "تحديث على العقد"
            }
        },
        "delete": "حذف الإشعار",
        "empty": "لا توجد إشعارات حالياً",
        "emptyDesc": "سنعلمك فور حدوث تطورات في مشاريعك.",
        "errors": {
            "deleteFailed": "Failed to delete notification"
        },
        "identity": {
            "rejected": {
                "body": "تم رفض طلب توثيق الهوية. يرجى التأكد من وضوح الصور ثم إعادة التقديم.",
                "title": "تم رفض طلب توثيق الهوية"
            },
            "submitted": {
                "body": "تم استلام طلب توثيق الهوية الخاص بك. فريقنا يقوم بمراجعة مستنداتك.",
                "title": "تم استلام طلب التوثيق"
            },
            "verified": {
                "body": "حسابك الآن موثق. لقد حصلت على شارة التوثيق الزرقاء.",
                "title": "تم توثيق هويتك بنجاح"
            }
        },
        "message": {
            "deleted": "تم حذف هذه الرسالة",
            "title": "رسالة جديدة من {{sender}}"
        },
        "overview": {
            "description": "Keep track of all actions, updates, and deliverables on your projects.",
            "settings": "Preferences",
            "title": "Activity Summary",
            "total": "Total notifications",
            "unread": "Unread alerts"
        },
        "proposal": {
            "accepted": {
                "body": "تم قبول عرضك على المشروع '{{jobTitle}}'!",
                "title": "تم قبول العرض"
            },
            "new": {
                "body": "قدّم {{freelancer}} عرضاً على '{{jobTitle}}'",
                "title": "عرض جديد"
            }
        },
        "readAll": "تحديد الكل كمقروء",
        "time": {
            "daysAgo": "منذ {{count}} يوم",
            "hoursAgo": "منذ {{count}} ساعة",
            "justNow": "الآن",
            "minutesAgo": "منذ {{count}} دقيقة"
        },
        "title": "الإشعارات",
        "unreadCount": "Unread Count",
        "viewAll": "عرض كل الإشعارات"
    },
    "onboarding": {
        "client": {
            "profileDesc": "البيانات الأساسية التي يراها المستقلون أولاً.",
            "profileTitle": "ملف العميل",
            "timeoutError": "استغرق الطلب وقتاً طويلاً جداً. يرجى المحاولة مرة أخرى.",
            "welcome": "أهلاً بك",
            "welcomeDesc": "أكمل ملفك كعميل وابدأ نشر مشاريعك بثقة."
        },
        "currentStep": "الخطوة الحالية",
        "freelancer": {
            "basicInfoSaved": "تم حفظ البيانات الأساسية",
            "completeLaterHint": "يمكنك إضافة الشهادات والمعرض ووسائل التعريف لاحقاً من الإعدادات",
            "completionFailed": "فشل إكمال التسجيل - يرجى المحاولة مرة أخرى",
            "connectionFailed": "فشل الاتصال - يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
            "finishSetup": "Finish setup",
            "hourlyRateHint": "Shown to clients on your profile and used in search filters. You can update it later.",
            "hourlyRateLabel": "Hourly Rate Label",
            "hourlyRatePlaceholder": "e.g. 35",
            "maxSkills": "الحد الأقصى 5 مهارات",
            "noAuthSession": "لا توجد جلسة مصادقة، يرجى تسجيل الدخول مرة أخرى",
            "selectAtLeastOneSkill": "يرجى اختيار مهارة واحدة على الأقل",
            "serverConnectionFailed": "فشل الاتصال بالخادم - يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
            "skillsClarification": "These skills appear on your profile and in client search filters. Pick only what you can deliver now.",
            "skillsRateAndAvailability": "Skills, rate, and availability",
            "skillsSaveFailed": "فشل حفظ المهارات",
            "step1Description": "Add the details clients will see first when deciding whether to trust your profile.",
            "step2Description": "Use Upwork-style profile signals: clear services, realistic hourly rate, and current availability.",
            "step2TitleUpdated": "Choose skills and set your hourly rate",
            "step3Description": "Upwork-style profile details: tools you actually use, industries you understand, portfolio links, and clear revision terms.",
            "step3Title": "Show proof and set delivery expectations",
            "stepBasicInfo": "المعلومات الأساسية",
            "stepCounter": "الخطوة {{step}} من {{total}}",
            "stepProof": "Profile details and proof",
            "stepSkillsExperience": "المهارات والخبرة",
            "steps": {
                "bio": "نبذة",
                "experience": "الخبرة",
                "portfolio": "معرض الأعمال",
                "skills": "المهارات"
            },
            "uploadAvatar": "الصورة الشخصية",
            "uploadAvatarDesc": "يُفضّل استخدام صورة مهنية واضحة",
            "welcome": "أهلاً بك",
            "welcomeDesc": "أكمل ملفك كمستقل وابدأ في الظهور أمام فرص حقيقية.",
            "welcomeToast": "مرحباً بك في خدمة!"
        },
        "progressive": {
            "client": {
                "accountTypes": {
                    "company": "شركة",
                    "individual": "فرد"
                },
                "completedMessage": "تم إكمال بيانات إعداد العميل بنجاح.",
                "completedSubtitle": "ملفك كعميل أصبح جاهزاً. يمكنك المتابعة إلى لوحة التحكم.",
                "completedTitle": "اكتمل الإعداد",
                "errors": {
                    "accountTypeRequired": "نوع الحساب مطلوب.",
                    "companyNameRequired": "اسم الشركة مطلوب لحسابات الشركات.",
                    "fullNameRequired": "الاسم الكامل مطلوب.",
                    "locationRequired": "الولاية مطلوبة.",
                    "phoneRequired": "رقم الهاتف مطلوب.",
                    "primaryGoalRequired": "الهدف الأساسي مطلوب."
                },
                "fields": {
                    "accountType": "نوع الحساب",
                    "companyName": "اسم الشركة",
                    "primaryGoal": "الهدف الأساسي"
                },
                "placeholders": {
                    "companyName": "اسم شركتك",
                    "phoneNumber": "+216 00 000 000"
                },
                "primaryGoals": {
                    "buildTeam": "بناء فريق",
                    "justBrowsing": "أتصفح فقط",
                    "specificProject": "التوظيف لمشروع محدد"
                },
                "stepSubtitles": {
                    "accountDetails": "الأساسيات فقط ليكون حسابك موثوقاً ومكتملًا.",
                    "hiringIntent": "أخبرنا بما تريد التوظيف له حتى نخصص المطابقة بشكل أفضل."
                },
                "steps": {
                    "accountDetails": "بيانات الحساب",
                    "hiringIntent": "هدف التوظيف"
                },
                "tips": {
                    "accountDetails": "اكتمال بيانات الحساب يرفع معدل الردود ويقلل الانسحاب عند أول تواصل بين العميل والمستقل.",
                    "hiringIntent": "توضيح هدف التوظيف يحسن التوصيات ويزيد جودة المرشحين المقترحين."
                }
            },
            "common": {
                "accountInactive": "حسابك غير نشط. يرجى التواصل مع الدعم.",
                "back": "رجوع",
                "completeProfile": "إكمال الملف",
                "completeRequiredFields": "يرجى إكمال الحقول المطلوبة قبل المتابعة.",
                "completing": "جارٍ الإكمال...",
                "completionFailed": "فشل إكمال الإعداد. يرجى المحاولة مرة أخرى.",
                "conflictRetry": "تم اكتشاف تعارض في التحديث. يرجى المحاولة مرة أخرى.",
                "exitOnboarding": "الخروج من الإعداد",
                "fields": {
                    "fullName": "الاسم الكامل",
                    "location": "الولاية",
                    "phoneNumber": "رقم الهاتف"
                },
                "fixBeforeContinue": "يرجى إصلاح هذا قبل المتابعة: {{error}}",
                "invalidPhone": "يرجى إدخال رقم هاتف صالح.",
                "nextStep": "الخطوة التالية",
                "onboardingRequired": "يرجى إكمال ملف الإعداد قبل الوصول إلى الصفحات الأخرى.",
                "phoneTaken": "رقم الهاتف هذا مستخدم بالفعل بواسطة حساب آخر.",
                "placeholders": {
                    "fullName": "اكتب اسمك الكامل",
                    "selectLocation": "اختر الولاية"
                },
                "proTip": "نصيحة احترافية",
                "removeTagAria": "إزالة {{item}}",
                "saveExit": "حفظ وخروج",
                "stepCounter": "الخطوة {{step}} من {{total}}",
                "unsavedConfirm": "لديك تقدم غير محفوظ في الإعداد. هل تريد الخروج؟"
            },
            "freelancer": {
                "availability": {
                    "asNeeded": "حسب الحاجة",
                    "fullTime": "دوام كامل",
                    "partTime": "دوام جزئي"
                },
                "categories": {
                    "business": "أعمال",
                    "data": "بيانات",
                    "design": "تصميم",
                    "development": "تطوير",
                    "marketing": "تسويق",
                    "video": "فيديو",
                    "writing": "كتابة"
                },
                "completedMessage": "شكراً لك. تم حفظ بيانات الإعداد بشكل تدريجي.",
                "completedSubtitle": "بيانات إعداد ملفك كمستقل أصبحت جاهزة. يمكنك المتابعة إلى لوحة التحكم.",
                "completedTitle": "تم إعداد الملف بنجاح",
                "currency": "د.ت",
                "errors": {
                    "availabilityRequired": "اختر التوفر.",
                    "avatarRequired": "الصورة الشخصية مطلوبة.",
                    "coreSkillRequired": "أضف مهارة أساسية واحدة على الأقل.",
                    "experienceRequired": "اختر سنوات الخبرة.",
                    "fullNameRequired": "الاسم الكامل مطلوب.",
                    "hourlyRateInvalid": "يجب أن يكون السعر بالساعة أكبر من 0.",
                    "locationRequired": "الولاية مطلوبة.",
                    "mainCategoryRequired": "الفئة الرئيسية مطلوبة.",
                    "phoneRequired": "رقم الهاتف مطلوب.",
                    "portfolioRequired": "رابط معرض الأعمال مطلوب.",
                    "professionalTitleRequired": "المسمى المهني مطلوب.",
                    "summaryRequired": "النبذة مطلوبة.",
                    "summaryTooLong": "يجب ألا تتجاوز النبذة 500 حرف.",
                    "toolRequired": "أضف أداة واحدة على الأقل."
                },
                "experience": {
                    "0to2": "0-2",
                    "3to5": "3-5",
                    "5plus": "5+"
                },
                "fields": {
                    "availability": "التوفر",
                    "avatarHint": "PNG, JPG, WEBP",
                    "avatarPreviewAlt": "معاينة الصورة الشخصية",
                    "avatarUpload": "رفع الصورة الشخصية (إلزامي)",
                    "bioSummary": "نبذة / ملخص",
                    "chooseAvatar": "اختر صورة",
                    "coreSkills": "المهارات الأساسية",
                    "hourlyRate": "السعر بالساعة",
                    "mainCategory": "الفئة الرئيسية",
                    "portfolioLink": "رابط معرض الأعمال",
                    "professionalTitle": "المسمى المهني",
                    "toolsUsed": "الأدوات المستخدمة",
                    "yearsOfExperience": "سنوات الخبرة"
                },
                "hints": {
                    "coreSkills": "ابحث وأضف حتى 30 مهارة",
                    "phoneNumber": "للأمان والحصول على شارة التحقق.",
                    "toolsUsed": "ابحث وأضف حتى 15 أداة"
                },
                "placeholders": {
                    "availability": "اختر التوفر",
                    "bioSummary": "ما الذي تتقنه أكثر؟ وما نوع المشاريع التي تفضّلها؟",
                    "coreSkills": "اكتب مهارة ثم اضغط Enter",
                    "experienceRange": "اختر النطاق",
                    "hourlyRate": "80",
                    "phoneNumber": "للأمان والحصول على شارة التحقق",
                    "portfolioLink": "https://your-portfolio.com",
                    "professionalTitle": "مطور React أول",
                    "selectCategory": "اختر الفئة",
                    "toolsUsed": "اكتب أداة ثم اضغط Enter"
                },
                "skillSuggestions": {
                    "contentWriting": "كتابة المحتوى",
                    "dataAnalysis": "تحليل البيانات",
                    "figma": "Figma",
                    "googleAds": "Google Ads",
                    "illustrator": "Illustrator",
                    "motionDesign": "موشن ديزاين",
                    "nextjs": "Next.js",
                    "nodejs": "Node.js",
                    "projectManagement": "إدارة المشاريع",
                    "python": "Python",
                    "react": "React",
                    "seo": "SEO",
                    "tailwind": "Tailwind CSS",
                    "typescript": "TypeScript",
                    "uiux": "تصميم UI/UX"
                },
                "stepSubtitles": {
                    "businessRates": "ضع شروط عمل واضحة لتوحيد التوقعات.",
                    "expertise": "حدد نقاط قوتك لتحسين جودة المطابقة.",
                    "identityPitch": "ابدأ بتوضيح هويتك وكيف تقدم قيمتك.",
                    "trustProof": "أضف إشارات ثقة تجعل العملاء أكثر استعداداً للتوظيف."
                },
                "steps": {
                    "businessRates": "الأسعار وشروط العمل",
                    "expertise": "الخبرة",
                    "identityPitch": "الهوية والعرض",
                    "trustProof": "عناصر الثقة"
                },
                "tips": {
                    "businessRates": "الأسعار الواضحة تقلل التفاوض وتسرع الوصول إلى العملاء الجادين.",
                    "expertise": "الوسوم الصحيحة تحسن المطابقة. أضف فقط أقوى مهاراتك وأدواتك.",
                    "identityPitch": "العملاء يقررون بسرعة. عنوان واضح وملخص قوي يبني الثقة فوراً.",
                    "trustProof": "المعلومات الموثقة ورابط الأعمال يعززان مصداقيتك بشكل كبير."
                },
                "toolSuggestions": {
                    "canva": "Canva",
                    "docker": "Docker",
                    "figma": "Figma",
                    "framer": "Framer",
                    "github": "GitHub",
                    "illustrator": "Illustrator",
                    "jira": "Jira",
                    "notion": "Notion",
                    "photoshop": "Photoshop",
                    "slack": "Slack",
                    "vscode": "VS Code",
                    "webflow": "Webflow"
                }
            }
        }
    },
    "pages": {
        "authCallback": {
            "backToLogin": "العودة لتسجيل الدخول",
            "errorCode": "رمز الخطأ: {{code}}",
            "loginIncomplete": "لم يكتمل تسجيل الدخول",
            "loginIncompleteDescription": "تعذر تأكيد الجلسة حالياً. حاول مرة أخرى أو ارجع لصفحة الدخول.",
            "signingIn": "جارٍ تسجيل دخولك",
            "signingInDescription": "نحن نكمل تسجيل الدخول الآمن. لن يستغرق هذا سوى لحظات.",
            "tryAgain": "حاول مرة أخرى"
        },
        "clientJobs": {
            "active": "نشطة",
            "all": "الكل",
            "budgetNotSet": "Budget not set",
            "completed": "مكتملة",
            "daysAgo": "منذ {{days}} أيام",
            "delete": "Delete",
            "deleteBlocked": "Cannot delete a project that already has a contract.",
            "deleteConfirmText": "Are you sure you want to delete this project permanently? This action cannot be undone.",
            "deleteConfirmTitle": "Delete Project",
            "deleteError": "Failed to delete project",
            "deleteSuccess": "Project deleted",
            "deleting": "Deleting...",
            "edit": "تعديل",
            "emptyDescription": "انشر أول مشروع لك واستقبل عروضاً من محترفين موثوقين.",
            "emptyFilteredDescription": "Try another tab or adjust search to see your other projects.",
            "emptyFilteredTitle": "No projects in this tab",
            "emptyTitle": "لا توجد مشاريع بعد",
            "finished": "Finished",
            "finishedBreakdown": "Finished Breakdown",
            "fixedPrice": "سعر ثابت",
            "hourlyRate": "بالساعة",
            "inProgress": "In progress",
            "inReview": "قيد المراجعة",
            "loading": "جارٍ تحميل المشاريع...",
            "needsAttention": "Needs attention",
            "oneDayAgo": "منذ يوم",
            "open": "Open",
            "openContract": "Workspace",
            "postFree": "انشر مشروعاً مجاناً",
            "postProject": "نشر مشروع",
            "postedAgo": "نُشر {{time}}",
            "proposalsCount": "{{count}} عرض",
            "proposalsReceived": "إجمالي العروض المستلمة",
            "repostProject": "Repost project",
            "result": {
                "attention": "Result: Action required before proceeding",
                "deliveryReview": "Result: Delivery submitted, awaiting your review",
                "open": "Result: Waiting for a hire decision",
                "progress": "Result: Work in progress",
                "success": "Success",
                "unsuccessful": "Unsuccessful"
            },
            "showAll": "Reset search and show all",
            "status": {
                "actionRequired": "Action Required",
                "completed": "مكتمل",
                "disputed": "Disputed",
                "finished": "Finished",
                "inProgress": "قيد التنفيذ",
                "inReview": "قيد المراجعة",
                "open": "مفتوح",
                "reviewNeeded": "Review Needed"
            },
            "subtitle": "إدارة المشاريع المنشورة والعروض المستلمة",
            "title": "مشاريعي",
            "today": "اليوم",
            "uncategorized": "Uncategorized",
            "viewProposals": "عرض العروض",
            "viewResult": "View result",
            "withProposals": "With Proposals"
        },
        "errorBoundary": {
            "backHome": "العودة للرئيسية",
            "description": "تسبب خطأ غير متوقع في إيقاف هذه الصفحة. حدّث الصفحة وحاول مرة أخرى أو ارجع للرئيسية.",
            "details": "Error Details",
            "refresh": "تحديث الصفحة",
            "title": "حدث خطأ غير متوقع"
        },
        "forgotPassword": {
            "backToLogin": "Back to sign in",
            "checkSpamDescription": "If the email takes a minute, check your spam folder before retrying.",
            "checkSpamTitle": "Check spam if needed",
            "contactUs": "Contact us",
            "needHelp": "Need help?",
            "protection": "We protect this flow with rate limits and one-time recovery sessions.",
            "sentDescription": "We sent a reset link to",
            "sentTitle": "Check your email",
            "subtitle": "Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.",
            "title": "Reset your password without losing your place"
        },
        "freelancerCard": {
            "badges": {
                "availableNow": "متاح الآن",
                "availableNowTitle": "متاح لبدء مشاريع جديدة فوراً.",
                "fastResponder": "سريع الرد",
                "fastResponderTitle": "عادة يرد بسرعة على العملاء الجدد.",
                "newTalent": "موهبة جديدة",
                "newTalentTitle": "ملف حديث بزخم أولي جيد.",
                "topRated": "الأعلى تقييماً",
                "topRatedTitle": "تقييمات ممتازة باستمرار من العملاء.",
                "verified": "موثق",
                "verifiedTitle": "تمت مراجعة الهوية وبيانات الدفع."
            },
            "completedJobs": "{{count}} مكتمل",
            "defaultTitle": "مستقل",
            "hourlyRate": "السعر بالساعة",
            "jobsLabel": "وظائف",
            "repliesIn": "يرد خلال {{time}}",
            "reviewsCount": {
                "one": "تقييم واحد",
                "other": "{{count}} تقييمًا",
                "zero": "لا توجد تقييمات"
            },
            "snippet": "احترافي وسريع الاستجابة وأكثر جودة من المعتاد في المنصات.",
            "success": "نجاح",
            "successRate": "{{rate}}% نسبة نجاح",
            "successScore": "مؤشر النجاح",
            "tndPerHour": "د.ت/ساعة",
            "verifiedProfile": "ملف موثق",
            "viewProfile": "عرض الملف"
        },
        "freelancerDashboard": {
            "allCaughtUp": "أنت مطّلع على كل شيء!",
            "browseJobs": "تصفح الوظائف",
            "earnings": "الأرباح",
            "earningsDescription": "آخر 6 أشهر من دفعات الضمان المُفرج عنها.",
            "earningsTrajectory": "مسار الأرباح",
            "greetingFallback": "هناك",
            "noDueDate": "لا يوجد موعد نهائي",
            "noEarningsData": "لا توجد بيانات أرباح بعد",
            "noRecentActivity": "لا يوجد نشاط حديث",
            "noUpcomingMilestones": "لا توجد مراحل قادمة",
            "profileSettings": "إعدادات الملف",
            "quickActions": "إجراءات سريعة",
            "recentActivity": "النشاط الأخير",
            "recentActivityDescription": "أحدث إشعاراتك وتحديثاتك.",
            "sixMonthTrend": "اتجاه 6 أشهر",
            "stat": {
                "activeContracts": "العقود النشطة",
                "pendingProposals": "العروض المعلقة",
                "profileViews": "مشاهدات الملف",
                "totalEarnings": "إجمالي الأرباح"
            },
            "upcomingMilestones": "المراحل القادمة",
            "welcomeBack": "مرحباً بعودتك",
            "welcomeDescription": "عملك الحر يبدو أكثر احترافية اليوم. حافظ على الزخم وواصل تطوير ملفك."
        },
        "freelancerEarnings": {
            "availableBalance": "الرصيد المتاح",
            "browseJobs": "تصفح الوظائف",
            "clientId": "عميل #{{id}}",
            "completedContracts": "العقود المكتملة",
            "contractPayment": "دفعة عقد",
            "earningsOverview": "نظرة عامة على الأرباح",
            "noEarningsDescription": "أكمل أول مشروع لك لتظهر أرباحك هنا.",
            "noEarningsTitle": "لا توجد أرباح بعد",
            "notAvailable": "غير متوفر",
            "paymentHistory": "سجل الدفعات",
            "pendingClearance": "{{amount}} د.ت قيد التسوية",
            "seoDescription": "أرباحك وسجل الدفعات على WorkedIn.",
            "seoTitle": "الأرباح | WorkedIn",
            "thisMonth": "هذا الشهر",
            "totalEarned": "إجمالي الأرباح",
            "withdraw": "سحب"
        },
        "freelancerProfile": {
            "actions": {
                "changeProfilePicture": "تغيير صورة الملف الشخصي",
                "editProfile": "تعديل الملف الشخصي",
                "nextProject": "المشروع التالي",
                "openLink": "فتح الرابط",
                "openProjectLink": "فتح رابط المشروع",
                "previousProject": "المشروع السابق",
                "viewFullProject": "عرض المشروع الكامل"
            },
            "addFirstWorkSample": "Add your first work sample",
            "addPortfolio": "Add Portfolio",
            "available": "Available",
            "busy": "Busy right now",
            "completedJobs": "Completed",
            "contactModal": {
                "body": "سيتم فتح محادثة مباشرة مع {{name}} داخل مساحة الرسائل الخاصة بك.",
                "cannotMessageSelf": "لا يمكنك مراسلة نفسك",
                "createFailed": "تعذر إنشاء المحادثة",
                "loginPrompt": "يجب عليك تسجيل الدخول قبل التواصل مع المستقلين.",
                "loginRequired": "يجب تسجيل الدخول لإرسال رسالة",
                "opening": "جارٍ الفتح...",
                "sectionLabel": "مراسلة مباشرة",
                "startAction": "بدء المحادثة",
                "startError": "حدث خطأ أثناء بدء المحادثة",
                "title": "مراسلة {{name}}",
                "trustNote": "استخدم رسائل خدمة للحفاظ على تواصل المشروع منظماً وواضحاً."
            },
            "cta": {
                "editProfile": "Edit Profile",
                "hireMe": "وظّفني",
                "myProposals": "عروضي",
                "myProposalsDescription": "تابع الحالات وتابع أسرع.",
                "portfolioDashboard": "لوحة معرض الأعمال",
                "portfolioDashboardDescription": "أضف ورتب أفضل نماذج أعمالك.",
                "sendMessage": "إرسال رسالة",
                "viewPublicProfile": "عرض الملف العام",
                "viewPublicProfileDescription": "عاين ملفك كما يراه العملاء والزوار.",
                "workspaceSettings": "إعدادات مساحة العمل",
                "workspaceSettingsDescription": "الإشعارات والأمان والتحكم في الحساب."
            },
            "education": {
                "add": "+ إضافة تفاصيل التعليم",
                "empty": "لم يتم إدخال التعليم بعد.",
                "studyField": "{{degree}} في {{field}}",
                "title": "التعليم"
            },
            "form": {
                "fullName": "الاسم الكامل",
                "hourlyRateTnd": "السعر بالساعة (د.ت)",
                "professionalTitle": "المسمى المهني"
            },
            "hearVoice": "Voice intro",
            "hireNow": "Hire Now",
            "info": {
                "lastSeen": "آخر ظهور",
                "memberSince": "عضو منذ"
            },
            "jobFallback": "مشروع",
            "labels": {
                "skillsUsed": "المهارات المستخدمة",
                "toolsUsed": "الأدوات المستخدمة"
            },
            "languages": {
                "empty": "لا توجد لغات مدرجة.",
                "title": "اللغات"
            },
            "lastSeen": "Last seen",
            "lastSeenRecently": "Recently",
            "main": {
                "add": "إضافة",
                "addDescription": "+ إضافة وصف",
                "addFirstWorkSample": "أضف نموذج عملك الأول",
                "copied": "تم النسخ!",
                "hourlyRateFormat": "{{rate}}/ساعة",
                "independentSpecialist": "مختص مستقل",
                "industries": "الصناعات",
                "jobsCompletedCount": {
                    "one": "وظيفة مكتملة واحدة",
                    "other": "{{count}} وظيفة مكتملة"
                },
                "localTime": "التوقيت المحلي {{time}}",
                "noBio": "لم يتم تقديم تفاصيل السيرة الذاتية بعد.",
                "noDescription": "لم يتم تقديم وصف.",
                "openLink": "فتح الرابط",
                "photosCount": {
                    "one": "صورة واحدة",
                    "other": "{{count}} صور"
                },
                "portfolio": "معرض الأعمال",
                "projectCollaboration": "التعاون في المشروع",
                "responseTimeSuffix": "وقت الاستجابة",
                "reviewBy": "من قبل {{name}}",
                "reviewsCount": {
                    "one": "تقييم واحد",
                    "other": "{{count}} تقييمات"
                },
                "services": "الخدمات",
                "share": "مشاركة",
                "skills": "المهارات",
                "specializedFreelancer": "مستقل متخصص",
                "specializedIn": "متخصص في {{skills}}",
                "tools": "الأدوات",
                "untitledWork": "عمل بدون عنوان",
                "viewProject": "عرض المشروع",
                "workHistoryAndReviews": "تاريخ العمل والتقييمات",
                "workSamplesEmptyDesc": "اعرض دراسات الحالة، والتصميمات، والمنتجات، والنتائج الملموسة لجذب العملاء."
            },
            "manageProfile": "Manage Profile",
            "memberSince": "Member since",
            "message": "Send Message",
            "noPortfolio": "No work samples added yet",
            "noPortfolioDescription": "Showcase case studies, shipped products, and measurable outcomes.",
            "noReviewsTrust": "No reviews yet - complete your first contract to receive feedback",
            "noSkills": "No skills added yet",
            "offline": "Offline",
            "portfolio": {
                "skillsUsed": "المهارات المستخدمة",
                "visitProject": "زيارة المشروع"
            },
            "portfolioLinks": {
                "add": "+ إضافة روابط معرض الأعمال",
                "empty": "لم يتم إضافة روابط بعد.",
                "title": "روابط معرض الأعمال"
            },
            "portfolioTitle": "Portfolio",
            "profileStrength": "Profile strength",
            "projectPreferences": {
                "projectPreferences": "تفضيلات المشروع",
                "projectPreferencesDefault": "منفتح على التغييرات في نطاق المشروع، والتواصل العادي عبر الرسائل/المكالمات، والتسليمات المستندة إلى المراحل.",
                "revisionPolicy": "سياسة المراجعة",
                "revisionPolicyDefault": "تتضمن مراجعتين، وأي مراجعات إضافية تُحسب بشكل منفصل.",
                "title": "تفضيلات وتفاصيل المشروع"
            },
            "publicPreview": {
                "description": "أنت تشاهد ملفك كما يراه المستخدمون الآخرون.",
                "exit": "الخروج من المعاينة",
                "title": "معاينة الملف العام"
            },
            "responseSpeed": "Response",
            "reviews": {
                "empty": "لا توجد تقييمات بعد. أكمل أول عقد لتتلقى آراء العملاء."
            },
            "sectionLabelIntro": "Introduction",
            "sectionLabelSkills": "Core strengths",
            "sectionLabelTrust": "Client trust",
            "sectionLabelWork": "Selected work",
            "sections": {
                "clientTrust": "ثقة العملاء",
                "coreStrengths": "نقاط القوة الأساسية",
                "selectedWork": "الأعمال المختارة",
                "workInformation": "معلومات العمل"
            },
            "stats": {
                "availabilityAndStats": "التوافر والإحصائيات",
                "availableForWork": "متاح للعمل",
                "hourlyRate": "السعر بالساعة",
                "hoursPerWeek": "{{hours}} ساعة/أسبوع",
                "hoursResponseTime": "أقل من {{hours}} ساعات",
                "jobSuccess": "نجاح العمل",
                "lessThanTwoHours": "أقل من ساعتين",
                "profileVisibility": "ظهور الملف الشخصي",
                "public": "عام",
                "responseTime": "سرعة الرد",
                "status": "الحالة",
                "weeklyAvailability": "التوافر الأسبوعي",
                "yearsCount": {
                    "one": "سنة واحدة",
                    "other": "{{count}} سنوات"
                },
                "yearsOfExperience": "سنوات الخبرة"
            },
            "status": "Status",
            "successRate": "success",
            "toasts": {
                "avatarUpdated": "تم تحديث صورة الملف الشخصي",
                "bioUpdateError": "تعذر تحديث النبذة",
                "bioUpdated": "تم تحديث النبذة",
                "contactDisabledOwnProfile": "وضع المعاينة العامة: إجراء التواصل معطّل على ملفك الشخصي.",
                "linkCopied": "Profile link copied to clipboard",
                "loginRequired": "يرجى تسجيل الدخول للمتابعة",
                "profileUpdateError": "تعذر تحديث تفاصيل الملف الشخصي",
                "profileUpdated": "تم تحديث تفاصيل الملف الشخصي",
                "skillsUpdateError": "تعذر تحديث المهارات",
                "skillsUpdated": "تم تحديث المهارات",
                "toolsUpdateError": "تعذر تحديث الأدوات",
                "toolsUpdated": "تم تحديث الأدوات",
                "workSampleDeleteError": "تعذر حذف نموذج العمل",
                "workSampleDeleted": "تم حذف نموذج العمل"
            },
            "totalEarnings": "Earned",
            "validation": {
                "avatarSize": "يجب أن يكون حجم الصورة أقل من 5 ميغابايت.",
                "avatarType": "يرجى رفع صورة بصيغة JPG أو PNG أو WEBP أو GIF.",
                "fullNameRequired": "الاسم الكامل مطلوب",
                "validHourlyRate": "يرجى إدخال سعر ساعة صالح"
            },
            "verificationEmail": "Email",
            "verificationIdentity": "Identity",
            "verificationPayment": "Payment method",
            "verificationPhone": "Phone",
            "verifications": {
                "emailAddress": "البريد الإلكتروني",
                "identityVerified": "الهوية موثقة",
                "paymentMethod": "طريقة الدفع",
                "phoneNumber": "رقم الهاتف",
                "title": "التوثيقات"
            },
            "viewer": {
                "close": "إغلاق عارض الأعمال",
                "nextImage": "الصورة التالية",
                "previousImage": "الصورة السابقة"
            },
            "workInfo": "Work information",
            "workSamples": {
                "deleteConfirm": "Delete this work sample? This action cannot be undone.",
                "emptyTitle": "لا توجد نماذج أعمال بعد"
            },
            "works": "works"
        },
        "jobBoard": {
            "actions": {
                "applied": "تم التقديم",
                "applyNow": "قدم الآن"
            },
            "budgetNotSpecified": "الميزانية غير محددة",
            "currency": "د.ت",
            "empty": {
                "filtered": "لا توجد وظائف مطابقة للفلاتر المحددة.",
                "saved": "لم تقم بحفظ أي وظائف بعد."
            },
            "errors": {
                "loadFailed": "تعذر تحميل الوظائف. يرجى المحاولة مرة أخرى."
            },
            "filters": {
                "clearAll": "مسح الكل",
                "jobType": "نوع العمل",
                "searchPlaceholder": "ابحث عن وظائف...",
                "showing": "يعرض"
            },
            "header": {
                "jobsYouMightLike": "وظائف قد تعجبك",
                "subtitle": "تصفح فرص العمل الحر في تونس وقدّم بثقة.",
                "title": "ابحث عن عمل"
            },
            "hourlyRateFormat": "د.ت/ساعة",
            "infoBanner": {
                "addSkillsLink": "إضافة مهارات",
                "clientModePrompt": "أنت تتصفح الوظائف كعميل. قم بالتبديل إلى مستقل لرؤية الوظائف المتطابقة.",
                "loginPrompt": "سجل الدخول لعرض الوظائف المتناسبة مع مهاراتك.",
                "matchingSkills": "الوظائف المتطابقة بناءً على مهاراتك: ___SKILLS___",
                "noSkillsPrompt": "أضف مهارات إلى ملفك الشخصي لرؤية الوظائف المتطابقة."
            },
            "jobCard": {
                "appliedLabel": "تم التقديم",
                "noDescription": "لم يتم تقديم وصف.",
                "untitledJob": "وظيفة بدون عنوان"
            },
            "proposals": {
                "lessThan5": "أقل من 5 عروض",
                "range10_15": "من 10 إلى 15 عرضاً",
                "range15_20": "من 15 إلى 20 عرضاً",
                "range5_10": "من 5 إلى 10 عروض",
                "twentyPlus": "أكثر من 20 عرضاً",
                "zero": "0 عروض"
            },
            "tabs": {
                "bestMatches": "أفضل التطابقات",
                "mostRecent": "الأحدث",
                "savedJobs": "الوظائف المحفوظة"
            },
            "toasts": {
                "removedFromSaved": "تمت الإزالة من الوظائف المحفوظة",
                "savedJob": "تم حفظ الوظيفة",
                "savedJobsUpdateError": "تعذر تحديث الوظائف المحفوظة"
            }
        },
        "jobDetail": {
            "timeAgo": {
                "day": "Day",
                "hour": "Hour",
                "minute": "Minute",
                "week": "Week"
            }
        },
        "leaveReview": {
            "error": "فشل إرسال التقييم. حاول مرة أخرى.",
            "rating": {
                "excellent": "ممتاز",
                "fair": "مقبول",
                "good": "جيد",
                "poor": "ضعيف",
                "veryGood": "جيد جداً"
            },
            "submitted": "تم إرسال التقييم بنجاح!"
        },
        "login": {
            "finishingSignIn": "جارٍ إنهاء تسجيل الدخول",
            "finishingSignInDescription": "نحن نؤكد جلستك الآمنة ونحوّلك إلى مساحة العمل المناسبة."
        },
        "messages": {
            "a11y": {
                "openAttachment": "فتح المرفق",
                "openImageAttachment": "فتح الصورة المرفقة"
            },
            "allConversationsLabel": "جميع المحادثات",
            "archive": "Archive",
            "archiveAriaArchive": "أرشفة المحادثة",
            "archiveAriaUnarchive": "إلغاء أرشفة المحادثة",
            "archiveConversation": "أرشفة المحادثة",
            "archiveSuccess": "تمت أرشفة المحادثة",
            "archivedLabel": "المؤرشفة",
            "attachFile": "إرفاق ملف",
            "attachmentFallback": "Attachment",
            "attachmentLabel": "مرفق",
            "attachmentsDisabled": "Attachments are disabled for this conversation.",
            "audioNote": "Audio note",
            "audioPreviewUnavailable": "Audio preview unavailable.",
            "backToInbox": "العودة للصندوق",
            "cancelReply": "إلغاء الرد",
            "clientInboxLabel": "صندوق العميل",
            "contract": {
                "nextStep": {
                    "clientReviewDelivery": "راجع التسليم، ثم اقبل أو اطلب تعديلات أو افتح نزاعاً.",
                    "clientWaitingDelivery": "المستقل يعمل على المشروع. سيظهر التسليم هنا.",
                    "completedDefault": "تم إكمال العقد.",
                    "completedLeaveReview": "اترك تقييماً لإغلاق حلقة الثقة.",
                    "disputed": "النزاع مفتوح. الأدلة محفوظة.",
                    "freelancerSubmitReviewFiles": "قدم ملفات المراجعة والملفات النهائية المقفلة عندما تكون جاهزاً.",
                    "freelancerWaitingForReview": "بانتظار مراجعة العميل. الملفات النهائية تبقى محمية.",
                    "paymentPending": "يجب تأكيد الدفع قبل بدء العمل.",
                    "syncing": "حافظ على المحادثة مفتوحة أثناء مزامنة العقد."
                },
                "status": {
                    "cancelled": "ملغي",
                    "completed": "مكتمل",
                    "disputed": "متنازع عليه",
                    "inProgress": "قيد التنفيذ",
                    "paymentPending": "دفع معلق",
                    "revisionRequested": "طلب تعديلات",
                    "syncing": "مزامنة",
                    "underReview": "قيد المراجعة"
                }
            },
            "contractContext": "محادثة العقد",
            "contractDetails": {
                "amount": "المبلغ",
                "amountReleased": "Amount Released",
                "contractMilestones": "Contract Milestones",
                "due": "الموعد",
                "fundEscrowBody": "Fund Escrow Body",
                "milestoneDefaultTitle": "Milestone Default Title",
                "requestRevisionLeft": "Request Revision Left",
                "revLeft": "Rev Left",
                "revUsed": "Rev Used",
                "review": "المراجعة",
                "reviewDue": "Review Due",
                "workspace": "مساحة العمل"
            },
            "contractOpenFailed": "تعذر فتح محادثة العقد حتى الآن. يرجى التحديث والمحاولة مرة أخرى.",
            "contractProjectWithTitle": "مشروع العقد • {{title}}",
            "contractReferenceFallback": "العقد",
            "contractReferenceWithId": "العقد #{{id}}",
            "contractSessionFallbackTitle": "العقد",
            "contractSidebarUnavailable": "تفاصيل العقد غير متاحة لهذه المحادثة بعد.",
            "contractWithName": "عقد مع {{name}}",
            "contractWorkspaceTitle": "مساحة عمل العقد",
            "contractsAction": "العقود",
            "copyMessage": "نسخ الرسالة",
            "delete": "حذف",
            "deleteConversation": "حذف المحادثة",
            "deleteForEveryone": "حذف للجميع",
            "deleteForMe": "حذف لي فقط",
            "deleteMessage": "حذف الرسالة",
            "deleteMessagePrompt": "هل أنت متأكد من حذف هذه الرسالة؟",
            "deletedMessage": "تم حذف هذه الرسالة",
            "delivery": {
                "finalLockedFiles": "Final Locked Files",
                "finalLockedFilesDescription": "Files that stay locked until the client accepts and payment is released.",
                "provideBothError": "يرجى تقديم التسليمات لكل من مرحلتي المراجعة والتسليم النهائي.",
                "resubmitLabel": "إعادة تسليم العمل",
                "reviewFiles": "Review Files",
                "reviewFilesDescription": "Files the client can review immediately before accepting.",
                "submitLabel": "تسليم العمل",
                "submitting": "جارٍ تسليم العمل...",
                "submittingLabel": "Submitting delivery...",
                "uploadFailed": "فشل تحميل {{stage}} للملف {{file}}: {{message}}",
                "workDeliveredReview": "تم تسليم العمل وجاهز للمراجعة"
            },
            "directChat": "محادثة مباشرة",
            "directContext": "محادثة مباشرة",
            "edited": "تم التعديل",
            "empty": {
                "noArchivedTitle": "لا توجد محادثات مؤرشفة",
                "noConversationsDescription": "ابدأ بإرسال عرض أو التواصل مع مستقل.",
                "noConversationsTitle": "لا توجد محادثات بعد",
                "noMatchingDescription": "جرب البحث باسم مختلف أو امسح البحث.",
                "noMatchingTitle": "لا توجد محادثات مطابقة"
            },
            "emptyThread": "لا توجد رسائل بعد. ابدأ المحادثة!",
            "errors": {
                "audioUpload": "فشل رفع المقطع الصوتي",
                "fileInspectionFailed": "تعذر التحقق من هذا الملف بأمان. يرجى اختيار ملف آخر.",
                "fileTooLarge": "حجم الملف يجب أن يكون أقل من 10 ميغابايت",
                "fileUnsupported": "نوع الملف غير مدعوم",
                "fileUpload": "فشل رفع الملف",
                "invalidAttachment": "رابط المرفق غير متاح",
                "openAttachment": "فشل فتح المرفق حالياً",
                "recordingLimit": "تم الوصول لحد التسجيل (5 دقائق)",
                "sendFailed": "فشل إرسال الرسالة"
            },
            "escrowNotFunded": "الضمان غير ممول بعد",
            "filterAll": "الكل",
            "filterUnread": "غير مقروءة",
            "filters": {
                "all": "الكل",
                "unread": "غير مقروءة"
            },
            "freelancerInboxLabel": "صندوق المستقل",
            "hideWorkspace": "إخفاء مساحة العمل",
            "imageLabel": "صورة",
            "inboxLabel": "صندوق الوارد",
            "jumpToRepliedMessage": "Jump to replied message",
            "lifecycle": {
                "cancelled": "Cancelled",
                "completed": "Completed",
                "disputed": "Disputed",
                "unknown": "Unknown"
            },
            "lifecycleBanner": "{{message}}",
            "lightbox": {
                "altText": "Preview",
                "ariaLabel": "Image preview",
                "closeAria": "إغلاق معاينة الصورة",
                "closeTitle": "إغلاق",
                "downloadAria": "تحميل الصورة",
                "downloadFilename": "image",
                "downloadTitle": "تحميل",
                "imagePreviewAria": "معاينة الصورة",
                "previewAlt": "معاينة"
            },
            "loadMore": "تحميل المزيد من الرسائل",
            "loadingContractSidebar": "جاري تحميل تفاصيل العقد...",
            "loadingConversations": "جاري تحميل المحادثات...",
            "loadingMessages": "جاري تحميل الرسائل...",
            "markUnread": "تحديد كغير مقروء",
            "messagePlaceholder": "اكتب رسالتك...",
            "noCommentPlaceholder": "No comment provided",
            "noConversationsFound": "لم يتم العثور على محادثات.",
            "noDueDate": "لا يوجد تاريخ استحقاق",
            "noMessagesYet": "لا توجد رسائل بعد",
            "offline": {
                "attachmentPending": "المرفق قيد الانتظار",
                "audioTooLarge": "المقطع الصوتي كبير جداً للتخزين غير المتصل",
                "encodingFailed": "فشل تحضير الملف للتخزين غير المتصل",
                "fileTooLarge": "الملف كبير جداً للتخزين غير المتصل (الحد الأقصى 5 ميغابايت)",
                "queued": "أنت غير متصل. تم وضع الرسالة في قائمة الانتظار وسيتم إرسالها عند الاتصال.",
                "statusWaiting": "قيد الانتظار",
                "storageFailed": "فشل حفظ الرسالة غير المتصلة",
                "synced": "تم مزامنة الرسائل غير المتصلة بنجاح"
            },
            "openContract": "فتح العقد",
            "pauseAudio": "Pause audio",
            "placeholder": "اكتب رسالة...",
            "playAudio": "Play audio",
            "profileAction": "الملف الشخصي",
            "reacting": "جارٍ التفاعل...",
            "readOnlyFallback": "This conversation is read-only.",
            "readOnlyPlaceholder": "{{message}}",
            "readOnlyRightNow": "This conversation is read-only right now.",
            "readOnlyThread": "{{message}}",
            "recordVoice": "تسجيل مقطع صوتي",
            "recording": "جاري التسجيل...",
            "reply": "رد",
            "replyAction": "Reply to message",
            "replyTargetMissing": "الرسالة الأصلية غير متاحة بعد.",
            "replyTo": "الرد على الرسالة",
            "replyingTo": "الرد على",
            "reportReason": {
                "fraud": "محاولة احتيال",
                "harassment": "تحرش أو إساءة",
                "inappropriate": "سلوك أو محتوى غير مناسب",
                "other": "أخرى",
                "spam": "رسائل مزعجة أو مضللة"
            },
            "reportSubmittedSuccess": "تم تقديم البلاغ بنجاح. سيقوم فريقنا بمراجعته.",
            "reportUser": "الإبلاغ عن المستخدم",
            "reportUserDescription": "أخبرنا عن سبب إبلاغك عن هذا المستخدم. سيقوم فريقنا بمراجعة ملفه الشخصي ونشاطه الأخير.",
            "reportUserTitle": "الإبلاغ عن المستخدم",
            "reviewBanners": {
                "overdueClient": "Review is overdue. Please accept, request changes, or open a dispute now. If you stay inactive, the platform may escalate or auto-resolve this contract based on policy.",
                "overdueFreelancer": "Client review is overdue. The platform will follow the contract protection policy next if the client stays inactive.",
                "underReviewClient": "Under Review Client",
                "underReviewFreelancer": "Under Review Freelancer"
            },
            "searchPlaceholder": "ابحث في المحادثات...",
            "searchResultsSummary": "{{count}} نتيجة",
            "seeLess": "عرض أقل",
            "seeMore": "عرض المزيد",
            "selectConversationDescription": "اختر محادثة من الشريط الجانبي للبدء في المراسلة، أو انتظر حتى يتواصل معك أحد.",
            "selectConversationDetails": "اختر محادثة لعرض التفاصيل",
            "selectConversationTitle": "رسائلك",
            "senderAlt": "المرسل",
            "sentAttachment": "أرسل مرفقًا",
            "startConversationDesc": "ابدأ المحادثة بإرسال رسالة أو ملف أدناه.",
            "startConversationTitle": "No messages yet",
            "stopRecording": "إيقاف التسجيل",
            "summaryEmpty": "Summary Empty",
            "summaryUnread": "Summary Unread",
            "system": {
                "completedTitle": "تم إكمال العقد",
                "deliveryTitle": "تم تسليم العمل",
                "disputePrefix": "Dispute Prefix",
                "disputeTitle": "تم فتح نزاع",
                "eventTitle": "تحديث النظام",
                "reviewFormat": "Review Format",
                "reviewTitle": "تم إرسال التقييم",
                "revisionTitle": "طلب تعديلات"
            },
            "systemEventTitle": "تحديث النظام",
            "threadCountSummary": "{{count}} محادثة",
            "time": {
                "daysAgo": "منذ {{count}} يوم",
                "hoursAgo": "منذ {{count}} ساعة",
                "minutesAgo": "منذ {{count}} دقيقة",
                "now": "الآن"
            },
            "title": "الرسائل",
            "today": "Today",
            "typingIndicator": {
                "plural": "أشخاص يكتبون...",
                "singular": "يكتب..."
            },
            "unarchive": "إلغاء الأرشفة",
            "unarchiveSuccess": "تمت إعادة المحادثة إلى الصندوق",
            "unfundedLabel": "غير ممول",
            "unknownFileType": "FILE",
            "unknownSender": "User",
            "userFallback": "مستخدم",
            "viewArchived": "المحادثات المؤرشفة",
            "viewWorkspace": "View workspace",
            "voiceMemo": "مقطع صوتي",
            "voiceNotesDisabled": "Voice notes are disabled for this conversation."
        },
        "mobileNav": {
            "brandName": "خدمة",
            "client": "عميل",
            "freelancer": "مستقل",
            "help": "المساعدة",
            "more": "المزيد",
            "searchPlaceholder": "ابحث...",
            "userFallback": "مستخدم",
            "workspaceClient": "مساحة عمل العميل",
            "workspaceFreelancer": "مساحة عمل المستقل"
        },
        "myProposals": {
            "accepted": "المقبولة",
            "all": "الكل",
            "browseJobs": "تصفح الوظائف",
            "daysAgo": "منذ {{days}} أيام",
            "deliveryDays": "{{days}} يوم للتسليم",
            "emptyDescription": "تصفح المشاريع المفتوحة وقدّم أول عرض لك للبدء في العمل.",
            "emptyTabHint": "لديك عروض، لكن لا يوجد أي منها في {{tab}} الآن. جرّب تبويب الكل.",
            "emptyTabTitle": "لا توجد عروض {{tab}}",
            "emptyTitle": "لم تتقدم بعد لأي وظيفة",
            "hoursAgo": "منذ {{hours}} ساعة",
            "justNow": "الآن",
            "loading": "جارٍ تحميل العروض...",
            "minsAgo": "منذ {{mins}} دقيقة",
            "oneDayAgo": "منذ يوم",
            "pending": "قيد الانتظار",
            "proposalAccepted": "تم قبول عرضك!",
            "rejected": "مرفوضة",
            "sent": "المرسلة",
            "submittedAgo": "تم الإرسال {{time}}",
            "subtitle": "تابع كل عرض قدمته",
            "title": "عروضي",
            "today": "اليوم",
            "unknownProject": "مشروع غير معروف",
            "viewContract": "عرض العقد",
            "viewJob": "عرض الوظيفة",
            "yourBid": "عرضك: {{amount}} د.ت"
        },
        "postJob": {
            "stepDetails": {
                "duration1To3Months": "1–3 months",
                "duration3To6Months": "3–6 months",
                "durationLessThan1Month": "Less than 1 month",
                "durationMoreThan6Months": "6+ months"
            }
        },
        "resetPassword": {
            "backToLogin": "Back to sign in",
            "expiredDescription": "Request a fresh reset link and we will send you back through a clean password recovery flow.",
            "expiredTitle": "This recovery link is no longer valid",
            "requestNew": "Request new link",
            "requirementsDescription": "Use a password with upper/lowercase letters and numbers.",
            "requirementsTitle": "Strong password rules",
            "retryDescription": "Generate a new recovery email instead of fighting with an expired token.",
            "retryTitle": "Start again cleanly",
            "securityDescription": "Recovery links stay temporary and tied to your active session.",
            "securityTitle": "Security first",
            "subtitle": "We are validating your recovery session before letting you update your password.",
            "title": "Choose a new password",
            "validating": "Validating your recovery link..."
        },
        "savedJobs": {
            "actions": {
                "applyNow": "قدم الآن",
                "inviteToJob": "دعوة إلى الوظيفة",
                "removeSavedFreelancer": "إزالة المستقل المحفوظ",
                "removeSavedJob": "إزالة الوظيفة المحفوظة"
            },
            "browseFreelancers": "تصفح المستقلين",
            "browseJobs": "تصفح الوظائف",
            "empty": {
                "title": "لا يوجد شيء محفوظ بعد"
            },
            "labels": {
                "budget": "الميزانية:"
            },
            "savedTalent": "المواهب المحفوظة",
            "subtitle": "تتبع الوظائف التي تريد التقدم لها.",
            "subtitleTalent": "تتبع أفضل المستقلين لمشاريعك.",
            "title": "الوظائف المحفوظة"
        },
        "searchModal": {
            "allResults": "جميع النتائج",
            "closeHint": "إغلاق",
            "enterHint": "اضغط Enter لعرض كل النتائج الخاصة بـ \"{{query}}\"",
            "filterAll": "الكل",
            "filterAllDesc": "البحث في كل شيء",
            "filterJobs": "الوظائف",
            "filterJobsDesc": "الوظائف المفتوحة",
            "filterProjects": "الصفحات",
            "filterProjectsDesc": "الروابط والصفحات السريعة",
            "filterTalent": "المستقلين",
            "filterTalentDesc": "المستقلين والوكالات",
            "globalTitle": "البحث العام",
            "goTo": "الانتقال إلى",
            "headerHint": "انتقل سريعاً بين الصفحات، وابحث في الوظائف المباشرة، وافتح الإجراءات الشائعة بسرعة.",
            "navHint": "تنقل",
            "noResultsFor": "لا توجد نتائج لـ \"{{query}}\"",
            "openAction": "فتح",
            "placeholderAll": "ابحث في الوظائف، المستقلين، الصفحات...",
            "placeholderClient": "ابحث في المستقلين والمهارات...",
            "placeholderFreelancer": "ابحث في الوظائف والمهارات...",
            "placeholderJobs": "ابحث في الوظائف...",
            "placeholderProjects": "ابحث في الصفحات...",
            "placeholderTalent": "ابحث في المستقلين...",
            "quickActions": "إجراءات سريعة",
            "quickLinksRecent": "الروابط السريعة والأخيرة",
            "recentSection": "تنقلات أخيرة",
            "removeSearch": "إزالة البحث",
            "resultsCount": "{{count}} نتيجة",
            "resultsHeadline": "النتائج · {{category}}",
            "searchEverything": "ابحث في كل شيء عن \"{{query}}\"",
            "searchEverythingMeta": "افتح صفحة البحث الكاملة مع كل النتائج المطابقة",
            "searchIn": "البحث في",
            "searching": "جارٍ البحث...",
            "sectionActions": "الإجراءات",
            "sectionBestMatch": "أفضل تطابق",
            "sectionGeneral": "النتائج",
            "sectionJobs": "الوظائف",
            "selectHint": "اختيار",
            "shortcuts": {
                "browseAllJobs": "تصفح كل الوظائف",
                "browseJobs": "تصفح الوظائف",
                "contracts": "العقود",
                "createAccount": "إنشاء حساب",
                "findFreelancers": "ابحث عن مستقلين",
                "howItWorks": "كيف نعمل",
                "myEarnings": "أرباحي",
                "myProjects": "مشاريعي",
                "myProposals": "عروضي",
                "postProject": "نشر مشروع",
                "settings": "الإعدادات"
            },
            "trendingNow": "الأكثر رواجاً الآن",
            "tryDifferent": "جرّب عبارة بحث مختلفة",
            "workspaceClient": "مساحة عمل العميل",
            "workspaceFreelancer": "مساحة عمل المستقل"
        },
        "settings": {
            "account": {
                "accountType": "نوع الحساب",
                "currentWorkspace": "مساحة العمل الحالية",
                "goToDashboard": "الذهاب إلى لوحة التحكم",
                "identity": "الهوية",
                "identityVerified": "الهوية موثقة",
                "manageNotifications": "إدارة الإشعارات",
                "notVerified": "غير موثق",
                "openPublicProfileEditor": "فتح محرر الملف العام",
                "overviewDescription": "أدر مساحة العمل والتفاصيل العامة لحسابك.",
                "overviewTitle": "نظرة عامة على الحساب",
                "quickActions": "إجراءات سريعة",
                "verificationUnderReview": "التحقق قيد المراجعة"
            },
            "actions": {
                "signOut": "تسجيل الخروج"
            },
            "menu": {
                "account": "الحساب",
                "billing": "الفواتير",
                "clientMode": "وضع العميل",
                "earnings": "الأرباح",
                "freelancerMode": "وضع المستقل",
                "notifications": "الإشعارات",
                "privacy": "الخصوصية",
                "profile": "إعدادات الملف الشخصي"
            },
            "notifications": {
                "newJobMatches": "وظائف جديدة مطابقة",
                "newJobMatchesDesc": "احصل على إشعار عندما تتطابق الوظائف مع مهاراتك",
                "newMessages": "رسائل جديدة",
                "newMessagesDesc": "احصل على إشعار عند استلام رسائل جديدة",
                "offersAndUpdates": "العروض والتحديثات",
                "offersAndUpdatesDesc": "نصائح وتحديثات من WorkedIn",
                "payments": "المدفوعات",
                "paymentsDesc": "احصل على إشعار عند إرسال أو استلام مدفوعات",
                "reviews": "التقييمات",
                "reviewsDesc": "احصل على إشعار عند استلام تقييم جديد",
                "toasts": {
                    "loadError": "فشل تحميل إعدادات الإشعارات",
                    "saveError": "تعذر حفظ إعدادات الإشعارات"
                }
            },
            "payment": {
                "accountHolderNamePlaceholder": "Account holder full name *",
                "active": "ACTIVE",
                "addAccount": "Add account",
                "addBankAccount": "Add bank account",
                "addBankAccountDesc": "Add a bank account to receive your earnings.",
                "addMethod": "إضافة طريقة",
                "bankNamePlaceholder": "Bank Name Placeholder",
                "bankTransfer": "تحويل بنكي",
                "cardDesc": "Pay securely with local Visa, Mastercard, or CIB cards",
                "cardName": "Credit / Debit Card",
                "clientDesc": "How you fund contracts for your projects.",
                "default": "DEFAULT",
                "deleteMethod": "حذف طريقة الدفع",
                "dhmadClientDesc": "Active billing gateway. Supports Visa, Mastercard, Flouci, and e-Dinar checkouts natively during contract funding.",
                "dhmadFreelancerDesc": "Active escrow clearinghouse. Contract funds are secured safely by Dhmad until delivery is approved, then credited to your wallet balance.",
                "dhmadName": "Dhmad Escrow",
                "directFunding": "Direct Funding Options",
                "directFundingDesc": "Fund contracts securely through Dhmad Escrow checkout.",
                "directFundingTip": "Contracts are funded directly during checkout when you hire a freelancer. No pre-funding or complex deposits are needed!",
                "edinarDesc": "Pay with La Poste e-Dinar card",
                "edinarName": "Edinar Name",
                "empty": {
                    "description": "أضف طريقة سحب الآن لتكون العقود جاهزة عندما تحتاجها.",
                    "title": "لم تتم إضافة طريقة دفع بعد"
                },
                "flouciDesc": "Fund using your Flouci mobile wallet account",
                "flouciName": "Flouci Wallet",
                "freelancerDesc": "How your clients fund contracts - your earnings go through escrow.",
                "friendlyLabelPlaceholder": "Friendly Label Placeholder",
                "live": "LIVE",
                "methods": "Payment Methods",
                "newBankAccount": "New bank account",
                "noPayoutAccountYet": "No payout account yet",
                "openWallet": "Open Wallet Dashboard",
                "payoutAccounts": "Payout Accounts",
                "payoutDesc": "Where your earnings land when you withdraw.",
                "payoutInfo": "Payout Info",
                "providers": "Payment Providers",
                "saveAccount": "Save account",
                "setDefault": "تعيين كافتراضي",
                "soon": "SOON",
                "title": "طرق الدفع",
                "toasts": {
                    "addError": "تعذر إضافة طريقة الدفع",
                    "added": "تمت إضافة طريقة الدفع",
                    "defaultUpdateError": "تعذر تحديث الطريقة الافتراضية",
                    "defaultUpdated": "تم تحديث طريقة الدفع الافتراضية",
                    "loadError": "فشل تحميل طرق الدفع",
                    "removeError": "تعذر إزالة طريقة الدفع",
                    "removed": "تمت إزالة طريقة الدفع"
                },
                "validIban": "Valid Tunisian IBAN",
                "walletDesc": "View your escrow balance and withdraw earnings.",
                "walletMetrics": "Balance, transactions, withdrawals",
                "yourWallet": "Your Wallet"
            },
            "privacy": {
                "activeSessions": "الجلسات النشطة",
                "changePassword": "تغيير كلمة المرور",
                "currentSession": "هذا الجهاز هو جلستك الحالية.",
                "deleteAccount": "حذف الحساب",
                "deleteAccountButton": "Delete my account",
                "deleteAccountWarning": "سيتم حذف حسابك وجميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.",
                "signOutAllDevices": "تسجيل الخروج من كل الأجهزة",
                "submitting": "Submitting...",
                "title": "الأمان والخصوصية",
                "toasts": {
                    "deleteRequestError": "تعذر إرسال طلب الحذف",
                    "deleteRequestInProgress": "يوجد طلب حذف قيد التنفيذ بالفعل",
                    "deleteRequestSubmitted": "تم إرسال طلب حذف الحساب",
                    "signOutAllError": "تعذر تسجيل الخروج من كل الأجهزة"
                }
            },
            "title": "الإعدادات"
        }
    },
    "payment": {
        "amount": "المبلغ",
        "cardHolder": "اسم حامل البطاقة",
        "cardNumber": "رقم البطاقة",
        "cardNumberPlaceholder": "0000 0000 0000 0000",
        "cardSchemes": "فيزا / ماستركارد / سي آي بي",
        "chooseMethod": "اختر طريقة الدفع",
        "completeTitle": "إتمام الدفع",
        "creditCard": "بطاقة بنكية",
        "cvc": "CVC",
        "cvcPlaceholder": "123",
        "d17Desc": "أسرع طريقة للدفع في تونس",
        "d17PhoneLabel": "رقم الهاتف المرتبط بـ D17",
        "d17PhonePlaceholder": "+216 00 000 000",
        "dhmadDescription": "المدفوعات محفوظة بأمان في الضمان بواسطة Dhmad.tn",
        "escrowFunded": "تم تمويل الضمان بنجاح",
        "expiryDate": "تاريخ الانتهاء",
        "expiryDatePlaceholder": "MM/YY",
        "flouciDesc": "محفظتك الرقمية الآمنة",
        "flouciDescription": "Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹ Ã˜Â¹Ã˜Â¨Ã˜Â± Flouci - Ã˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â¨Ã™â€ Ã™Æ’Ã™Å Ã˜Â© Ã™Ë†Ã™â€¦Ã˜Â­Ã˜Â§Ã™ÂÃ˜Â¸ Ã˜Â¥Ã™â€žÃ™Æ’Ã˜ÂªÃ˜Â±Ã™Ë†Ã™â€ Ã™Å Ã˜Â©",
        "flouciRedirect": "سيتم تحويلك إلى تطبيق Flouci لإتمام عملية الدفع بشكل آمن",
        "flouciTitle": "Flouci",
        "fundEscrowAction": "مول الضمان الآن",
        "fundEscrowHint": "يجب تمويل الضمان قبل أن يبدأ المستقل. تبقى الأموال محمية حتى توافق على التسليم.",
        "fundEscrowSubtitle": "الأموال محمية حتى اكتمال العمل",
        "fundEscrowTitle": "تمويل الضمان",
        "noPaymentLink": "لم يتم إنشاء رابط الدفع",
        "noResponse": "لم يتم استلام أي رد من خادم الضمان",
        "openFlouci": "فتح تطبيق Flouci",
        "orEnterPhone": "أو أدخل رقم هاتفك",
        "payNow": "دفع الآن",
        "payVia": "دفع عبر",
        "platformFee": "رسوم المنصة",
        "processing": "جاري معالجة الدفع...",
        "processingDesc": "يرجى الانتظار، لا تغلق النافذة",
        "projectBudget": "ميزانية المشروع",
        "recipient": "المستفيد",
        "redirectingToPayment": "جاري التوجيه إلى الدفع الآمن...",
        "refundFailed": "فشل استرجاع مبلغ الضمان. يرجى المحاولة مرة أخرى.",
        "releaseFailed": "فشل تحرير الضمان. يرجى المحاولة مرة أخرى.",
        "scanD17": "امسح الرمز بواسطة تطبيق D17",
        "secureTransaction": "عملية دفع مشفرة وآمنة 100%",
        "sessionFailed": "فشل إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.",
        "startFailed": "فشل بدء عملية الدفع. يرجى المحاولة مرة أخرى.",
        "statusFailed": "فشل الحصول على حالة الضمان. يرجى المحاولة مرة أخرى.",
        "success": "تم الدفع بنجاح!",
        "successDetails": {
            "backToContract": "العودة إلى العقد",
            "backToWallet": "العودة إلى المحفظة",
            "goToWallet": "الذهاب إلى المحفظة",
            "missingInfo": "معرف الدفع مفقود",
            "timeout": "انتهت المهلة بانتظار التحقق من الدفع. يرجى مراجعة لوحة التحكم.",
            "verificationError": "فشل التحقق من عملية الدفع. يرجى الاتصال بالدعم الفني.",
            "walletFunded": "تم تحديث رصيد المحفظة بنجاح."
        },
        "to": "لـ",
        "total": "الإجمالي",
        "totalToPay": "المجموع للدفع",
        "transactionId": "رقم المعاملة",
        "transferred": "تم تحويل مبلغ"
    },
    "portfolio": {
        "addFirst": "إضافة أول عمل",
        "addNew": "إضافة عمل جديد",
        "card": {
            "clientPrefix": "العميل",
            "deleteItem": "حذف عنصر معرض الأعمال",
            "editItem": "تعديل عنصر معرض الأعمال"
        },
        "deleteConfirm": "هل أنت متأكد من حذف هذا العمل؟",
        "deleteError": "حدث خطأ أثناء الحذف",
        "empty": {
            "description": "قم بإضافة نماذج من أعمالك السابقة لكي يتمكن العملاء من رؤية مهاراتك وجودة عملك",
            "title": "لا توجد أعمال لعرضها"
        },
        "form": {
            "actions": {
                "add": "إضافة العمل",
                "cancel": "إلغاء",
                "save": "حفظ التغييرات"
            },
            "addTitle": "إضافة عمل جديد",
            "editTitle": "تعديل العمل",
            "fields": {
                "clientName": {
                    "label": "العميل / العلامة التجارية (اختياري)",
                    "placeholder": "مثال: Acme Corp"
                },
                "completionDate": {
                    "label": "تاريخ الإنجاز"
                },
                "description": {
                    "label": "وصف المشروع",
                    "placeholder": "اشرح تفاصيل المشروع وما قمت بإنجازه..."
                },
                "imageUpload": {
                    "label": "رفع صورة المعاينة"
                },
                "imageUrl": {
                    "label": "أو ألصق رابط الصورة",
                    "placeholder": "https://..."
                },
                "projectUrl": {
                    "label": "رابط المشروع (اختياري)",
                    "placeholder": "https://example.com"
                },
                "skills": {
                    "label": "المهارات المستخدمة",
                    "placeholder": "مثال: تصميم واجهات، تطوير واجهات، تحرير صور (افصل بينها بفاصلة)",
                    "searchPlaceholder": "ابحث واختر المهارات..."
                },
                "title": {
                    "label": "عنوان المشروع",
                    "placeholder": "مثال: تصميم متجر إلكتروني"
                },
                "tools": {
                    "label": "الأدوات المستخدمة (اختياري)",
                    "searchPlaceholder": "ابحث واختر الأدوات..."
                }
            },
            "imageHint": "يمكنك رفع صورة المعاينة أو لصق رابط صورة مباشر.",
            "skills": {
                "clearAll": "حذف الكل",
                "edit": "تعديل",
                "noResults": "لا توجد مهارات مطابقة.",
                "noneSelected": "لم يتم اختيار أي مهارة بعد.",
                "remove": "إزالة المهارة",
                "sections": {
                    "business": "الأعمال",
                    "data": "البيانات",
                    "design": "التصميم",
                    "development": "التطوير",
                    "marketing": "التسويق",
                    "other": "أخرى",
                    "video": "الفيديو",
                    "writing": "الكتابة"
                }
            },
            "tools": {
                "clearAll": "حذف الكل",
                "edit": "تعديل",
                "noResults": "لا توجد أدوات مطابقة.",
                "noneSelected": "لم يتم اختيار أي أداة بعد.",
                "remove": "إزالة الأداة",
                "sections": {
                    "design": "التصميم",
                    "development": "التطوير",
                    "marketing": "التسويق",
                    "other": "أخرى",
                    "productivity": "الإنتاجية",
                    "video": "الفيديو"
                }
            },
            "upload": {
                "action": "رفع الصورة",
                "addExtraUrl": "إضافة",
                "addMore": "إضافة صورة",
                "addUrl": "إضافة الرابط",
                "coverUrlPlaceholder": "https://example.com/cover-image.jpg",
                "delete": "حذف الصورة",
                "deleteCover": "حذف الغلاف",
                "dragDropHint": "قم بسحب وإفلات الصورة أو انقر للتصفح. JPEG، PNG، WEBP (الحد الأقصى 5 ميغابايت)",
                "edit": "تعديل الصورة",
                "error": "فشل رفع الصورة",
                "extraAdded": "تمت إضافة الصورة إلى المعرض",
                "extraImageUrlPlaceholder": "أضف رابط صورة إضافي...",
                "extraUrlPlaceholder": "https://image-url.com/preview.jpg",
                "galleryLabel": "معرض المشروع (اختياري)",
                "loginRequired": "يرجى تسجيل الدخول لرفع الصور.",
                "networkError": "خدمة رفع الصور غير متاحة حالياً. يمكنك إدخال رابط صورة مباشر.",
                "pasteUrlHint": "أو الصق رابط صورة مباشر للغلاف:",
                "permissionError": "ليس لديك صلاحية لرفع الملفات إلى التخزين.",
                "previewAlt": "صورة معاينة معرض الأعمال",
                "remove": "إزالة",
                "replace": "استبدال الصورة",
                "replaceCover": "استبدال الغلاف",
                "success": "تم رفع الصورة بنجاح",
                "uploadCover": "رفع صورة الغلاف",
                "uploading": "جارٍ الرفع..."
            },
            "validation": {
                "descriptionMin": "الوصف يجب أن يكون 10 أحرف على الأقل",
                "imageRequired": "يرجى رفع صورة أو إضافة رابط صورة مباشر",
                "invalidImageUrl": "يرجى استخدام رابط صورة مباشر يبدأ بـ http أو https",
                "invalidUrl": "يرجى استخدام رابط صحيح يبدأ بـ http أو https",
                "skillsLimit": "يمكنك اختيار {{count}} مهارة كحد أقصى",
                "titleMin": "العنوان يجب أن يكون 3 أحرف على الأقل",
                "toolsLimit": "يمكنك اختيار {{count}} أداة كحد أقصى"
            }
        },
        "loadError": "حدث خطأ أثناء تحميل المعرض",
        "modal": {
            "description": "Project Description",
            "skills": "Skills Used",
            "tools": "Tools Used"
        },
        "saveError": "حدث خطأ أثناء حفظ العمل",
        "subtitle": "قم بإضافة وتعديل أعمالك السابقة لزيادة فرصك في التوظيف",
        "title": "إدارة معرض الأعمال",
        "view": {
            "gridAria": "عرض الشبكة",
            "listAria": "عرض القائمة"
        },
        "workAdded": "تم إضافة العمل بنجاح",
        "workDeleted": "تم حذف العمل بنجاح",
        "workSaved": "تم حفظ العمل بنجاح",
        "workUpdated": "تم تحديث العمل بنجاح"
    },
    "profile": {
        "addLanguage": "Add Language",
        "availability": "Availability",
        "bio": "المسمى المهني",
        "bioHint": "A short summary improves credibility and response quality.",
        "bioPlaceholder": "عرّف بخبرتك في سطر واضح",
        "browse": "تصفح الملفات",
        "budgetOptions": {
            "fixed": "سعر ثابت",
            "flexible": "مرن / حسب المشروع",
            "hourly": "سعر بالساعة"
        },
        "budgetPreference": "تفضيل الميزانية الافتراضي",
        "communicationPlaceholder": "مثال: نفضل Slack أو البريد الإلكتروني، تحديثات أسبوعية...",
        "communicationPreferences": "تفضيلات التواصل",
        "companyDetailsDesc": "معلومات الشركة، وتفضيلات التوظيف وأسلوب التواصل",
        "companyDetailsTitle": "تفاصيل الشركة",
        "companyIndustry": "مجال العمل",
        "companyName": "اسم الشركة",
        "companyNamePlaceholder": "أدخل اسم شركتك",
        "companyRole": "دورك",
        "companyRolePlaceholder": "مثال: مدير التوظيف، الرئيس التنفيذي",
        "companySize": "حجم الشركة",
        "companySizeOptions": {
            "elevenToFifty": "11–50 موظفاً",
            "fiftyOneToTwoHundred": "51–200 موظفاً",
            "justMe": "أنا فقط",
            "oneToTen": "1–10 موظفين",
            "twoHundredPlus": "+201 موظفاً"
        },
        "companyWebsite": "الموقع الإلكتروني",
        "dragDrop": "اسحب الملفات هنا أو ارفعها من جهازك",
        "education": {
            "add": "أضف دراسة",
            "degree": "الشهادة",
            "degreePlaceholder": "Degree Placeholder",
            "endYear": "سنة النهاية",
            "endYearPlaceholder": "e.g. 2023",
            "field": "التخصص",
            "fieldPlaceholder": "e.g. Computer Science",
            "institution": "المؤسسة",
            "institutionPlaceholder": "e.g. University of Tunis",
            "noEducation": "لا توجد بيانات تعليم بعد",
            "noEducationList": "No education details listed. Click \"Add Education\" to add.",
            "startYear": "سنة البداية",
            "startYearPlaceholder": "e.g. 2020",
            "title": "التعليم"
        },
        "fullName": "الاسم الكامل",
        "fullNamePlaceholder": "أدخل اسمك الكامل",
        "generalInfo": "General Professional Info",
        "headline": "Professional title",
        "headlinePlaceholder": "UI/UX Designer, Full-stack Developer...",
        "hiringNeeds": "احتياجات التوظيف (مفصولة بفاصلة)",
        "hiringNeedsPlaceholder": "مثال: مصممون، مطورون",
        "hourlyRate": "Hourly Rate",
        "hourlyRatePlaceholder": "e.g. 35",
        "industries": "Industries you understand",
        "industriesHint": "Select up to 4 industries where you can work confidently.",
        "industriesLimit": "Industries Limit",
        "industriesTitle": "Industries",
        "languages": {
            "add": "أضف لغة",
            "levels": {
                "basic": "أساسي",
                "conversational": "محادثة",
                "fluent": "متقن",
                "native": "لغة أم",
                "nativeBilingual": "Native or Bilingual"
            },
            "names": {
                "arabic": "Arabic",
                "english": "English",
                "french": "French"
            },
            "select": "اختر لغة",
            "title": "اللغات"
        },
        "legalPlaceholder": "مثال: مطلوب اتفاقية عدم إفشاء قبل البدء...",
        "legalPreferences": "التفضيلات القانونية",
        "location": "الولاية",
        "noLanguages": "No languages listed. Click \"Add Language\" to add.",
        "noMatchingSkills": "No matching skills found.",
        "noSkills": "No skills selected yet. Search below to add skills.",
        "optional": "اختياري",
        "phone": "Phone number",
        "phonePlaceholder": "Used for trust and contact follow-up",
        "portfolioLinks": "Portfolio Links",
        "portfolioLinksHint": "Share links clients can open fast. Avoid private links.",
        "portfolioLinksPlaceholder": "https://site.com/work-1, https://behance.net/mywork",
        "portfolioPreferencesTitle": "Portfolio & Work Preferences",
        "professionalDetails": "Professional Details",
        "professionalDetailsDesc": "Manage your title, rate, skills and availability",
        "projectPreferences": "Project preferences",
        "projectPreferencesPlaceholder": "Describe ideal project size, communication style, and decision cadence.",
        "recordVoice": "سجل تعريفك الصوتي",
        "revisionPolicy": "Revision policy",
        "revisionPolicyPlaceholder": "Example: 2 revisions included, additional revisions billed separately.",
        "screeningPlaceholder": "مثال: معرض الأعمال مطلوب، اختبار تقني متوقع...",
        "screeningPreferences": "تفضيلات الفحص والفرز",
        "searchResults": "Search Results",
        "searchSkills": "Search skills...",
        "searchSkillsPlaceholder": "Type to search e.g. React, UI/UX...",
        "searchTools": "Search tools...",
        "secondarySkills": "more",
        "selectIndustry": "اختر مجال العمل",
        "selectLanguagePlaceholder": "Select language...",
        "selectLocation": "اختر الولاية",
        "skills": "المهارات",
        "skillsLimit": "Skills Limit",
        "skillsSpec": "Skills you specialize in",
        "skillsTitle": "Expertise & Skills",
        "stopRecording": "إيقاف التسجيل",
        "suggestedSkills": "Suggested Skills",
        "timelineOptions": {
            "asap": "في أقرب وقت ممكن",
            "flexible": "مرن",
            "oneToThreeMonths": "من 1 إلى 3 أشهر",
            "threeToSixMonths": "من 3 إلى 6 أشهر"
        },
        "timelinePreference": "تفضيل الجدول الزمني الافتراضي",
        "tools": "Tools",
        "toolsHint": "Select up to 6 tools. This is visible to clients.",
        "toolsLimit": "Tools Limit",
        "toolsOptional": "Tools Optional",
        "toolsTitle": "Tools you use",
        "voiceIntro": "التعريف الصوتي",
        "weeklyAvailability": "Weekly Availability",
        "weeklyAvailabilityHint": "Clients use this to decide if your timeline fits their project.",
        "weeklyAvailabilityHours": "Weekly Availability Hours",
        "weeklyAvailabilityPlaceholder": "e.g. 30",
        "workSamples": "نماذج الأعمال",
        "workspaceModeTip": "You are currently in ___MODE___ mode. Switch your workspace in the header to edit the other profile\\'s settings.",
        "yearsExperience": "Years of experience",
        "yearsExperiencePlaceholder": "e.g. 3"
    },
    "proposalModal": {
        "addFile": "إضافة ملف",
        "attachmentsOptional": "المرفقات (اختياري)",
        "bidLabel": "عرضك:",
        "cancel": "إلغاء",
        "coverLetter": "خطاب التقديم",
        "coverLetterMinHint": "{{count}} حرف على الأقل",
        "coverLetterPlaceholder": "صف نهجك وخبراتك ذات الصلة وسبب كونك الأنسب لهذه الوظيفة...",
        "delivery": {
            "fiveDays": "5 أيام",
            "oneDay": "يوم واحد",
            "oneMonth": "شهر",
            "oneWeek": "أسبوع",
            "threeDays": "3 أيام",
            "twoDays": "يومان",
            "twoMonths": "شهران",
            "twoWeeks": "أسبوعان"
        },
        "deliveryTime": "مدة التسليم",
        "fileLimit": "الحد الأقصى {{size}} ميغابايت لكل ملف",
        "jobContext": "سياق الوظيفة",
        "platformFee": "رسوم المنصة ({{percent}}%)",
        "removeAttachmentAria": "Remove attachment: {{name}}",
        "submit": "تقديم العرض",
        "submitting": "جارٍ الإرسال...",
        "title": "تقديم عرض",
        "validation": {
            "bidMax": "الحد الأقصى للعرض هو {{amount}} {{currency}}",
            "bidMin": "الحد الأدنى للعرض هو {{amount}} {{currency}}",
            "coverLetterMax": "يجب ألا يتجاوز خطاب التقديم {{count}} حرف",
            "coverLetterMin": "يجب أن يحتوي خطاب التقديم على {{count}} حرف على الأقل",
            "deliveryMax": "الحد الأقصى للتسليم هو {{count}} يوم",
            "deliveryMin": "الحد الأدنى للتسليم هو {{count}} يوم"
        },
        "youReceive": "ستحصل على"
    },
    "publicProfile": {
        "about": "عن الموظف",
        "available": "متاح",
        "busy": "مشغول",
        "earned": "ربح",
        "editProfile": "تحرير البروفايل",
        "memberSince": "منذ",
        "months": "أشهر",
        "noBio": "لم يضف الموظف نبذة بعد",
        "noReviews": "لا توجد تقييمات بعد",
        "noSamples": "لا توجد نماذج أعمال بعد",
        "offline": "غير متاح",
        "reviews": "التقييمات",
        "sendMessage": "إرسال رسالة",
        "showMore": "عرض المزيد",
        "skills": "المهارات",
        "voiceIntro": "التعريف الصوتي",
        "workSamples": "نماذج الأعمال"
    },
    "reviews": {
        "client": "عميل",
        "commentLabel": "Comment Label",
        "commentPlaceholder": "Share details of your experience...",
        "freelancer": "موظف حر",
        "helpful": "Helpful",
        "jobLabel": "المهمة",
        "leavingReviewFor": "Leaving a review for:",
        "rating1": "Poor",
        "rating2": "Fair",
        "rating3": "Good",
        "rating4": "Very Good 👍",
        "rating5": "Excellent! 🌟",
        "ratingLabel": "How was your experience?",
        "respond": "Respond",
        "response": "Response",
        "responsePlaceholder": "Type your response...",
        "responseTitle": "Write a response",
        "responseTo": "Responding to",
        "reviewCountLabel": "reviews",
        "submitAction": "Submit Review",
        "submitResponse": "Submit Response",
        "title": "Reviews & work history"
    },
    "search": {
        "budgetNegotiable": "قابل للتفاوض",
        "budgets": {
            "0_50": "أقل من 50 د.ت",
            "100_250": "100 – 250 د.ت",
            "250_500": "250 – 500 د.ت",
            "500_plus": "+500 د.ت",
            "50_100": "50 – 100 د.ت",
            "range1": "أقل من 50 د.ت",
            "range2": "50 – 100 د.ت",
            "range3": "100 – 250 د.ت",
            "range4": "250 – 500 د.ت",
            "range5": "+500 د.ت"
        },
        "categories": {
            "design": "تصميم",
            "development": "تطوير",
            "marketing": "تسويق",
            "writing": "كتابة"
        },
        "clearAll": "مسح الكل",
        "empty": {
            "browseAllJobs": "أو تصفح جميع الوظائف",
            "popularLabel": "شائع",
            "proTipLabel": "نصيحة احترافية",
            "subtitle": "اكتشف مستقلين موهوبين ومشاريع رائعة ببضع نقرات فقط.",
            "tipFilters": "استخدم الفلاتر لتضييق النتائج حسب الميزانية والفئة",
            "tipLabel": "نصيحة",
            "tipPopular": "React وتصميم UI/UX في الصدارة هذا الأسبوع",
            "tipSpecific": "كن دقيقاً في الكلمات المفتاحية للعثور على أفضل نتيجة بسرعة",
            "titleHighlight": "المطابقة المثالية",
            "titlePrefix": "اعثر على",
            "trendingTitle": "الأكثر رواجاً الآن"
        },
        "error": {
            "description": "نواجه صعوبة في البحث حالياً.",
            "retry": "حاول مجدداً",
            "title": "حدث خطأ"
        },
        "filterSections": {
            "budgetRange": "نطاق الميزانية",
            "category": "الفئة"
        },
        "filters": "التصفية",
        "filtersTitle": "التصفية",
        "freelancers": "مستقلين",
        "jobs": "وظائف",
        "labels": {
            "freelancer": "مستقل",
            "projects": "مشروع",
            "successRate": "نجاح"
        },
        "negotiable": "قابل للتفاوض",
        "noResults": "لا توجد نتائج",
        "noResultsDesc": "لم نجد أي نتيجة تطابق بحثك",
        "noResultsView": {
            "didYouMeanPlaceholder": "هل تقصد تجربة كلمة مفتاحية أوسع؟",
            "subtitle": "لا تقلق! جرّب هذه الاقتراحات:",
            "suggestionCategoriesBody": "اطلع على المهارات الرائجة",
            "suggestionCategoriesTitle": "تصفح الفئات الشائعة",
            "suggestionFiltersBody": "أزل فلاتر الميزانية أو الفئة",
            "suggestionFiltersTitle": "وسّع الفلاتر",
            "suggestionKeywordsBody": "صياغة مختلفة تعطي نتائج أفضل",
            "suggestionKeywordsTitle": "جرّب كلمات مختلفة",
            "title": "لا توجد نتائج لـ"
        },
        "pagination": {
            "next": "التالي",
            "pageOf": "الصفحة {{page}} من {{total}}",
            "prev": "السابق"
        },
        "placeholder": "بحث...",
        "recent": "عمليات البحث الأخيرة",
        "resetFilters": "مسح جميع الفلاتر",
        "resultsCount": "عرض {{count}} نتيجة لـ \"{{query}}\"",
        "resultsFor": "نتائج البحث عن",
        "resultsLabel": "نتيجة لـ",
        "skills": "مهارات",
        "sort": {
            "budgetHigh": "الميزانية: الأعلى أولاً",
            "budgetLow": "الميزانية: الأقل أولاً",
            "newest": "الأحدث أولاً",
            "proposalsHigh": "الأكثر عروضاً"
        },
        "tabs": {
            "all": "الكل",
            "freelancers": "مستقلين",
            "jobs": "وظائف"
        },
        "trending": {
            "logoDesign": "تصميم شعار",
            "reactJs": "React JS",
            "translation": "ترجمة",
            "uiux": "UI/UX"
        },
        "trendingMeta": {
            "logoDesign": "شائع الآن",
            "reactJs": "طلب مرتفع",
            "translation": "ينمو بسرعة",
            "uiux": "رائج هذا الأسبوع"
        },
        "trendingTags": {
            "logoDesign": "تصميم شعار",
            "reactJs": "React JS",
            "translation": "ترجمة",
            "uiux": "UI/UX"
        }
    },
    "selection": {
        "cancel": "إلغاء",
        "completionRate": "إنجاز",
        "confirmSelection": "هل أنت متأكد؟",
        "hours": "ساعة",
        "jobsCompleted": "مهمة",
        "matchScore": "مطابقة",
        "noSamples": "لا توجد نماذج أعمال",
        "noVoice": "لا يوجد تسجيل صوتي",
        "readMore": "قراءة المزيد",
        "responseTimeLabel": "يرد خلال",
        "select": "اختر",
        "startWork": "نعم، ابدأ العمل",
        "topMatches": "أفضل 3 موظفين لمهمتك",
        "viewFullProfile": "عرض البروفايل الكامل",
        "voiceIntro": "التعريف الصوتي",
        "workSamples": "نماذج الأعمال"
    },
    "seo": {
        "faq": {
            "description": "إجابات واضحة حول طريقة العمل، الدفع، الضمان، والهوية على خدمة.",
            "title": "الأسئلة الشائعة"
        },
        "findFreelancers": {
            "description": "أكثر من 2500 محترف تونسي موثق ومُقيَّم وجاهز للعمل عبر التصميم، التطوير، الترجمة والاستشارة.",
            "title": "اعثر على محترفين تونسيين موثوقين"
        },
        "forClients": {
            "description": "انشر مشروعك مجاناً، استقبل عروضاً من محترفين موثقين، وادفع فقط عند الموافقة مع حماية كاملة بالضمان.",
            "title": "للعملاء وأصحاب المشاريع"
        },
        "freelancerProfile": {
            "addSkillPlaceholder": "أضف مهارة...",
            "descriptionFallback": "مستقل على منصة خدمة",
            "titleSuffix": "مستقل على خدمة",
            "typeSkillPlaceholder": "اكتب مهارة ثم اضغط Enter..."
        },
        "home": {
            "description": "تبحث عن محترفين تونسيين موثقين لمشاريعك؟ انشر مشروعك مجاناً على خدمة TN وابدأ العمل اليوم.",
            "title": "خدمة TN"
        },
        "howItWorks": {
            "description": "أربع خطوات من فكرة المشروع إلى استلام الدفع، مع ضمان، تحقق هوية، وتتبع واضح لكل دينار.",
            "title": "كيف تعمل خدمة"
        },
        "jobBoard": {
            "description": "استكشف مشاريع جديدة في تونس وابحث عن فرص تناسب مهاراتك وسعرك وخبرتك.",
            "title": "وظائف ومشاريع مستقلة"
        },
        "jobDetail": {
            "descriptionFallback": "اطلع على تفاصيل المشروع والميزانية والمتطلبات قبل التقديم.",
            "titleSuffix": "تفاصيل المشروع"
        },
        "login": {
            "description": "عد إلى حسابك على خدمة وتابع مشاريعك ورسائلك ومدفوعاتك.",
            "title": "سجّل الدخول إلى خدمة"
        },
        "notifications": {
            "description": "إخطاراتك",
            "title": "الإخطارات | خدمة"
        },
        "signup": {
            "description": "انضم إلى أكثر من 2500 محترف يبنون مسيرتهم ويُديرون مشاريعهم على خدمة.",
            "title": "أنشئ حسابك على خدمة"
        }
    },
    "settings": {
        "account": "الحساب",
        "accountOverview": "نظرة عامة على الحساب",
        "accountOverviewDescription": "هذه النافذة هي نقطة التحكم في كيفية إعداد حسابك. قم بالتبديل إلى \"البروفايل\" لتعديل التفاصيل أو تغيير جاهزية مساحة العمل.",
        "accountOverviewTitle": "هويتك وجاهزية مساحة العمل",
        "accountTabHint": "حدّث تفاصيلك وإعدادات مساحة العمل",
        "accountType": "نوع الحساب",
        "accountTypeBoth": "كلاهما",
        "accountTypeBothDesc": "الاثنين معاً",
        "accountTypeClient": "صاحب مشروع",
        "accountTypeClientDesc": "أبحث عن مستقلين",
        "accountTypeFreelancer": "مستقل",
        "accountTypeFreelancerDesc": "أقدم خدماتي",
        "accountTypeUnknown": "غير محدد",
        "accountVerificationTitle": "Account Verification & Trust",
        "activeContext": "السياق النشط",
        "activeSessionsMessage": "هذا الجهاز هو الجهاز النشط الوحيد",
        "activeSessionsTitle": "الجلسات النشطة",
        "add": "إضافة",
        "addMethod": "إضافة طريقة",
        "addPassword": "إضافة كلمة مرور",
        "addPaymentMethod": "إضافة طريقة دفع",
        "addPaymentMethodModalTitle": "إضافة طريقة دفع",
        "bankAccountNumber": "رقم الحساب البنكي",
        "bankTransfer": "تحويل بنكي",
        "bioLabel": "نبذة عني",
        "bioPlaceholder": "اكتب نبذة مختصرة عن نفسك...",
        "changePassword": "تغيير كلمة المرور",
        "changePasswordTitle": "تغيير كلمة المرور",
        "cinVerification": "توثيق البطاقة",
        "completeProfile": "أكمل ملفك الشخصي",
        "completion": {
            "accountType": "نوع الحساب",
            "avatar": "الصورة الشخصية",
            "bio": "نبذة عني",
            "fullName": "الاسم",
            "identityVerification": "توثيق الهوية",
            "location": "الموقع",
            "onboarding": "إكمال الملف"
        },
        "confirmPassword": "تأكيد كلمة المرور",
        "currentPassword": "كلمة المرور الحالية",
        "currentWorkspace": "مساحة العمل الحالية",
        "default": "افتراضي",
        "deleteAccount": "حذف الحساب",
        "deleteAccountConfirmAction": "نعم، احذف حسابي",
        "deleteAccountConfirmMessage": "هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي.",
        "deleteAccountConfirmTitle": "تأكيد حذف الحساب",
        "deleteAccountDescription": "سيتم حذف حسابك وجميع بياناتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.",
        "deleteAccountTitle": "حذف الحساب",
        "deleteMyAccount": "حذف حسابي",
        "deletePaymentMethod": "حذف {{label}}",
        "deleteWarning": "هذا الإجراء لا يمكن التراجع عنه",
        "deletingRequestSubmitting": "Submitting...",
        "deliveryMethod": {
            "email": "بريد إلكتروني",
            "inApp": "داخل التطبيق فقط",
            "sms": "رسالة نصية"
        },
        "discard": "Discard",
        "editProfile": "Edit Profile",
        "emailOptionalLabel": "البريد الإلكتروني (اختياري)",
        "emailPlaceholder": "email@example.com",
        "fullName": "الاسم الكامل",
        "globalPermission": "الصلاحية العامة",
        "goToDashboard": "الذهاب إلى لوحة التحكم",
        "goToDashboardDescription": "العودة إلى مساحة عملك",
        "goToProfile": "تعديل الملف الشخصي",
        "heroDescription": "احتفظ بتفاصيل الحساب والأمان والمدفوعات وسلوك الإشعارات في مكان تحكم واحد وثابت. قم بتحديث ما يهمك دون أن تفقد مكانك في المنصة.",
        "identityPending": "قيد المراجعة",
        "identityVerificationTitle": "توثيق الهوية",
        "identityVerified": "هوية موثقة",
        "language": "اللغة",
        "location": "الموقع",
        "logout": "تسجيل الخروج",
        "moreRequired": "+{{count}} آخرين",
        "newPassword": "كلمة المرور الجديدة",
        "noBio": "No bio added yet",
        "noPasswordMessage": "لا توجد كلمة مرور - أنت تستخدم تسجيل الدخول عبر الهاتف",
        "noPasswordOAuth": "تم تسجيل الدخول عبر {{provider}} — لا حاجة لكلمة مرور",
        "noPaymentMethods": "لم تضف أي طريقة دفع بعد",
        "noPaymentMethodsDescription": "أضف طريقة دفع الآن لتكون مستعدة عند حاجتك إليها لاستلام الأرباح أو سحب الأموال. جميع بيناتك محمية ومشفرة.",
        "notificationChannel": "القنوات",
        "notificationSettings": {
            "contractUpdates": "تحديثات العقود",
            "marketing": "العروض والتحديثات",
            "marketingDesc": "نصائح وتحديثات من WorkedIn",
            "newMatches": "وظائف جديدة",
            "newMatchesDesc": "تلقي إشعار عند وجود وظائف تناسب مهاراتك",
            "newMessages": "رسائل جديدة",
            "newMessagesDesc": "تلقي إشعار عند استلام رسائل جديدة",
            "payments": "مدفوعات",
            "paymentsDesc": "تلقي إشعار عند إرسال أو استلام المدفوعات",
            "platformNews": "أخبار المنصة",
            "reviews": "التقييمات",
            "reviewsDesc": "تلقي إشعار عند استلام تقييم جديد"
        },
        "notifications": "الإشعارات",
        "notificationsEnabled": "القواعد النشطة",
        "notificationsSubtitle": "اختر الإشعارات التي تريد استلامها",
        "notificationsTotal": "سرعة التسليم",
        "oauthPasswordMessage": "لقد سجلت الدخول عبر {{provider}}. إدارة كلمة المرور تتم عبر مزود الهوية الخاص بك.",
        "onboardingStatus": "حالة الإعداد",
        "pageTitle": "الإعدادات",
        "passwordChanged": "تم تحديث كلمة المرور بنجاح",
        "passwordSet": "تم تعيين كلمة المرور",
        "passwordStatus": "حالة كلمة المرور",
        "passwordTooShort": "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل",
        "passwordUpdateFailed": "فشل تحديث كلمة المرور",
        "passwordsDoNotMatch": "كلمتا المرور غير متطابقتين",
        "payment": "الدفع",
        "paymentDetails": "تفاصيل الدفع",
        "paymentMethodType": "نوع طريقة الدفع",
        "paymentMethods": "طرق الدفع",
        "paymentMethodsCount": "الطرق المحفوظة",
        "paymentSubtitle": "طرق الدفع والاستلام",
        "pending": "قيد المراجعة",
        "phoneNumber": "رقم الهاتف",
        "phoneNumberLabel": "رقم الهاتف",
        "phoneUnverifiedBadge": "Add a number to show a phone-verified trust badge on job posts & profiles",
        "phoneVerifiedBadge": "Verified for project and transaction notifications",
        "preferredMethod": "الطريقة المفضلة",
        "privacy": "الخصوصية",
        "privacySettings": {
            "activeContracts": "العقود النشطة فقط",
            "anyone": "أي شخص",
            "hidden": "مخفي",
            "profileVisibility": "ظهور البروفايل",
            "public": "عام",
            "showEarnings": "عرض الأرباح للجميع",
            "whoCanMessage": "من يمكنه مراسلتك"
        },
        "profile": "البروفايل",
        "profileComplete": "الملف مكتمل",
        "profileCompletion": "اكتمال الملف الشخصي",
        "profileCompletionTitle": "اكتمال الملف الشخصي",
        "profileDetailsTitle": "Profile Details",
        "profileReadiness": "جاهزية الملف",
        "profileTabs": {
            "basic": "Basic Info",
            "client": "Client",
            "freelancer": "Freelancer",
            "workspace": "Workspace"
        },
        "quickActions": "إجراءات سريعة",
        "readyForTransactions": "جاهزة للمعاملات",
        "requiredLabel": "المطلوب:",
        "reviewNotifications": "إدارة الإشعارات",
        "reviewNotificationsDescription": "تحكم في التنبيهات",
        "save": "حفظ",
        "saveAll": "Save all changes",
        "saveChanges": "حفظ التغييرات",
        "saved": "تم الحفظ",
        "saving": "Saving...",
        "securityPosture": "مستوى الأمان",
        "securityPostureValue": "محمي بواسطة ضوابط جلسة الحساب",
        "setDefault": "تعيين كافتراضي",
        "setupStatus": {
            "allDone": "اكتملت جميع خطوات الإعداد المطلوبة.",
            "complete": "مكتمل",
            "done": "تم",
            "identityVerification": "توثيق الهوية",
            "pending": "قيد الانتظار",
            "profileBasics": "أساسيات الملف",
            "workspaceSetup": "إعداد مساحة العمل"
        },
        "signOutAllDevices": "تسجيل الخروج من كل الأجهزة",
        "tabDescriptions": {
            "account": "وضع مساحة العمل، نظرة عامة على الحساب، دليلك للإعداد",
            "notifications": "اختر الإشعارات التي تصلك وعدد مرات وصولها",
            "payment": "طرق الدفع، الإعدادات الافتراضية، وتفاصيل المعاملات",
            "profile": "الهوية، النبذة، الصورة الشخصية، وجاهزية مساحة العمل",
            "security": "التحكم في الجلسات، أمان الحساب، والإجراءات الحاسمة"
        },
        "toasts": {
            "avatarUpdateError": "حدث خطأ في رفع الصورة",
            "avatarUpdated": "تم تحديث الصورة الشخصية",
            "defaultPaymentUpdated": "تم تحديث طريقة الدفع الافتراضية",
            "deleteRequestAlreadyOpen": "You already have an active account deletion request under review.",
            "deleteRequestSent": "تم إرسال طلب حذف الحساب. سيتم معالجته خلال 48 ساعة.",
            "genericError": "حدث خطأ",
            "invalidPhone": "Please enter a valid phone number.",
            "paymentAddError": "حدث خطأ في الإضافة",
            "paymentAdded": "تم إضافة طريقة الدفع",
            "paymentDeleteError": "حدث خطأ في الحذف",
            "paymentDeleted": "تم حذف طريقة الدفع",
            "phoneTaken": "Phone number already in use.",
            "profileSaveError": "حدث خطأ في حفظ التغييرات",
            "profileSaved": "تم حفظ التغييرات بنجاح",
            "workspaceBothEnabled": "تم تفعيل مساحتي العمل في نفس الحساب.",
            "workspaceUpdated": "تم تحديث مساحة العمل بنجاح."
        },
        "toggleNotification": "تبديل {{label}}",
        "unsavedChanges": "You have unsaved changes",
        "updatePassword": "تحديث كلمة المرور",
        "updatingPassword": "جارٍ التحديث...",
        "uploadCin": "رفع صورة البطاقة",
        "userFallback": "المستخدم",
        "verified": "موثق",
        "verifiedLoginEmail": "Verified Login Email",
        "verifyIdentity": "وثّق هويتك",
        "viewProfile": "View public profile"
    },
    "support": {
        "errors": {
            "permissions": "Support request could not be submitted due to account permissions. Please email us directly at support@workedin.tn",
            "requiredFields": "Please fill in all required fields",
            "sendFailed": "Failed to send message. Please try again or email us directly at support@workedin.tn"
        },
        "form": {
            "description": "Fill out the form below and our support team will get back to you as soon as possible.",
            "emailAddress": "Email Address",
            "fullName": "Full Name",
            "fullNamePlaceholder": "Enter your full name",
            "message": "Message",
            "messagePlaceholder": "Please describe your issue in detail...",
            "sendMessage": "Send Message",
            "sending": "Sending...",
            "subject": "Subject",
            "subjectPlaceholder": "Brief description of your issue"
        },
        "success": {
            "sent": "Your message has been sent successfully. We will get back to you soon."
        }
    },
    "testimonials": {
        "items": [{"name":"محمد علي","role":"مصمم جرافيكي","quote":"بفضل كيدمة، ربحت أكثر من 5000 دينار في شهرين فقط. المنصة سهلة الاستخدام والدفع سريع.","earned":"5,200","image":"https://i.pravatar.cc/150?img=11"},{"name":"فاطمة بن سعيد","role":"مترجمة","quote":"أفضل منصة مواهب في تونس. لا توجد مزايدات، العملاء يجدونني تلقائياً.","earned":"3,800","image":"https://i.pravatar.cc/150?img=32"},{"name":"أحمد الهادي","role":"مبرمج مواقع","quote":"الدفع المحلي سهّل كل شيء. D17 أو تحويل بنكي، كل الطرق متاحة.","earned":"8,500","image":"https://i.pravatar.cc/150?img=53"}],
        "title": "قصص نجاح تونسية"
    },
    "time": {
        "days": "Days",
        "hours": "Hours",
        "lessThanHour": "Just now"
    },
    "toast": {
        "close": "إغلاق",
        "error": "خطأ",
        "info": "معلومة",
        "success": "نجاح",
        "warning": "تنبيه"
    },
    "toasts": {
        "common": {
            "error": "حدث خطأ",
            "genericError": "Error",
            "success": "تمت العملية بنجاح"
        },
        "contract": {
            "acceptError": "حدث خطأ في قبول العمل",
            "acceptSuccess": "تم قبول العمل وإتمام الدفع!",
            "deliverError": "حدث خطأ في تسليم العمل",
            "deliverSuccess": "تم تسليم العمل بنجاح!",
            "disputeError": "حدث خطأ في فتح النزاع",
            "disputeSuccess": "تم فتح نزاع. سيتم المراجعة خلال 48 ساعة.",
            "requestChanges": "طلب تعديلات",
            "requestChangesSuccess": "تم إرسال طلب التعديلات",
            "reviewSuccess": "تم إرسال تقييمك بنجاح"
        },
        "forgotPassword": {
            "linkSent": "تم إرسال رابط إعادة التعيين",
            "rateLimitError": "تم تجاوز عدد المحاولات. حاول مرة أخرى لاحقاً."
        },
        "job": {
            "linkCopied": "تم نسخ الرابط",
            "loginRequired": "سجل الدخول لحفظ الوظيفة",
            "saved": "تم حفظ الوظيفة",
            "unsaved": "تم إزالة الوظيفة من المحفوظات"
        },
        "matches": {
            "contractError": "حدث خطأ في إنشاء العقد",
            "contractSuccess": "تم بدء العقد بنجاح!",
            "searchError": "حدث خطأ في البحث عن تطابقات"
        },
        "portfolio": {
            "addSuccess": "تم إضافة العمل بنجاح",
            "deleteError": "حدث خطأ أثناء الحذف",
            "deleteSuccess": "تم حذف العمل بنجاح",
            "loadError": "حدث خطأ أثناء تحميل المعرض",
            "saveError": "حدث خطأ أثناء حفظ العمل",
            "updateSuccess": "تم تحديث العمل بنجاح"
        },
        "proposals": {
            "archiveError": "فشل أرشفة العرض",
            "archiveSuccess": "تم أرشفة العرض",
            "hireError": "فشل توظيف المستقل. حاول مرة أخرى",
            "hireFirstMessage": "يجب توظيف المستقل أولاً لبدء المحادثة",
            "hireSuccess": "تم توظيف المستقل بنجاح! 🎉",
            "loadError": "فشل تحميل العروض",
            "loadJobError": "فشل تحميل بيانات المشروع",
            "shortlistAdded": "تمت الإضافة إلى القائمة المختصرة",
            "shortlistError": "حدث خطأ أثناء تحديث القائمة المختصرة",
            "shortlistRemoved": "تمت الإزالة من القائمة المختصرة",
            "submitSuccess": "تم إرسال العرض بنجاح!",
            "withdrawError": "حدث خطأ في سحب العرض",
            "withdrawSuccess": "تم سحب العرض بنجاح"
        },
        "resetPassword": {
            "linkExpired": "رابط إعادة التعيين منتهي الصلاحية",
            "success": "تم تغيير كلمة المرور بنجاح"
        }
    },
    "ui": {
        "addNow": "Add now",
        "admin": "ADMIN",
        "avatar": "Avatar",
        "back": "back",
        "basic_empty_state": "Basic Empty State",
        "basic_progress": "Basic Progress",
        "cancel": "Cancel",
        "card_skeleton": "Card Skeleton",
        "change": "Change",
        "circular_skeleton": "Circular Skeleton",
        "coming_soon": "قريباً",
        "complete": "complete",
        "contact_workedin_tn": "contact@workedin.tn",
        "ctrl_k": "Ctrl+K",
        "custom_label": "Custom Label",
        "default": "Default",
        "delivered": "Delivered",
        "e_g": "e.g. 50",
        "edit": "Edit",
        "empty_state": "Empty State",
        "enter": "Enter",
        "error": "Error",
        "error_state": "Error State",
        "esc": "ESC",
        "f": "F",
        "front": "front",
        "hr": "/hr",
        "https": "https://...",
        "https_example_com": "https://example.com",
        "iban": "رقم IBAN",
        "id": "ID",
        "in": "IN",
        "indeterminate_progress": "Indeterminate Progress",
        "kb": "KB)",
        "legal_workedin_tn": "legal@workedin.tn",
        "loading": "Loading...",
        "max_files": "Max: 5 files",
        "mb": "MB",
        "no_items_found": "No items found",
        "no_projects_yet": "No projects yet",
        "no_results_found": "No results found",
        "playing": "Playing...",
        "popular": "Popular",
        "preview": "Preview",
        "privacy_workedin_tn": "privacy@workedin.tn",
        "progress": "Progress",
        "progress_bar": "Progress Bar",
        "read": "Read",
        "recommended": "موصى به",
        "recording": "Recording:",
        "rectangular_skeleton": "Rectangular Skeleton",
        "s": "s",
        "save": "Save",
        "selfie": "selfie",
        "sizes": "Sizes",
        "skeleton": "Skeleton",
        "skeleton_group": "Skeleton Group",
        "something_went_wrong": "Something went wrong",
        "spinner": "Spinner",
        "success": "Success",
        "text_skeleton": "Text Skeleton",
        "times": "&times;",
        "tip": "Tip",
        "title": "Title",
        "tn": "TN59 ...",
        "tn_xxxxx": "TN59XXXXX...",
        "toast": {
            "close": "إغلاق"
        },
        "uploading_files": "Uploading files...",
        "variants": "Variants",
        "verified": "Verified",
        "warning": "Warning",
        "with_action": "With Action",
        "with_label": "With Label",
        "with_secondary_action": "With Secondary Action",
        "worked": "WORKED",
        "workedin": "WorkedIn •",
        "xx_xxx_xxx": "+216 XX XXX XXX"
    },
    "valuePropositions": {
        "badge": "لماذا خدمة",
        "heading": "مبني بشكل مختلف. لتونس.",
        "matched": {
            "description": "تقدم للمشاريع التي تناسب مستوى مهاراتك وسعرك بالضبط. لا تتنافس على السعر - فقط على الجودة.",
            "title": "عمل متطابق"
        },
        "protected": {
            "description": "يتم احتفاظ الأموال في الضمان قبل بدء العمل. تحصل على الراتب في اللحظة التي يوافق عليها العميل.",
            "title": "رواتب محمية"
        },
        "reputation": {
            "description": "أظهر حالة التحقق والمحفظة والتقييمات. اكسب الثقة قبل أن تقول كلمة واحدة.",
            "title": "بناء السمعة"
        }
    },
    "values": {
        "localPayment": {
            "description": "TND، D17، وتحويلات مناسبة للسوق التونسي",
            "title": "دفع محلي"
        },
        "microJobs": {
            "description": "من المهام السريعة إلى العقود الأكبر",
            "title": "مشاريع حقيقية"
        },
        "noBidding": {
            "description": "ملف قوي ومطابقة ذكية بدل سباق أسعار",
            "title": "بدون مزايدات"
        }
    },
    "verifyEmail": {
        "checkSpam": "إذا لم تجد البريد، تحقق من مجلد الرسائل غير المرغوب فيها.",
        "noEmail": "عنوان البريد الإلكتروني مطلوب",
        "resend": "إعادة إرسال بريد التحقق",
        "resendCooldown": "إعادة الإرسال بعد {{seconds}} ثانية",
        "resendSuccess": "تم إرسال بريد التحقق بنجاح",
        "subtitle": "أرسلنا رابط التحقق إلى {{email}}. انقر عليه لتفعيل حسابك.",
        "title": "تحقق من بريدك الإلكتروني",
        "wrongEmail": "بريد خاطئ؟ العودة للتسجيل"
    },
    "verifyIdentity": {
        "backToSettings": "العودة إلى الإعدادات",
        "changeImage": "تغيير",
        "dragDropHint": "أو اسحب الملف وأفلته هنا",
        "errors": {
            "alreadySubmitted": "لديك بالفعل طلب تحقق قيد المعالجة.",
            "alreadyUnderReview": "Your verification request is already under review.",
            "alreadyVerified": "Your identity is already verified.",
            "fileReadFailed": "فشل في قراءة هذا الملف. يرجى تجربة صورة أخرى.",
            "fileTooLarge": "حجم الملف كبير جداً (الحد الأقصى 5MB)",
            "insertTimeout": "انتهت مهلة إدراج البيانات بعد 30 ثانية. قد تكون Supabase تحت الصيانة.",
            "invalidCin": "رقم البطاقة يجب أن يحتوي على 8 أرقام",
            "invalidImage": "يجب تحميل صورة صالحة",
            "lowResolution": "دقة الصورة منخفضة جداً. استخدم صورة أوضح.",
            "missingImages": "يرجى تحميل جميع الصور المطلوبة",
            "noSession": "لا توجد جلسة مصادقة، يرجى تسجيل الدخول مجدداً",
            "permissions": "تم رفض الإذن. يرجى تسجيل الخروج ثم تسجيل الدخول مرة أخرى.",
            "resubmitBlocked": "Unable to reset your previous request. Please contact support.",
            "unexpected": "حدث خطأ غير متوقع",
            "withMessage": "خطأ: {{message}}"
        },
        "fileFormatHint": "JPG, PNG (Max 5MB)",
        "goToDashboard": "الذهاب إلى لوحة التحكم",
        "header": {
            "eta": "يستغرق حوالي 2-3 دقائق للإكمال",
            "kicker": "ترقية آمنة للحساب",
            "subtitle": "خطوة واحدة تفصلك عن زيادة ثقة عملائك وحماية حسابك",
            "title": "توثيق الهوية"
        },
        "loginAgainError": "يرجى تسجيل الدخول مرة أخرى",
        "pending": {
            "badge": "قيد المراجعة",
            "description": "تم استلام طلب التحقق من هويتك بنجاح. فريقنا يعمل على مراجعة مستنداتك.",
            "emailNotice": "سيتم إشعارك فور اكتمال المراجعة",
            "reviewTime": "مدة المراجعة: 24 ساعة كحد أقصى",
            "seoDescription": "طلب التحقق من الهوية قيد المراجعة من قبل فريقنا",
            "seoTitle": "طلب التحقق قيد المراجعة",
            "title": "طلبك قيد المراجعة"
        },
        "preview": "معاينة",
        "processing": "جاري المعالجة...",
        "progress": {
            "back": "ظهر البطاقة",
            "front": "وجه البطاقة",
            "review": "المراجعة",
            "selfie": "صورة شخصية"
        },
        "removeImage": "إزالة",
        "review": {
            "backImage": "ظهر البطاقة",
            "checkBack": "تمت إضافة صورة الوجه الخلفي",
            "checkCin": "رقم البطاقة صالح",
            "checkConsent": "تم قبول الموافقة على الخصوصية",
            "checkFront": "تمت إضافة صورة الوجه الأمامي",
            "checkSelfie": "تمت إضافة الصورة الشخصية",
            "cinLabel": "رقم بطاقة الهوية (8 أرقام)",
            "cinPlaceholder": "12345678",
            "consentPrefix": "أوافق على استخدام معلوماتي الشخصية للتحقق من هويتي وفقاً لـ ",
            "editBack": "تعديل صورة الوجه الخلفي",
            "editFront": "تعديل صورة الوجه الأمامي",
            "editSelfie": "تعديل الصورة الشخصية",
            "frontImage": "وجه البطاقة",
            "privacyNotice": "يتم تخزين بياناتك بشكل آمن ومشفر. لن يتم مشاركة معلومات هويتك مع أي طرف ثالث ويتم استخدامها فقط لغرض التحقق من الحساب.",
            "privacyPolicy": "سياسة الخصوصية",
            "readiness": "مستوى الجاهزية",
            "selfieImage": "الصورة الشخصية",
            "submit": "تأكيد وإرسال",
            "submitting": "جاري الإرسال...",
            "title": "مراجعة البيانات"
        },
        "security": {
            "desc": "مستنداتك مشفرة وتستخدم فقط لغرض التحقق من الحساب.",
            "qualityDesc": "نتحقق من نوع الملف، الحجم، وجودة الصورة الأساسية قبل الرفع.",
            "qualityTitle": "فحوصات جودة ذكية",
            "reviewDesc": "تتم مراجعة معظم طلبات التحقق خلال 24 ساعة.",
            "reviewTitle": "مراجعة سريعة",
            "title": "تخزين مشفر"
        },
        "seo": {
            "description": "قم بتوثيق هويتك لزيادة ثقة العملاء وفتح جميع ميزات المنصة",
            "title": "التحقق من الهوية"
        },
        "stepCounter": "الخطوة {{current}} من {{total}}",
        "steps": {
            "back": {
                "description": "يرجى تحميل صورة واضحة للوجه الخلفي لبطاقة التعريف الوطنية",
                "title": "صورة ظهر بطاقة التعريف"
            },
            "front": {
                "description": "يرجى تحميل صورة واضحة للوجه الأمامي لبطاقة التعريف الوطنية",
                "title": "صورة وجه بطاقة التعريف"
            },
            "selfie": {
                "description": "يرجى التقاط صورة سيلفي واضحة للتحقق من هويتك",
                "title": "صورة شخصية (سيلفي)"
            }
        },
        "submitted": {
            "description": "سيقوم فريقنا بمراجعة مستنداتك والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة). سنقوم بإشعارك عبر البريد الإلكتروني عند اكتمال المراجعة.",
            "seoDescription": "تم استلام طلب التحقق من الهوية",
            "seoTitle": "تم تقديم الطلب",
            "title": "تم استلام طلبك بنجاح"
        },
        "success": {
            "submitted": "تم تقديم طلب التحقق بنجاح"
        },
        "tipLabel": "نصيحة:",
        "tips": {
            "back": "تأكد من ظهور جميع الحواف والأرقام بوضوح وفي بؤرة التركيز.",
            "front": "ضع البطاقة على خلفية داكنة وتجنب انعكاسات الفلاش.",
            "selfie": "واجه الكاميرا في إضاءة جيدة وتجنب القبعات أو النظارات الشمسية."
        },
        "uploadHint": "اضغط لرفع الصورة",
        "verified": {
            "description": "حسابك موثق الآن وحصلت على شارة التحقق الزرقاء. يمكنك الآن الاستمتاع بجميع ميزات المنصة.",
            "title": "تم التحقق من هويتك بنجاح"
        }
    },
    "wallet": {
        "accHolderName": "اسم صاحب الحساب",
        "accountHolder": "اسم المستفيد (صاحب الحساب)",
        "activeEscrow": "Active Escrow",
        "addedToWallet": "Added to wallet",
        "amount": "المبلغ",
        "available": "متاح",
        "availableBalance": "الرصيد المتاح",
        "balance": "الرصيد المتاح",
        "bankName": "اسم البنك",
        "bankTransfer": "تحويل بنكي",
        "bankTransferDesc": "السحب مباشرة إلى حسابك البنكي المحلي",
        "cancel": "إلغاء",
        "clearingHold": "Clearing Hold",
        "comingSoonLabel": "قريباً",
        "continueToPayment": "متابعة إلى الدفع",
        "d17": "D17",
        "d17Desc": "السحب عبر D17. قريباً.",
        "date": "التاريخ",
        "deposit": "إيداع رصيد",
        "depositAmountError": "يجب أن يكون المبلغ بين {{min}} و{{max}} د.ت",
        "depositAmountLabel": "مبلغ الإيداع (د.ت)",
        "depositLimits": "الحد الأدنى: 10 د.ت - الحد الأقصى: 5,000 د.ت",
        "depositPreview": "Deposit Preview",
        "description": "الوصف",
        "earningsGrowth": "نمو الأرباح",
        "enterPhone": "الرجاء إدخال رقم الهاتف",
        "errors": {
            "accountHolderRequired": "اسم صاحب الحساب مطلوب",
            "bankNameRequired": "اسم البنك مطلوب",
            "ibanInvalid": "يجب أن يبدأ رقم IBAN بـ TN",
            "ibanRequired": "رقم IBAN مطلوب",
            "phoneInvalid": "يرجى إدخال رقم هاتف صالح",
            "phoneRequired": "رقم الهاتف مطلوب"
        },
        "fillBankDetails": "الرجاء إدخال بيانات البنك كاملة",
        "flouci": "Flouci",
        "flouciDesc": "السحب عبر محفظة فلوصي. قريباً.",
        "free": "Free",
        "frozenDisputed": "Frozen Disputed",
        "fullPaymentHistory": "سجل المدفوعات الكامل",
        "genericError": "حدث خطأ. يرجى المحاولة مرة أخرى.",
        "howItWorksTitle": "كيف يعمل",
        "iban": "رقم IBAN",
        "inReview": "In Review",
        "invalidAmount": "مبلغ غير صالح",
        "locked": "Locked",
        "lockedFunds": "جدول الأموال المحجوزة",
        "lockedFundsTitle": "جدول الأموال المحجوزة",
        "method": "طريقة السحب",
        "minAmount": "الحد الأدنى {{min}} د.ت",
        "minWithdrawalNotice": "الحد الأدنى للسحب هو {{min}} د.ت. تتم مراجعة الطلبات يدوياً قبل معالجتها.",
        "mockDepositFailed": "فشل إيداع المحفظة التجريبي",
        "monthlyBillingVolume": "حجم الفواتير الشهري المتولد (آخر 6 أشهر)",
        "monthlyFundingVolume": "حجم تمويل المنصة الشهري المنفق (آخر 6 أشهر)",
        "moreMethodsSoon": "المزيد من طرق الدفع ستكون متاحة قريباً.",
        "moveEarnings": "تحويل الأرباح إلى البنك",
        "netAmount": "المبلغ الصافي",
        "next": "التالي",
        "noLockedFunds": "لا توجد أموال محجوزة حالياً",
        "noPaymentLink": "لم يتم إنشاء رابط الدفع",
        "noTransactions": "لا توجد معاملات بعد",
        "noTransactionsDesc": "سجل معاملاتك سيظهر هنا",
        "noWithdrawals": "لا توجد سحوبات بعد",
        "noWithdrawalsDesc": "اطلب سحباً ليظهر هنا",
        "notAuthenticated": "غير مسجل الدخول",
        "pageOf": "صفحة {{page}} من {{totalPages}}",
        "paymentMethod": "طريقة الدفع",
        "pendingBalance": "قيد الانتظار في الضمان",
        "phone": "رقم الهاتف",
        "platformFeeNotice": "رسوم المنصة (~1%)",
        "previous": "السابق",
        "processingDeposit": "جارٍ المعالجة...",
        "processingFee": "Processing fee",
        "quickAmounts": "Quick Amounts",
        "recentTransactions": "المعاملات الأخيرة",
        "requestWithdrawal": "طلب سحب",
        "seo": {
            "description": "تابع رصيدك، معاملاتك، وطلبات السحب في مكان واحد.",
            "title": "المحفظة"
        },
        "spendingHistory": "سجل الإنفاق",
        "status": {
            "approved": "تمت الموافقة",
            "completed": "مكتمل",
            "pending": "قيد الانتظار",
            "processing": "قيد المعالجة",
            "rejected": "مرفوض"
        },
        "statusLabel": "الحالة",
        "steps": {
            "review": "المراجعة (2-5 أيام)",
            "reviewDesc": "يقوم فريقنا بالتحقق من طلبك",
            "submitRequest": "تقديم الطلب",
            "submitRequestDesc": "املأ وقدم تفاصيل عملية السحب الخاصة بك",
            "transferSent": "تم إرسال التحويل",
            "transferSentDesc": "تصل الأموال إلى حسابك"
        },
        "submit": "إرسال",
        "submitWithdrawal": "تقديم طلب السحب",
        "submitting": "جاري الإرسال...",
        "summary": "ملخص",
        "tabs": {
            "deposit": "إيداع",
            "overview": "نظرة عامة",
            "transactions": "المعاملات",
            "withdraw": "سحب"
        },
        "title": "محفظتي",
        "topUpWallet": "شحن المحفظة",
        "topUpWalletDesc": "Top up your wallet securely via escrow",
        "totalEarned": "إجمالي الأرباح",
        "totalWithdrawn": "إجمالي المسحوبات",
        "transactionHistory": "سجل المعاملات",
        "transactionLabel": "معاملة",
        "transferEarningsDesc": "تحويل الأرباح إلى وسيلة الدفع الخاصة بك",
        "type": "النوع",
        "unknownUser": "Unknown User",
        "viewAllArrow": "عرض الكل ←",
        "whyEscrow": "Why Dhmad Escrow?",
        "whyEscrow1": "Funds held securely until work approved",
        "whyEscrow2": "Dispute resolution built in",
        "whyEscrow3": "Zero deposit fees — pay only what you deposit",
        "withdrawalAmount": "قيمة السحب",
        "withdrawalError": "فشل في إرسال طلب السحب",
        "withdrawalHistory": "سجل السحوبات",
        "withdrawalSubmittedDesc": "ستتم مراجعة طلبك خلال 2-5 أيام عمل",
        "withdrawalSubmittedTitle": "تم إرسال طلب السحب",
        "withdrawalSuccess": "تم إرسال طلب السحب بنجاح",
        "youPay": "You pay",
        "youReceive": "ستتلقى",
        "youWithdraw": "المبلغ المسحوب"
    }
};
export type Translations = typeof ar;

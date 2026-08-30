export type Language = "ar" | "en";

export const translations = {
  ar: {
    // Navbar
    navProducts: "المنتجات",
    navGallery: "أعمالنا",
    navAbout: "من نحن",
    navContact: "تواصل معنا",
    navLogin: "دخول",
    navLogout: "خروج",
    navAdmin: "لوحة التحكم",
    navLang: "EN",

    // Hero
    heroTagline: "ديكورات منزلية فاخرة من الاستيل المطلي بدهانات إلكتروستاتيك",
    heroDescription: "نقدم لكم أعمال ديكورات منزلية مصنوعة من الاستيل عالي الجودة، مطلي بدهانات إلكتروستاتيك فاخرة تدوم طويلاً وتحافظ على رونقها",
    heroBrowseProducts: "تصفح المنتجات",
    heroWhatsApp: "تواصل عبر واتساب",
    heroFeatures1: "جودة عالية",
    heroFeatures1Desc: "استيل فاخر بدهانات إلكتروستاتيك",
    heroFeatures2: "تصميم حصري",
    heroFeatures2Desc: "أعمال فنية مميزة لكل بيت",
    heroFeatures3: "مقاسات مخصصة",
    heroFeatures3Desc: "حسب طلبك وأبعاد منزلك",
    heroFeatures4: "توصيل",
    heroFeatures4Desc: "نوصل لك لحد باب البيت",

    // Products
    productsTitle: "منتجاتنا",
    productsSubtitle: "اختر من تشكيلة أعمالنا المميزة",
    orderNow: "اطلب الآن",
    viewDetails: "التفاصيل",
    price: "السعر",
    size: "المقاس",
    color: "اللون",
    productNameAr: "الاسم بالعربي",
    productNameEn: "الاسم بالإنجليزي",
    description: "الوصف",
    category: "الفئة",

    // Order Form
    orderFormTitle: "نموذج الطلب",
    orderFormSubtitle: "املأ بياناتك وسنتواصل معك",
    customerName: "الاسم",
    customerPhone: "رقم الهاتف",
    customerAddress: "العنوان",
    orderMessage: "رسالة إضافية",
    submitOrder: "إرسال الطلب",
    orderSuccess: "تم إرسال طلبك بنجاح! سنتواصل معك قريباً",
    orderFailed: "حدث خطأ، يرجى المحاولة مرة أخرى",
    backHome: "العودة للرئيسية",
    orderProduct: "المنتج",
    requiredName: "الاسم مطلوب",
    requiredPhone: "رقم الهاتف مطلوب",

    // Gallery
    galleryTitle: "أعمالنا المنجزة",
    gallerySubtitle: "مشاريع حقيقية نفذناها لعملائنا",

    // About
    aboutTitle: "من نحن",
    aboutText1: "Elnour for STEEL هي علامة متخصصة في أعمال الديكور المنزلي المصنوعة من الاستيل عالي الجودة، المطلي بدهانات إلكتروستاتيك التي تضمن متانة ولوناً ثابتاً يدوم لسنوات طويلة.",
    aboutText2: "نحرص على تقديم أعمال فنية فاخرة تجمع بين الحرفة والذوق الرفيع، من طالبون وطرابيز وأعمال ديكور حائطية تناسب كل بيت.",

    // Contact
    contactTitle: "تواصل معنا",
    contactSubtitle: "نحن جاهزون لخدمتكم",
    contactWhatsApp: "واتساب",
    contactPhone: "اتصال",
    contactNote: "للاستفسار عن أي منتج أو طلب خاص",

    // Footer
    footerRights: "جميع الحقوق محفوظة",
    footerMadeWith: "مصنوع بحب",

    // Product Detail
    addToCart: "اطلب عبر واتساب",
    relatedProducts: "منتجات مشابهة",
    availableSizes: "المقاسات المتاحة",
    availableColors: "الألوان المتاحة",

    // Admin
    adminOverview: "نظرة عامة",
    adminOrders: "الطلبات",
    adminProducts: "المنتجات",
    adminGallery: "المعرض",
    adminTotalOrders: "إجمالي الطلبات",
    adminNewOrders: "طلبات جديدة",
    adminTotalRevenue: "الإيرادات الكلية",
    adminConversionRate: "نسبة التحويل",
    adminUniqueVisitors: "الزوار الفريدين",
    adminTodayPageviews: "زيارات اليوم",

    // Order Statuses
    statusNew: "جديد",
    statusContacted: "تم التواصل",
    statusConfirmed: "تم التأكيد",
    statusDelivered: "تم التوصيل",
    statusCancelled: "ملغى",
    statusAll: "كل الحالات",
    searchOrders: "ابحث بالاسم أو الهاتف...",
    tableView: "عرض جدول",
    kanbanView: "عرض لوحة",
    noOrders: "لا توجد طلبات",
    orderTableId: "#",
    orderTableCustomer: "العميل",
    orderTablePhone: "الهاتف",
    orderTableProduct: "المنتج",
    orderTablePrice: "السعر",
    orderTableSource: "المصدر",
    orderTableStatus: "الحالة",
    orderTableActions: "إجراءات",
    orderTableDate: "التاريخ",

    // Status Guide
    statusGuideTitle: "دليل حالات الطلبات",
    statusGuideNew: "وصل طلب جديد ولم يتم التواصل مع العميل بعد",
    statusGuideContacted: "تم التواصل مع العميل عبر واتساب أو الهاتف",
    statusGuideConfirmed: "العميل أكد الطلب وجاري التجهيز",
    statusGuideDelivered: "تم تسليم المنتج للعميل بنجاح",
    statusGuideCancelled: "تم إلغاء الطلب",

    // Products Admin
    addProduct: "إضافة منتج",
    editProduct: "تعديل منتج",
    productActive: "نشط",
    productInactive: "معطل",
    uploadImage: "رفع صورة",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من الحذف؟",

    // Gallery Admin
    addGalleryImage: "إضافة صورة",
    galleryImageTitle: "عنوان الصورة",

    // WhatsApp
    whatsappOrder: "احجز عبر واتساب",
  },
  en: {
    // Navbar
    navProducts: "Products",
    navGallery: "Our Work",
    navAbout: "About Us",
    navContact: "Contact",
    navLogin: "Sign In",
    navLogout: "Sign Out",
    navAdmin: "Dashboard",
    navLang: "ع",

    // Hero
    heroTagline: "Luxury Home Décor in Electrostatic-Coated Steel",
    heroDescription: "We craft premium home décor pieces from high-quality steel, coated with electrostatic paints that ensure lasting beauty and durability",
    heroBrowseProducts: "Browse Products",
    heroWhatsApp: "Contact on WhatsApp",
    heroFeatures1: "Premium Quality",
    heroFeatures1Desc: "High-end steel with electrostatic coating",
    heroFeatures2: "Exclusive Design",
    heroFeatures2Desc: "Unique artistic pieces for every home",
    heroFeatures3: "Custom Sizes",
    heroFeatures3Desc: "Tailored to your space",
    heroFeatures4: "Delivery",
    heroFeatures4Desc: "We deliver to your doorstep",

    // Products
    productsTitle: "Our Products",
    productsSubtitle: "Choose from our exclusive collection",
    orderNow: "Order Now",
    viewDetails: "Details",
    price: "Price",
    size: "Size",
    color: "Color",
    productNameAr: "Name in Arabic",
    productNameEn: "Name in English",
    description: "Description",
    category: "Category",

    // Order Form
    orderFormTitle: "Order Form",
    orderFormSubtitle: "Fill in your details and we will contact you",
    customerName: "Name",
    customerPhone: "Phone Number",
    customerAddress: "Address",
    orderMessage: "Additional Message",
    submitOrder: "Submit Order",
    orderSuccess: "Your order has been submitted! We will contact you soon",
    orderFailed: "An error occurred, please try again",
    backHome: "Back to Home",
    orderProduct: "Product",
    requiredName: "Name is required",
    requiredPhone: "Phone number is required",

    // Gallery
    galleryTitle: "Our Completed Work",
    gallerySubtitle: "Real projects we have crafted for our clients",

    // About
    aboutTitle: "About Us",
    aboutText1: "Elnour for STEEL specializes in luxury home décor pieces made from high-quality steel, coated with electrostatic paints that ensure durability and a lasting finish for years to come.",
    aboutText2: "We pride ourselves on delivering artistic works that combine craftsmanship with refined taste — from wall art and tables to bespoke décor pieces for every home.",

    // Contact
    contactTitle: "Contact Us",
    contactSubtitle: "We are ready to serve you",
    contactWhatsApp: "WhatsApp",
    contactPhone: "Call",
    contactNote: "For inquiries about any product or custom order",

    // Footer
    footerRights: "All rights reserved",
    footerMadeWith: "Made with love",

    // Product Detail
    addToCart: "Order via WhatsApp",
    relatedProducts: "Related Products",
    availableSizes: "Available Sizes",
    availableColors: "Available Colors",

    // Admin
    adminOverview: "Overview",
    adminOrders: "Orders",
    adminProducts: "Products",
    adminGallery: "Gallery",
    adminTotalOrders: "Total Orders",
    adminNewOrders: "New Orders",
    adminTotalRevenue: "Total Revenue",
    adminConversionRate: "Conversion Rate",
    adminUniqueVisitors: "Unique Visitors",
    adminTodayPageviews: "Today's Pageviews",

    // Order Statuses
    statusNew: "New",
    statusContacted: "Contacted",
    statusConfirmed: "Confirmed",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    statusAll: "All Statuses",
    searchOrders: "Search by name or phone...",
    tableView: "Table View",
    kanbanView: "Kanban View",
    noOrders: "No orders found",
    orderTableId: "#",
    orderTableCustomer: "Customer",
    orderTablePhone: "Phone",
    orderTableProduct: "Product",
    orderTablePrice: "Price",
    orderTableSource: "Source",
    orderTableStatus: "Status",
    orderTableActions: "Actions",
    orderTableDate: "Date",

    // Status Guide
    statusGuideTitle: "Order Status Guide",
    statusGuideNew: "New order arrived, not yet processed",
    statusGuideContacted: "Customer has been contacted via WhatsApp/phone",
    statusGuideConfirmed: "Customer confirmed, being prepared",
    statusGuideDelivered: "Product delivered successfully",
    statusGuideCancelled: "Order has been cancelled",

    // Products Admin
    addProduct: "Add Product",
    editProduct: "Edit Product",
    productActive: "Active",
    productInactive: "Inactive",
    uploadImage: "Upload Image",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete?",

    // Gallery Admin
    addGalleryImage: "Add Image",
    galleryImageTitle: "Image Title",

    // WhatsApp
    whatsappOrder: "Order via WhatsApp",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

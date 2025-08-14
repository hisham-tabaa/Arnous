# 🏦 Arnous Exchange Server - MongoDB Edition

## 📋 نظرة عامة

هذا هو الخادم المحسن لـ Arnous Exchange مع قاعدة بيانات MongoDB حقيقية. تم تطوير النظام ليكون جاهزاً للاستضافة الحقيقية مع ميزات أمان متقدمة وتتبع شامل للنشاطات.

## ✨ الميزات الجديدة

### 🔐 نظام مصادقة محسن
- **JWT Tokens**: مصادقة آمنة مع انتهاء صلاحية
- **إدارة المستخدمين**: أدوار وصلاحيات متعددة
- **حماية من الهجمات**: قفل الحسابات بعد محاولات فاشلة
- **تتبع النشاطات**: سجل شامل لجميع العمليات

### 🗄️ قاعدة بيانات MongoDB
- **نماذج منظمة**: Currency, User, ActivityLog
- **علاقات ذكية**: ربط المستخدمين بالنشاطات
- **تاريخ التحديثات**: تتبع جميع التغييرات
- **استعلامات متقدمة**: بحث وتصفية وإحصائيات

### 📊 تتبع النشاطات
- **سجل شامل**: جميع العمليات مسجلة
- **إحصائيات**: تحليل الأداء والنشاط
- **مراقبة الأمان**: تتبع محاولات الاختراق
- **تقارير**: بيانات مفصلة للمديرين

### 🚀 أداء محسن
- **Rate Limiting**: حماية من الطلبات المفرطة
- **Validation**: فحص شامل للبيانات
- **Error Handling**: معالجة أخطاء متقدمة
- **Real-time Updates**: تحديثات فورية عبر Socket.io

## 🛠️ المتطلبات

- **Node.js**: الإصدار 16 أو أحدث
- **MongoDB**: الإصدار 5.0 أو أحدث
- **npm**: لإدارة التبعيات

## 📦 التثبيت

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# نسخ ملف البيئة
copy env-example.txt .env

# تعديل ملف .env بإعدادات قاعدة البيانات
```

### 3. إعداد MongoDB
```bash
# بدء MongoDB (Windows)
net start MongoDB

# أو تثبيت MongoDB Atlas للاستضافة السحابية
```

### 4. تهيئة قاعدة البيانات
```bash
npm run db:init
```

## ⚙️ الإعدادات

### ملف .env
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/arnous_exchange
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/arnous_exchange

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## 🚀 التشغيل

### وضع التطوير
```bash
npm run dev
```

### وضع الإنتاج
```bash
npm start
```

### إعادة تعيين قاعدة البيانات
```bash
npm run db:reset
```

## 📊 نماذج قاعدة البيانات

### Currency Model
```javascript
{
  code: "USD",           // رمز العملة
  name: "US Dollar",     // اسم العملة
  buyRate: 15000,        // سعر الشراء
  sellRate: 15100,       // سعر البيع
  isActive: true,        // حالة العملة
  lastUpdated: Date,     // آخر تحديث
  updateHistory: [],     // تاريخ التحديثات
  createdBy: "admin"     // منشئ العملة
}
```

### User Model
```javascript
{
  username: "admin",     // اسم المستخدم
  email: "admin@arnous.com", // البريد الإلكتروني
  password: "hashed",    // كلمة المرور مشفرة
  role: "admin",         // الدور
  permissions: [],       // الصلاحيات
  isActive: true,        // حالة الحساب
  lastLogin: Date,       // آخر تسجيل دخول
  profile: {}            // معلومات الملف الشخصي
}
```

### ActivityLog Model
```javascript
{
  user: "userId",        // المستخدم
  action: "login",       // نوع العملية
  resource: "auth",      // المورد
  details: {},           // تفاصيل العملية
  ipAddress: "127.0.0.1", // عنوان IP
  status: "success",     // حالة العملية
  timestamp: Date        // التوقيت
}
```

## 🔌 API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/refresh` - تجديد التوكن
- `POST /api/auth/change-password` - تغيير كلمة المرور

### العملات
- `GET /api/currencies` - جلب جميع العملات
- `GET /api/currencies/:code` - جلب عملة محددة
- `POST /api/currencies` - تحديث أسعار العملات
- `POST /api/currencies/create` - إنشاء عملة جديدة
- `DELETE /api/currencies/:code` - حذف عملة
- `GET /api/currencies/:code/history` - تاريخ العملة
- `GET /api/currencies/stats/overview` - إحصائيات عامة
- `GET /api/currencies/search` - البحث في العملات

### وسائل التواصل الاجتماعي
- `POST /api/generate-message` - إنشاء رسالة
- `POST /api/publish/facebook` - نشر على Facebook
- `POST /api/publish/instagram` - نشر على Instagram
- `POST /api/publish/telegram` - نشر على Telegram
- `POST /api/publish/whatsapp` - نشر على WhatsApp

### النشاطات والإحصائيات
- `GET /api/activity/logs` - سجل النشاطات
- `GET /api/activity/stats` - إحصائيات النشاطات

### إدارة المستخدمين
- `GET /api/users/profile` - الملف الشخصي
- `PUT /api/users/profile` - تحديث الملف الشخصي

## 🔒 الأمان

### المصادقة
- **JWT Tokens**: توكنات آمنة مع انتهاء صلاحية
- **Password Hashing**: تشفير كلمات المرور بـ bcrypt
- **Rate Limiting**: حماية من الطلبات المفرطة
- **Account Locking**: قفل الحسابات بعد محاولات فاشلة

### الصلاحيات
- **Role-based Access**: أدوار مختلفة (admin, user, moderator)
- **Permission System**: صلاحيات محددة لكل عملية
- **Resource Protection**: حماية الموارد حسب الصلاحيات

### المراقبة
- **Activity Logging**: تسجيل جميع العمليات
- **Security Monitoring**: مراقبة محاولات الاختراق
- **Audit Trail**: مسار تدقيق شامل

## 📈 الأداء

### قاعدة البيانات
- **Indexing**: فهارس محسنة للاستعلامات السريعة
- **Connection Pooling**: تجميع الاتصالات
- **Query Optimization**: تحسين الاستعلامات

### التخزين المؤقت
- **Memory Caching**: تخزين مؤقت في الذاكرة
- **Response Caching**: تخزين مؤقت للاستجابات
- **Database Caching**: تخزين مؤقت لقاعدة البيانات

## 🚀 النشر للإنتاج

### 1. إعداد البيئة
```bash
NODE_ENV=production
MONGODB_URI_PROD=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
```

### 2. بناء التطبيق
```bash
npm run build
```

### 3. تشغيل الخادم
```bash
npm start
```

### 4. مراقبة الأداء
```bash
# مراقبة السجلات
tail -f logs/app.log

# مراقبة قاعدة البيانات
mongo --eval "db.stats()"
```

## 🐛 استكشاف الأخطاء

### مشاكل الاتصال بقاعدة البيانات
```bash
# فحص حالة MongoDB
mongo --eval "db.runCommand('ping')"

# فحص الاتصال
npm run db:init
```

### مشاكل المصادقة
```bash
# فحص التوكن
curl -H "Authorization: Bearer YOUR_TOKEN" /api/health

# إعادة تعيين كلمة المرور
npm run db:reset
```

### مشاكل الأداء
```bash
# فحص السجلات
tail -f logs/error.log

# مراقبة الذاكرة
node --inspect index.js
```

## 📚 الموارد الإضافية

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [JWT Documentation](https://jwt.io/)
- [Socket.io Documentation](https://socket.io/docs/)

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. إنشاء Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## 📞 الدعم

للأسئلة والدعم، يرجى التواصل عبر:
- 📧 البريد الإلكتروني: support@arnous.com
- 💬 Telegram: @arnous_support
- 📱 WhatsApp: +963-XXX-XXX-XXX

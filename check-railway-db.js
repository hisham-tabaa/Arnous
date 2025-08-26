const mongoose = require('mongoose');

// تكوين الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    // استخدم متغير البيئة MONGODB_URI من Railway
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ خطأ: MONGODB_URI غير محدد في متغيرات البيئة');
      console.log('💡 تأكد من إضافة MONGODB_URI في Railway Variables');
      return;
    }

    console.log('🔌 محاولة الاتصال بقاعدة البيانات...');
    console.log('📍 URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // إخفاء كلمة المرور
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // التحقق من العملات الموجودة
    const Currency = require('./server/models/Currency');
    const currencies = await Currency.find({}).sort({ code: 1 });
    
    console.log('\n📊 العملات الموجودة في قاعدة البيانات:');
    console.log('='.repeat(60));
    
    if (currencies.length === 0) {
      console.log('⚠️  لا توجد عملات في قاعدة البيانات!');
    } else {
      currencies.forEach((currency, index) => {
        console.log(`${index + 1}. ${currency.code} - ${currency.name}`);
        console.log(`   💰 Buy Rate: ${currency.buyRate}`);
        console.log(`   💸 Sell Rate: ${currency.sellRate}`);
        console.log(`   📅 Last Updated: ${currency.lastUpdated}`);
        console.log('   ' + '-'.repeat(40));
      });
      
      console.log(`\n📈 إجمالي العملات: ${currencies.length}`);
      
      // التحقق من العملات الجديدة
      const expectedCurrencies = ['USD', 'EUR', 'GBP', 'TRY', 'JPY', 'SAR', 'JOD', 'KWD'];
      const missingCurrencies = expectedCurrencies.filter(code => 
        !currencies.find(c => c.code === code)
      );
      
      if (missingCurrencies.length > 0) {
        console.log('\n❌ العملات المفقودة:');
        missingCurrencies.forEach(code => console.log(`   - ${code}`));
      } else {
        console.log('\n✅ جميع العملات المطلوبة موجودة!');
      }
    }
    
    // التحقق من اتصال Socket.io
    console.log('\n🔌 فحص اتصال Socket.io...');
    console.log('💡 تأكد من أن الخادم يعمل ويستمع على المنفذ الصحيح');
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 تأكد من صحة عنوان قاعدة البيانات');
    } else if (error.message.includes('Authentication failed')) {
      console.log('💡 تأكد من صحة اسم المستخدم وكلمة المرور');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 تأكد من أن قاعدة البيانات تعمل');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
    process.exit(0);
  }
};

// تشغيل السكريبت
connectDB();

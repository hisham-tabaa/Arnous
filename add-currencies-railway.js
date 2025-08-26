const mongoose = require('mongoose');

// تكوين الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ خطأ: MONGODB_URI غير محدد في متغيرات البيئة');
      console.log('💡 تأكد من إضافة MONGODB_URI في Railway Variables');
      return;
    }

    console.log('🔌 محاولة الاتصال بقاعدة البيانات...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    
    // استيراد نموذج العملة
    const Currency = require('./server/models/Currency');
    
    // تعريف العملات الجديدة
    const newCurrencies = [
      {
        code: 'JPY',
        name: 'Japanese Yen',
        buyRate: 0.0067,
        sellRate: 0.0065,
        lastUpdated: new Date()
      },
      {
        code: 'SAR',
        name: 'Saudi Riyal',
        buyRate: 0.27,
        sellRate: 0.26,
        lastUpdated: new Date()
      },
      {
        code: 'JOD',
        name: 'Jordanian Dinar',
        buyRate: 1.41,
        sellRate: 1.39,
        lastUpdated: new Date()
      },
      {
        code: 'KWD',
        name: 'Kuwaiti Dinar',
        buyRate: 3.25,
        sellRate: 3.23,
        lastUpdated: new Date()
      }
    ];
    
    console.log('\n🔄 إضافة العملات الجديدة...');
    
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const currencyData of newCurrencies) {
      try {
        // التحقق من وجود العملة
        const existingCurrency = await Currency.findOne({ code: currencyData.code });
        
        if (existingCurrency) {
          console.log(`⚠️  العملة ${currencyData.code} موجودة بالفعل`);
          // تحديث البيانات إذا لزم الأمر
          await Currency.updateOne(
            { code: currencyData.code },
            { 
              $set: {
                name: currencyData.name,
                lastUpdated: new Date()
              }
            }
          );
          updatedCount++;
        } else {
          // إنشاء عملة جديدة
          const newCurrency = new Currency(currencyData);
          await newCurrency.save();
          console.log(`✅ تم إضافة العملة ${currencyData.code} - ${currencyData.name}`);
          addedCount++;
        }
      } catch (error) {
        console.error(`❌ خطأ في إضافة العملة ${currencyData.code}:`, error.message);
      }
    }
    
    console.log('\n📊 ملخص العملية:');
    console.log(`   ✅ تم إضافة ${addedCount} عملة جديدة`);
    console.log(`   🔄 تم تحديث ${updatedCount} عملة موجودة`);
    
    // عرض جميع العملات
    const allCurrencies = await Currency.find({}).sort({ code: 1 });
    console.log('\n📋 جميع العملات في قاعدة البيانات:');
    console.log('='.repeat(60));
    
    allCurrencies.forEach((currency, index) => {
      console.log(`${index + 1}. ${currency.code} - ${currency.name}`);
      console.log(`   💰 Buy Rate: ${currency.buyRate}`);
      console.log(`   💸 Sell Rate: ${currency.sellRate}`);
      console.log(`   📅 Last Updated: ${currency.lastUpdated}`);
      console.log('   ' + '-'.repeat(40));
    });
    
    console.log(`\n📈 إجمالي العملات: ${allCurrencies.length}`);
    
    if (allCurrencies.length >= 8) {
      console.log('\n🎉 تم إضافة جميع العملات المطلوبة بنجاح!');
      console.log('💡 الآن يمكن للمستخدمين رؤية العملات الجديدة');
    } else {
      console.log('\n⚠️  لا تزال بعض العملات مفقودة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في العملية:', error.message);
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

# 🐳 Docker Setup Guide

## 📋 نظرة عامة

هذا الدليل يشرح كيفية إعداد وتشغيل قاعدة البيانات باستخدام Docker. يتضمن MongoDB و Redis و Mongo Express.

## 🛠️ المتطلبات

- **Docker**: الإصدار 20.10 أو أحدث
- **Docker Compose**: الإصدار 2.0 أو أحدث
- **Node.js**: الإصدار 16 أو أحدث

## 🚀 التشغيل السريع

### 1. تشغيل قاعدة البيانات
```bash
# تشغيل جميع الخدمات
docker-compose up -d

# أو تشغيل MongoDB فقط
docker-compose up -d mongodb
```

### 2. فحص حالة الخدمات
```bash
docker-compose ps
```

### 3. عرض السجلات
```bash
# جميع الخدمات
docker-compose logs

# خدمة محددة
docker-compose logs mongodb
docker-compose logs mongo-express
docker-compose logs redis
```

## 📊 الخدمات المتاحة

### MongoDB
- **Port**: 27017
- **Database**: arnous_exchange
- **Username**: arnous_user
- **Password**: arnous_password_123
- **Connection String**: `mongodb://arnous_user:arnous_password_123@localhost:27017/arnous_exchange?authSource=arnous_exchange`

### Mongo Express (واجهة الويب)
- **Port**: 8081
- **URL**: http://localhost:8081
- **Username**: admin
- **Password**: admin123

### Redis
- **Port**: 6379
- **Connection String**: `redis://localhost:6379`

## 🔧 الإعدادات

### ملف docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: arnous_mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: arnous_exchange
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - arnous_network
    command: mongod --auth --bind_ip_all
```

### ملف .env
```env
# MongoDB Configuration (Docker)
MONGODB_URI=mongodb://arnous_user:arnous_password_123@localhost:27017/arnous_exchange?authSource=arnous_exchange

# Redis Configuration (Docker)
REDIS_URL=redis://localhost:6379
```

## 📝 أوامر مفيدة

### إدارة الحاويات
```bash
# تشغيل الخدمات
docker-compose up -d

# إيقاف الخدمات
docker-compose down

# إعادة تشغيل خدمة محددة
docker-compose restart mongodb

# إيقاف وإزالة الحاويات والحجم
docker-compose down -v
```

### إدارة قاعدة البيانات
```bash
# الدخول إلى MongoDB
docker exec -it arnous_mongodb mongosh -u arnous_user -p arnous_password_123 --authenticationDatabase arnous_exchange

# عرض قواعد البيانات
show dbs

# استخدام قاعدة البيانات
use arnous_exchange

# عرض المجموعات
show collections

# عرض المستندات
db.currencies.find()
```

### النسخ الاحتياطي
```bash
# إنشاء نسخة احتياطية
docker exec arnous_mongodb mongodump --db arnous_exchange --out /data/backup

# استعادة نسخة احتياطية
docker exec arnous_mongodb mongorestore --db arnous_exchange /data/backup/arnous_exchange
```

## 🔍 استكشاف الأخطاء

### مشاكل الاتصال
```bash
# فحص حالة الحاويات
docker-compose ps

# فحص السجلات
docker-compose logs mongodb

# فحص الشبكة
docker network ls
docker network inspect arnous_arnous_network
```

### مشاكل MongoDB
```bash
# فحص الاتصال
docker exec arnous_mongodb mongosh --eval "db.runCommand('ping')"

# فحص المستخدمين
docker exec arnous_mongodb mongosh --eval "db.getUsers()"

# فحص الصلاحيات
docker exec arnous_mongodb mongosh --eval "db.getRole('readWrite')"
```

### مشاكل Redis
```bash
# فحص الاتصال
docker exec arnous_redis redis-cli ping

# فحص المعلومات
docker exec arnous_redis redis-cli info
```

## 📈 مراقبة الأداء

### MongoDB
```bash
# إحصائيات قاعدة البيانات
docker exec arnous_mongodb mongosh --eval "db.stats()"

# إحصائيات المجموعات
docker exec arnous_mongodb mongosh --eval "db.currencies.stats()"

# مراقبة العمليات
docker exec arnous_mongodb mongosh --eval "db.currentOp()"
```

### Redis
```bash
# إحصائيات Redis
docker exec arnous_redis redis-cli info memory

# مراقبة الأداء
docker exec arnous_redis redis-cli monitor
```

## 🚀 النشر للإنتاج

### 1. تعديل الإعدادات
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mongodb:
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    volumes:
      - /data/mongodb:/data/db
      - /data/mongodb_config:/data/configdb
    restart: always
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 2. متغيرات البيئة
```env
# .env.production
MONGO_ROOT_USERNAME=your_production_username
MONGO_ROOT_PASSWORD=your_production_password
REDIS_PASSWORD=your_production_redis_password
```

### 3. تشغيل الإنتاج
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 الأمان

### تغيير كلمات المرور
```bash
# تغيير كلمة مرور MongoDB
docker exec arnous_mongodb mongosh --eval "
  db.changeUserPassword('arnous_user', 'new_password')
"

# تغيير كلمة مرور Redis
docker exec arnous_redis redis-cli CONFIG SET requirepass "new_password"
```

### تقييد الوصول
```yaml
# في docker-compose.yml
services:
  mongodb:
    ports:
      - "127.0.0.1:27017:27017"  # تقييد الوصول للمضيف المحلي فقط
```

## 📚 موارد إضافية

- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Mongo Express Docker Hub](https://hub.docker.com/_/mongo-express)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🤝 الدعم

للأسئلة والمشاكل:
1. فحص السجلات: `docker-compose logs`
2. فحص حالة الحاويات: `docker-compose ps`
3. إعادة تشغيل الخدمات: `docker-compose restart`
4. مراجعة هذا الدليل
